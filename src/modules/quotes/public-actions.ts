'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { quotes, bookings } from '@/db/schema';
import { quoteEvent } from './service';
import { isQuoteExpired } from './totals';
import { clientIp, fingerprint, rateLimit } from '@/modules/security/rate-limit';
import { notify } from '@/modules/notifications/notify';
import { getSetting } from '@/modules/settings/repo';
import { env } from '@/lib/env';

export type PublicQuoteState = { ok?: boolean; error?: string; decision?: 'accepte' | 'refuse' };

/** Acceptation ou refus en ligne, traçable : nom saisi, horodatage, empreinte IP et navigateur. */
export async function respondToQuote(_: PublicQuoteState, form: FormData): Promise<PublicQuoteState> {
  const token = String(form.get('token') ?? '');
  const decision = String(form.get('decision')) === 'refuse' ? 'refuse' : 'accepte';
  const name = String(form.get('name') ?? '').trim().slice(0, 100);
  const h = await headers();
  const rl = await rateLimit(`quote:${fingerprint(clientIp(h))}`, 20, 3600);
  if (!rl.ok) return { error: 'Trop de tentatives. Réessayez plus tard.' };
  if (decision === 'accepte' && (name.length < 2 || form.get('agree') !== 'on')) return { error: 'Indiquez votre nom et cochez la case d’accord.' };
  const db = await getDb();
  const q = (await db.select().from(quotes).where(eq(quotes.publicToken, token)))[0];
  if (!q) return { error: 'Devis introuvable.' };
  if (q.status !== 'envoye') return { error: q.status === 'accepte' ? 'Ce devis a déjà été accepté.' : 'Ce devis ne peut plus être accepté en ligne. Contactez-nous.' };
  if (isQuoteExpired(q)) return { error: 'Ce devis a expiré. Contactez-nous pour une mise à jour.' };
  if (decision === 'accepte') {
    await db.update(quotes).set({ status: 'accepte', acceptedAt: new Date(), acceptedByName: name, acceptedIpHash: fingerprint(clientIp(h)), acceptedUserAgent: (h.get('user-agent') ?? '').slice(0, 250), updatedAt: new Date() }).where(eq(quotes.id, q.id));
    if (q.bookingId) await db.update(bookings).set({ status: 'a_etudier', updatedAt: new Date() }).where(eq(bookings.id, q.bookingId));
  } else {
    await db.update(quotes).set({ status: 'refuse', refusedAt: new Date(), updatedAt: new Date() }).where(eq(quotes.id, q.id));
  }
  await quoteEvent(q.id, decision === 'accepte' ? 'accepted_online' : 'refused_online', 'client', name);
  const biz = await getSetting('business');
  const to = env.adminNotifyEmail || biz.email;
  if (to) await notify({ channel: 'email', to, subject: `Devis ${q.number} ${decision === 'accepte' ? 'accepté' : 'refusé'} en ligne`, body: `Le devis ${q.number} a été ${decision === 'accepte' ? `accepté par ${name}` : 'refusé'}.`, quoteId: q.id });
  revalidatePath(`/devis/${token}`);
  return { ok: true, decision };
}
