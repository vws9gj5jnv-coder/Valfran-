import { PDFDocument, StandardFonts, rgb, degrees, type PDFFont, type PDFPage } from 'pdf-lib';
import type { quotes, quoteLines, customers } from '@/db/schema';
import type { BusinessSettings } from '@/modules/settings/schema';
import { LINE_KINDS, type LineKind } from './totals';

type Q = typeof quotes.$inferSelect;
type L = typeof quoteLines.$inferSelect;
type C = typeof customers.$inferSelect;

/** Les polices standard PDF (WinAnsi) ne couvrent pas certains espaces typographiques. */
const clean = (s: string) => s.replace(/[   ]/g, ' ').replace(/[–—]/g, '-').replace(/[^\x20-\x7E -ÿŒœ€‘’“”…]/g, '');
const money = (cents: number) => clean(new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100));
const date = (d: Date | null) => (d ? new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'long' }).format(d) : '-');

const INK = rgb(0.067, 0.071, 0.086);
const MUTE = rgb(0.38, 0.39, 0.42);
const LINE = rgb(0.85, 0.85, 0.84);
const ACCENT = rgb(0.694, 0.592, 0.463);

function wrap(text: string, font: PDFFont, size: number, max: number) {
  const words = clean(text).split(/\s+/);
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) > max && cur) { out.push(cur); cur = w; } else cur = t;
  }
  if (cur) out.push(cur);
  return out;
}

