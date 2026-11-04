export function slugify(s: string) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/['’]/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export const euros = (cents: number | null | undefined, opts: { decimals?: boolean } = {}) => {
  if (cents === null || cents === undefined) return '';
  const showDec = opts.decimals ?? cents % 100 !== 0;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: showDec ? 2 : 0, maximumFractionDigits: showDec ? 2 : 0 }).format(cents / 100);
};

export const normalizeSpaces = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Normalise un numéro français en +33… ; renvoie null si invalide. */
export function normalizeFrenchPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '');
  let d = digits;
  if (d.startsWith('+33')) d = '0' + d.slice(3);
  else if (d.startsWith('0033')) d = '0' + d.slice(4);
  if (!/^0[1-9]\d{8}$/.test(d)) return null;
  return d;
}

export const formatPhone = (d: string) => d.replace(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4 $5');
export const phoneHref = (d: string) => 'tel:+33' + d.replace(/\D/g, '').replace(/^0/, '');

/** Masque une donnée personnelle pour les journaux. */
export const maskEmail = (e: string) => e.replace(/^(.).*(@.*)$/, '$1***$2');
export const maskPhone = (p: string) => p.replace(/\d(?=\d{2})/g, '•');
