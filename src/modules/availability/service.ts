import { and, gt, lt, inArray, isNotNull } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { bookings, closures } from '@/db/schema';
import { getSetting } from '@/modules/settings/repo';
import { computeWindows, type Busy } from './windows';

export async function getBusy(from: Date, to: Date) {
  const db = await getDb();
  const confirmed = await db
    .select({ start: bookings.scheduledStart, end: bookings.scheduledEnd, travel: bookings.travelMinutes })
    .from(bookings)
    .where(and(inArray(bookings.status, ['confirmee']), isNotNull(bookings.scheduledStart), lt(bookings.scheduledStart, to), gt(bookings.scheduledEnd, from)));
  const busy: Busy[] = confirmed.map((b) => ({
    start: new Date(b.start!.getTime() - (b.travel ?? 0) * 60000),
    end: b.end!,
  }));
  const off = await db.select().from(closures).where(and(lt(closures.startsAt, to), gt(closures.endsAt, from)));
  return { busy, closures: off.map((c) => ({ start: c.startsAt, end: c.endsAt })) };
}

export async function getAvailableWindows(durationMinutes: number, now = new Date()) {
  const settings = await getSetting('availability');
  const to = new Date(now.getTime() + (settings.daysAhead + 1) * 86400_000);
  const { busy, closures: off } = await getBusy(now, to);
  return computeWindows({ settings, now, durationMinutes, busy, closures: off });
}
