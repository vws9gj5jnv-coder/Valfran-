import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { customers, quotes } from '@/db/schema';
import { getQuoteWithLines } from './service';
import { renderQuotePdf } from './pdf';
import { getSetting } from '@/modules/settings/repo';
import { env } from '@/lib/env';

export async function quotePdfResponse(where: { id?: string; token?: string }) {
  const db = await getDb();
  const q = (await db.select().from(quotes).where(where.id ? eq(quotes.id, where.id) : eq(quotes.publicToken, where.token!)))[0];
  if (!q) return new Response('Introuvable', { status: 404 });
  const full = await getQuoteWithLines(q.id);
  const c = (await db.select().from(customers).where(eq(customers.id, q.customerId)))[0];
  const biz = await getSetting('business');
  const bytes = await renderQuotePdf({ q, lines: full!.lines, c, biz, demo: env.demoMode && q.isDemo });
  return new Response(Buffer.from(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="devis-${q.number}.pdf"`, 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' } });
}
