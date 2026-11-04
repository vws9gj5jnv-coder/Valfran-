export interface LineInput { quantity: number; unitPriceHtCents: number; vatRate: number }

export const QUOTE_STATUSES = { brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté', refuse: 'Refusé', expire: 'Expiré' } as const;
export type QuoteStatus = keyof typeof QUOTE_STATUSES;
export const LINE_KINDS = { piece: 'Pièce', main_oeuvre: 'Main-d’œuvre', deplacement: 'Déplacement', autre: 'Autre' } as const;
export type LineKind = keyof typeof LINE_KINDS;

/**
 * Totaux d'un devis, arrondis au centime par ligne.
 * En franchise en base de TVA (art. 293 B du CGI), la TVA est nulle et le total HT = total TTC.
 */
export function computeTotals(lines: LineInput[], vatMode: 'franchise' | 'normal') {
  let ht = 0;
  let vat = 0;
  for (const l of lines) {
    const lineHt = Math.round(l.quantity * l.unitPriceHtCents);
    ht += lineHt;
    if (vatMode === 'normal') vat += Math.round((lineHt * l.vatRate) / 100);
  }
  return { totalHtCents: ht, totalVatCents: vat, totalTtcCents: ht + vat };
}

export function isQuoteExpired(q: { status: string; validUntil: Date | null }, now = new Date()) {
  return q.status === 'envoye' && !!q.validUntil && q.validUntil.getTime() < now.getTime();
}
