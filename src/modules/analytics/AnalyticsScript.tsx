import Script from 'next/script';
import { env } from '@/lib/env';

/**
 * Mesure d'audience sans cookie (Plausible ou compatible), désactivée par défaut.
 * Aucune donnée de formulaire (plaque, téléphone, adresse) n'est transmise : seules les pages vues le sont.
 */
export function AnalyticsScript() {
  if (env.analyticsProvider !== 'plausible' || !env.analyticsDomain) return null;
  return <Script defer data-domain={env.analyticsDomain} src={env.analyticsSrc} strategy="afterInteractive" />;
}
