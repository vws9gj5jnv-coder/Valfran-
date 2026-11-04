/** Formats d'immatriculation français : SIV (AA-123-AA, depuis 2009) et FNI (1234 AB 56, ancien format). */
const SIV = /^([A-HJ-NP-TV-Z]{2})-?(\d{3})-?([A-HJ-NP-TV-Z]{2})$/;
const FNI = /^(\d{1,4})\s?-?([A-Z]{1,3})\s?-?(\d{2}|2A|2B|97\d)$/;

export type PlateCheck = { ok: true; normalized: string; format: 'SIV' | 'FNI' } | { ok: false; reason: string };

export function normalizePlate(raw: string): PlateCheck {
  const s = raw.toUpperCase().replace(/[\s.]+/g, ' ').trim();
  const compact = s.replace(/[\s-]/g, '');
  const siv = compact.match(/^([A-Z]{2})(\d{3})([A-Z]{2})$/);
  if (siv) {
    const formatted = `${siv[1]}-${siv[2]}-${siv[3]}`;
    if (!SIV.test(formatted)) return { ok: false, reason: 'Les lettres I, O et U ne sont pas utilisées dans les plaques françaises.' };
    if (siv[1] === 'SS' || siv[3] === 'SS' || siv[1] === 'WW') return { ok: false, reason: 'Cette combinaison de lettres n’est pas attribuée.' };
    if (siv[2] === '000') return { ok: false, reason: 'Le groupe de chiffres 000 n’est pas attribué.' };
    return { ok: true, normalized: formatted, format: 'SIV' };
  }
  const fni = s.match(FNI);
  if (fni) return { ok: true, normalized: `${fni[1]} ${fni[2]} ${fni[3]}`, format: 'FNI' };
  return { ok: false, reason: 'Format non reconnu. Exemple attendu : AB-123-CD.' };
}
