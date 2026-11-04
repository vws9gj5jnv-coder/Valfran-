/**
 * Moteur d'estimation. Principe : n'afficher un montant que s'il repose sur des données validées
 * par l'entreprise. Aucune référence de pièce, aucun temps barémé ni prix fournisseur n'est inventé.
 */
export interface PricedService {
  slug: string;
  name: string;
  laborPriceCents: number | null;
  priceValidated: boolean;
  priceNote: string;
  isDiagnostic: boolean;
}

export interface EstimateLine { label: string; amountCents: number | null; note?: string }

export interface Estimate {
  kind: 'estimation' | 'devis_personnalise';
  lines: EstimateLine[];
  /** Somme des montants connus (main-d'œuvre + déplacement). Hors pièces. */
  knownTotalCents: number | null;
  needsQuote: boolean;
  partsExcluded: boolean;
  demoPrices: boolean;
  disclaimer: string;
}

export function buildEstimate(input: {
  services: PricedService[];
  unknownIssue: boolean;
  diagnosticService?: PricedService | null;
  travelFeeCents: number | null;
  zoneStatus: 'served' | 'on_request' | 'outside' | null;
  demoPrices: boolean;
  disclaimer: string;
}): Estimate {
  const selected = [...input.services];
  if (input.unknownIssue && input.diagnosticService && !selected.some((s) => s.slug === input.diagnosticService!.slug)) selected.unshift(input.diagnosticService);
  const lines: EstimateLine[] = [];
  let needsQuote = selected.length === 0;
  let total = 0;
  for (const s of selected) {
    if (s.priceValidated && s.laborPriceCents !== null) {
      lines.push({ label: s.name, amountCents: s.laborPriceCents, note: s.priceNote });
      total += s.laborPriceCents;
      if (!s.isDiagnostic) needsQuote = needsQuote || false;
    } else {
      lines.push({ label: s.name, amountCents: null, note: 'Devis personnalisé après vérification' });
      needsQuote = true;
    }
  }
  if (input.zoneStatus === 'served' && input.travelFeeCents !== null) {
    lines.push({ label: 'Déplacement', amountCents: input.travelFeeCents, note: input.travelFeeCents === 0 ? 'Offert dans votre secteur' : undefined });
    total += input.travelFeeCents;
  } else if (input.zoneStatus) {
    lines.push({ label: 'Déplacement', amountCents: null, note: 'Sur devis selon la distance' });
    needsQuote = true;
  }
  const anyKnown = lines.some((l) => l.amountCents !== null && l.label !== 'Déplacement');
  return {
    kind: anyKnown ? 'estimation' : 'devis_personnalise',
    lines,
    knownTotalCents: anyKnown ? total : null,
    needsQuote,
    partsExcluded: selected.some((s) => !s.isDiagnostic),
    demoPrices: input.demoPrices,
    disclaimer: input.disclaimer,
  };
}
