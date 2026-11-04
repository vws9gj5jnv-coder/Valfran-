import { and, eq, gte, isNotNull } from 'drizzle-orm';
import { timingSafeEqual } from 'node:crypto';
import { getDb } from '@/db/client';
import { bookings, customers } from '@/db/schema';
import { buildIcs } from '@/modules/calendar/ics';
import { listServices } from '@/modules/settings/repo';
import { env } from '@/lib/env';
import { formatPhone } from '@/lib/text';

/** Flux privé : protégé par un jeton secret (CALENDAR_FEED_TOKEN). Désactivé si le jeton n'est pas défini. */
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token.replace(/\.ics$/, '');
  const expected = env.calendarFeedToken;
  if (!expected || expected.length < 24 || token.length !== expected.length || !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) return new Response('Introuvable', { status: 404 });
  const db = await getDb();
  const since = new Date(Date.now() - 30 * 86400_000);
  const rows = await db.select({ b: bookings, c: customers }).from(bookings).innerJoin(customers, eq(bookings.customerId, customers.id))
    .where(and(eq(bookings.status, 'confirmee'), isNotNull(bookings.scheduledStart), gte(bookings.scheduledStart, since)));
  const services = await listServices({ includeInactive: true });
  const ics = buildIcs('VALFRAN — interventions', rows.map(({ b, c }) => ({
    uid: `${b.id}@valfran`, start: b.scheduledStart!, end: b.scheduledEnd ?? new Date(b.scheduledStart!.getTime() + 3600_000),
    summary: `${b.serviceSlugs.map((s) => services.find((x) => x.slug === s)?.name ?? s).join(', ')} — ${c.name}`,
    location: `${b.address}, ${b.postcode} ${b.city}`,
    description: `Réf. ${b.reference}\nTél. ${formatPhone(c.phone)}\n${env.siteUrl}/admin/demandes/${b.id}`,
  })));
  return new Response(ics, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, max-age=300' } });
}
