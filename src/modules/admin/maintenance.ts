'use server';

import { and, eq, isNull, lt, notInArray, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { attachments, customers, bookings, sessions, rateLimits } from '@/db/schema';
import { requireAdmin, audit } from '@/modules/auth/session';
import { getSettings } from '@/modules/settings/repo';
import { getStorage } from '@/modules/storage/storage';
import type { ActionResult } from '@/components/admin/ActionForm';

/**
 * Application de la politique de conservation :
 * - photos envoyées mais jamais rattachées à une demande (plus de 24 h) : supprimées ;
 * - prospects sans intervention terminée et sans activité depuis la durée retenue : anonymisés ;
 * - sessions expirées et compteurs anti-abus anciens : supprimés.
 */
export async function runRetention(_: ActionResult): Promise<ActionResult> {
  const me = await requireAdmin();
  const db = await getDb();
  const s = await getSettings();
  const orphanLimit = new Date(Date.now() - 24 * 3600_000);
  const orphans = await db.select().from(attachments).where(and(isNull(attachments.bookingId), isNull(attachments.realisationId), lt(attachments.createdAt, orphanLimit)));
  for (const o of orphans) await getStorage().remove(o.storageKey).catch(() => {});
  if (orphans.length) await db.delete(attachments).where(and(isNull(attachments.bookingId), isNull(attachments.realisationId), lt(attachments.createdAt, orphanLimit)));

  const prospectLimit = new Date(Date.now() - s.retention.prospectMonths * 30 * 86400_000);
  const customerLimit = new Date(Date.now() - s.retention.customerMonths * 30 * 86400_000);
  const active = db.select({ id: bookings.customerId }).from(bookings).where(sql`${bookings.updatedAt} >= ${prospectLimit} or (${bookings.status} = 'terminee' and ${bookings.updatedAt} >= ${customerLimit})`);
  const stale = await db.select({ id: customers.id }).from(customers).where(and(isNull(customers.anonymizedAt), lt(customers.updatedAt, prospectLimit), notInArray(customers.id, active)));
  for (const c of stale) {
    await db.update(bookings).set({ address: '[anonymisé]', description: '', internalNotes: '', availabilityNote: '', lat: null, lon: null }).where(eq(bookings.customerId, c.id));
    await db.update(customers).set({ name: 'Client anonymisé', phone: '0000000000', email: null, address: '', notes: '', anonymizedAt: new Date() }).where(eq(customers.id, c.id));
  }
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  await db.delete(rateLimits).where(lt(rateLimits.windowStart, new Date(Date.now() - 2 * 86400_000)));
  await audit(me.email, 'retention_run', 'system');
  return { ok: true, message: `${orphans.length} photo(s) orpheline(s) supprimée(s), ${stale.length} fiche(s) anonymisée(s).` };
}
