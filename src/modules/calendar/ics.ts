/** Génération d'un flux iCalendar (RFC 5545) des rendez-vous confirmés, abonnable depuis Google Agenda, Apple Calendrier, Outlook. */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const fold = (line: string) => { const out: string[] = []; let l = line; while (l.length > 74) { out.push(l.slice(0, 74)); l = ' ' + l.slice(74); } out.push(l); return out.join('\r\n'); };

export interface IcsEvent { uid: string; start: Date; end: Date; summary: string; location: string; description: string }

export function buildIcs(name: string, events: IcsEvent[]) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//VALFRAN//Planning//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc(name)}`];
  for (const e of events) {
    lines.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(e.start)}`, `DTEND:${stamp(e.end)}`, `SUMMARY:${esc(e.summary)}`, `LOCATION:${esc(e.location)}`, `DESCRIPTION:${esc(e.description)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
