import { asc, eq, sql } from 'drizzle-orm';
import { getDb, type DB } from '@/db/client';
import { quotes, quoteLines, quoteEvents } from '@/db/schema';
import { computeTotals } from './totals';

export async function nextQuoteNumber(db: DB, date = new Date()) {
  const year = date.getFullYear();
  const res = await db.execute<{ value: number }>(sql`insert into counters (key, value) values (${`quote-${year}`}, 1) on conflict (key) do update set value = counters.value + 1 returning value`);
  const row = Array.isArray(res) ? res[0] : (res as unknown as { rows: { value: number }[] }).rows[0];
  return `D-${year}-${String(Number(row.value)).padStart(4, '0')}`;
}

export async function getQuoteWithLines(id: string) {
  const db = await getDb();
  const q = (await db.select().from(quotes).where(eq(quotes.id, id)))[0];
  if (!q) return null;
  const lines = await db.select().from(quoteLines).where(eq(quoteLines.quoteId, id)).orderBy(asc(quoteLines.sortOrder));
  return { q, lines };
}

export async function recomputeQuote(db: DB, id: string) {
  const q = (await db.select().from(quotes).where(eq(quotes.id, id)))[0];
  const lines = await db.select().from(quoteLines).where(eq(quoteLines.quoteId, id));
  const t = computeTotals(lines.map((l) => ({ quantity: Number(l.quantity), unitPriceHtCents: l.unitPriceHtCents, vatRate: Number(l.vatRate) })), q.vatMode as 'franchise' | 'normal');
  await db.update(quotes).set({ ...t, updatedAt: new Date() }).where(eq(quotes.id, id));
  return t;
}

export async function quoteEvent(quoteId: string, type: string, actor: string, note = '') {
  const db = await getDb();
  await db.insert(quoteEvents).values({ quoteId, type, actor, note });
}
