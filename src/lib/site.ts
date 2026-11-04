import { getSettings } from '@/modules/settings/repo';
import { phoneHref } from '@/lib/text';
import { env } from '@/lib/env';

/** Données publiques communes à toutes les pages du site. */
export async function getSite() {
  const s = await getSettings();
  return {
    ...s,
    phoneHref: phoneHref(s.business.phone),
    demo: env.demoMode,
    siteUrl: env.siteUrl,
  };
}
export type Site = Awaited<ReturnType<typeof getSite>>;