export async function renderQuotePdf({ q, lines, c, biz, demo }: { q: Q; lines: L[]; c: C; biz: BusinessSettings; demo: boolean }) {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Devis ${q.number}`);
  pdf.setAuthor(biz.legalName || biz.name);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28, H = 841.89, M = 48;
  let page: PDFPage = pdf.addPage([W, H]);
  let y = H - M;
  const text = (s: string, x: number, yy: number, o: { size?: number; f?: PDFFont; color?: ReturnType<typeof rgb>; right?: boolean } = {}) => {
    const size = o.size ?? 9.5, f = o.f ?? font, t = clean(s);
    page.drawText(t, { x: o.right ? x - f.widthOfTextAtSize(t, size) : x, y: yy, size, font: f, color: o.color ?? INK });
  };
  const missing = (v: string, label: string) => v || `[à compléter : ${label}]`;

  if (demo) {
    page.drawText('DOCUMENT DE DEMONSTRATION', { x: 120, y: 380, size: 36, font: bold, color: rgb(0.9, 0.86, 0.8), rotate: degrees(35) });
  }

  // En-tête
  text(biz.name.toUpperCase(), M, y, { size: 16, f: bold });
  page.drawLine({ start: { x: M, y: y - 8 }, end: { x: M + 40, y: y - 8 }, thickness: 1, color: ACCENT });
  text('DEVIS', W - M, y, { size: 22, f: bold, right: true });
  y -= 26;
  const left = [missing(biz.legalName, 'dénomination'), biz.addressLine ? `${biz.addressLine}, ${biz.postcode} ${biz.city}` : missing('', 'adresse'), `SIRET : ${missing(biz.siret, 'SIRET')}`, biz.phoneIsPlaceholder ? 'Téléphone : [à compléter]' : `Tél. ${biz.phone}`, biz.email];
  left.filter(Boolean).forEach((l, i) => text(l, M, y - i * 12, { color: MUTE }));
  const right = [`N° ${q.number}`, `Date : ${date(q.createdAt)}`, `Valable jusqu’au : ${date(q.validUntil)}`];
  right.forEach((l, i) => text(l, W - M, y - i * 12, { right: true, f: i === 0 ? bold : font }));
  y -= Math.max(left.length, right.length) * 12 + 22;

  // Client
  page.drawRectangle({ x: W / 2, y: y - 62, width: W / 2 - M, height: 70, color: rgb(0.96, 0.957, 0.94) });
  text('CLIENT', W / 2 + 12, y - 6, { size: 8, f: bold, color: MUTE });
  [c.name, c.address, `${c.postcode} ${c.city}`.trim(), c.phone ? `Tél. ${c.phone}` : ''].filter(Boolean).forEach((l, i) => text(l, W / 2 + 12, y - 20 - i * 12, { f: i === 0 ? bold : font }));
  text('OBJET', M, y - 6, { size: 8, f: bold, color: MUTE });
  wrap(q.title || 'Intervention', bold, 11, W / 2 - M - 20).forEach((l, i) => text(l, M, y - 22 - i * 13, { size: 11, f: bold }));
  if (q.vehicleLabel) text(`Véhicule : ${q.vehicleLabel}`, M, y - 52, { color: MUTE });
  y -= 92;

  // Tableau
  const cols = { label: M, qty: 360, unit: 440, total: W - M };
  const header = () => {
    page.drawLine({ start: { x: M, y: y + 4 }, end: { x: W - M, y: y + 4 }, thickness: 0.8, color: INK });
    text('Désignation', cols.label, y - 8, { size: 8.5, f: bold });
    text('Qté', cols.qty, y - 8, { size: 8.5, f: bold, right: true });
    text('PU HT', cols.unit, y - 8, { size: 8.5, f: bold, right: true });
    text('Total HT', cols.total, y - 8, { size: 8.5, f: bold, right: true });
    y -= 16;
    page.drawLine({ start: { x: M, y: y + 2 }, end: { x: W - M, y: y + 2 }, thickness: 0.5, color: LINE });
    y -= 10;
  };
  header();
  for (const l of lines) {
    const label = wrap(l.label + (l.reference ? ` (réf. ${l.reference})` : ''), font, 9.5, 270);
    const need = label.length * 12 + 14;
    if (y - need < 170) { page = pdf.addPage([W, H]); y = H - M; header(); }
    text(LINE_KINDS[l.kind as LineKind] ?? l.kind, cols.label, y, { size: 7.5, color: MUTE });
    label.forEach((t, i) => text(t, cols.label, y - 11 - i * 12));
    const qty = Number(l.quantity);
    text(String(qty).replace('.', ','), cols.qty, y - 11, { right: true });
    text(money(l.unitPriceHtCents), cols.unit, y - 11, { right: true });
    text(money(Math.round(qty * l.unitPriceHtCents)), cols.total, y - 11, { right: true });
    y -= need;
    page.drawLine({ start: { x: M, y: y + 6 }, end: { x: W - M, y: y + 6 }, thickness: 0.4, color: LINE });
  }

  // Totaux
  y -= 10;
  const tot = (label: string, v: string, b = false) => { text(label, 440, y, { right: true, f: b ? bold : font }); text(v, W - M, y, { right: true, f: b ? bold : font, size: b ? 11 : 9.5 }); y -= 15; };
  tot('Total HT', money(q.totalHtCents));
  if (q.vatMode === 'normal') tot('TVA', money(q.totalVatCents));
  tot(q.vatMode === 'normal' ? 'Total TTC' : 'Total à payer', money(q.totalTtcCents), true);
  if (q.vatMode === 'franchise') { text('TVA non applicable, art. 293 B du CGI', W - M, y, { right: true, size: 8.5, color: MUTE }); y -= 14; }

  // Notes et accord
  y -= 10;
  if (q.notes) { wrap(q.notes, font, 9, W - 2 * M).slice(0, 10).forEach((l) => { text(l, M, y, { size: 9, color: MUTE }); y -= 11; }); y -= 8; }
  const legal = [
    'Devis gratuit. Les prix des pièces sont susceptibles d’ajustement si la référence exacte diffère après contrôle du véhicule ; tout écart vous sera soumis avant intervention.',
    'Ce devis devient ferme après acceptation (signature ou acceptation en ligne). Une facture est établie après l’intervention.',
  ];
  legal.forEach((p) => { wrap(p, font, 8, W - 2 * M).forEach((l) => { text(l, M, y, { size: 8, color: MUTE }); y -= 10; }); });
  y -= 14;
  if (q.status === 'accepte' && q.acceptedAt) {
    text(`Accepté le ${date(q.acceptedAt)} — ${q.acceptedByName ?? ''}`, M, y, { f: bold, color: rgb(0.14, 0.34, 0.23) });
  } else {
    page.drawRectangle({ x: W - M - 220, y: y - 60, width: 220, height: 66, borderColor: LINE, borderWidth: 0.8 });
    text('Bon pour accord — date et signature', W - M - 210, y - 8, { size: 8, color: MUTE });
  }
  const pages = pdf.getPages();
  pages.forEach((p, i) => p.drawText(clean(`${biz.name} · Devis ${q.number} · page ${i + 1}/${pages.length}`), { x: M, y: 24, size: 7.5, font, color: MUTE }));
  return pdf.save();
}
