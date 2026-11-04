import { z } from 'zod';
import { getDb } from '@/db/client';
import { messages } from '@/db/schema';
import { getSetting } from '@/modules/settings/repo';
import { notify } from '@/modules/notifications/notify';
import { rateLimit, clientIp, fingerprint } from '@/modules/security/rate-limit';
import { json, forbidden, sameOrigin, readJson } from '@/lib/http';
import { newId } from '@/lib/ids';
import { env } from '@/lib/env';

const schema = z.object({
  name: z.string().trim().min(2, 'Indiquez votre nom.').max(100),
  phone: z.string().trim().max(20).default(''),
  email: z.union([z.literal(''), z.string().trim().email('Adresse e-mail invalide.').max(120)]).default(''),
  body: z.string().trim().min(5, 'Votre message est trop court.').max(3000),
  consent: z.literal(true, { message: 'Votre accord est nécessaire.' }),
  website: z.string().max(0).optional(),
}).refine((v) => v.phone || v.email, { message: 'Indiquez un téléphone ou un e-mail pour que nous puissions vous répondre.', path: ['phone'] });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const rl = await rateLimit(`contact:${fingerprint(clientIp(req.headers))}`, 6, 3600);
  if (!rl.ok) return json({ ok: false, message: 'Trop de messages envoyés. Merci de nous appeler.' }, 429);
  const parsed = schema.safeParse(await readJson(req, 10_000).catch(() => null));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[i.path.join('.')] ??= i.message;
    return json({ ok: false, fieldErrors }, 422);
  }
  const d = parsed.data;
  const db = await getDb();
  const id = newId();
  await db.insert(messages).values({ id, name: d.name, phone: d.phone, email: d.email, body: d.body });
  const biz = await getSetting('business');
  const to = env.adminNotifyEmail || biz.email;
  if (to) await notify({ channel: 'email', to, subject: `Message de ${d.name}`, body: `${d.body}\n\n${d.name} — ${d.phone} ${d.email}`, replyTo: d.email || undefined });
  return json({ ok: true }, 201);
}
