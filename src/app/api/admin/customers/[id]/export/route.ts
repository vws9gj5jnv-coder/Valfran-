import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { customers, vehicles, bookings, quotes } from '@/db/schema';
import { currentAdmin, audit } from '@/modules/auth/session';

/** Export des données d'un client (droit d'accès / portabilité). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentAdmin();
  if (!me) return new Response('Non autorisé', { status: 401 });
  const id = (await params).id;
  const db = await getDb();
  const c = (await db.select().from(customers).where(eq(customers.id, id)))[0];
  if (!c) return new Response('Introuvable', { status: 404 });
  const data = {
    exportedAt: new Date().toISOString(),
    customer: c,
    vehicles: await db.select().from(vehicles).where(eq(vehicles.customerId, id)),
    bookings: (await db.select().from(bookings).where(eq(bookings.customerId, id))).map(({ publicToken, idempotencyKey, internalNotes, ...rest }) => { void publicToken; void idempotencyKey; void internalNotes; return rest; }),
    quotes: (await db.select().from(quotes).where(eq(quotes.customerId, id))).map(({ publicToken, acceptedIpHash, ...rest }) => { void publicToken; void acceptedIpHash; return rest; }),
  };
  await audit(me.email, 'customer_exported', 'customer', id);
  return new Response(JSON.stringify(data, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="client-${id}.json"`, 'Cache-Control': 'no-store' } });
}
