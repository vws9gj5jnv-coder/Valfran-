export const dynamic = 'force-dynamic';

import type { MetadataRoute } from 'next';
import { listServices, listCommunes } from '@/modules/settings/repo';
import { env } from '@/lib/env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl;
  const [services, communes] = await Promise.all([listServices(), listCommunes()]);
  const pages = ['', '/services', '/rendez-vous', '/comment-ca-marche', '/garage-virtuel', '/zones-intervention', '/realisations', '/a-propos', '/tarifs', '/contact', '/faq', '/mentions-legales', '/confidentialite', '/cookies', '/conditions-generales'];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: 'monthly' as const, priority: p === '' ? 1 : p === '/rendez-vous' || p === '/services' ? 0.9 : 0.6 })),
    ...services.map((s) => ({ url: `${base}/services/${s.slug}`, changeFrequency: 'monthly' as const, priority: 0.8 })),
    ...communes.filter((c) => c.featured && c.status !== 'excluded').map((c) => ({ url: `${base}/zones-intervention/${c.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
