import type { AvailabilitySettings } from '@/modules/settings/schema';

/**
 * Créneaux proposés au client : des demi-journées (« matin », « après-midi »), plus simples à choisir
 * et plus réalistes pour une activité itinérante. Un créneau est proposé s'il reste assez de temps
 * de travail après déduction des interventions confirmées et des indisponibilités.
 * Le client exprime une préférence : le rendez-vous reste « à confirmer ».
 */
export interface Window {
  id: string; // ISO de début
  date: string; // AAAA-MM-JJ (heure de Paris)
  label: string; // Matin / Après-midi
  start: string; // HH:MM
  end: string;
  startIso: string;
  endIso: string;
  available: boolean;
}

export interface Busy { start: Date; end: Date }

/** Décalage UTC (minutes) d'un fuseau à une date donnée, sans dépendance externe. */
export function tzOffsetMinutes(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** Convertit une date/heure locale (fuseau donné) en instant UTC. */
export function zonedToUtc(dateStr: string, time: string, timeZone: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm));
  const off = tzOffsetMinutes(guess, timeZone);
  const res = new Date(guess.getTime() - off * 60000);
  const off2 = tzOffsetMinutes(res, timeZone);
  return off2 === off ? res : new Date(guess.getTime() - off2 * 60000);
}

export function localDateParts(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
  const p = Object.fromEntries(dtf.formatToParts(date).map((x) => [x.type, x.value]));
  const iso = `${p.year}-${p.month}-${p.day}`;
  const wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday) + 1;
  return { iso, weekday: wd };
}

const minutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const overlap = (a0: number, a1: number, b0: number, b1: number) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));

export function computeWindows(opts: {
  settings: AvailabilitySettings;
  now: Date;
  durationMinutes: number;
  busy: Busy[];
  closures: Busy[];
}): Window[] {
  const { settings, now, durationMinutes, busy, closures } = opts;
  const tz = settings.timezone;
  const out: Window[] = [];
  const earliest = now.getTime() + settings.minNoticeHours * 3600_000;
  const need = Math.min(durationMinutes, 8 * 60);
  for (let i = 0; i <= settings.daysAhead; i++) {
    const day = new Date(now.getTime() + i * 86400_000);
    const { iso, weekday } = localDateParts(day, tz);
    if (out.some((w) => w.date === iso)) continue;
    const ranges = settings.weekly[String(weekday)] ?? [];
    for (const r of ranges) {
      const start = zonedToUtc(iso, r.start, tz);
      const end = zonedToUtc(iso, r.end, tz);
      const total = (end.getTime() - start.getTime()) / 60000;
      const blocked = [...busy, ...closures].reduce((acc, b) => acc + overlap(start.getTime(), end.getTime(), b.start.getTime(), b.end.getTime()) / 60000, 0);
      const free = total - blocked;
      const fullyClosed = closures.some((c) => c.start <= start && c.end >= end);
      const tooLate = end.getTime() - need * 60000 < earliest;
      out.push({
        id: start.toISOString(),
        date: iso,
        label: minutes(r.start) < 12 * 60 ? 'Matin' : 'Après-midi',
        start: r.start,
        end: r.end,
        startIso: start.toISOString(),
        endIso: end.toISOString(),
        available: !fullyClosed && !tooLate && (free >= need || (need > total && free >= total)),
      });
    }
  }
  return out;
}
