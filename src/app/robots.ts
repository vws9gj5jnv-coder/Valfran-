export const dynamic = 'force-dynamic';

import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const blockAll = env.demoMode && env.isProd && !process.env.ALLOW_INDEXING;
  return {
    rules: blockAll ? [{ userAgent: '*', disallow: '/' }] : [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/devis', '/rendez-vous/confirmation'] }],
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
