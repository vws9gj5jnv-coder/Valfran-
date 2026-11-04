import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { env } from '@/lib/env';
import './globals.css';

const archivo = localFont({
  src: [{ path: './fonts/archivo-latin.woff2', weight: '100 900', style: 'normal' }],
  variable: '--font-archivo',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '62% 125%' }],
});

// Les pages lisent les contenus administrables en base : rendu à la demande.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: 'VALFRAN — Mécanique automobile à domicile, Vosges et Haute-Saône', template: '%s — VALFRAN' },
  description: 'Entretien, diagnostic et réparation automobile à domicile dans les Vosges et en Haute-Saône. Demande de rendez-vous en ligne en deux minutes.',
  applicationName: 'VALFRAN',
  formatDetection: { telephone: false },
  openGraph: { type: 'website', locale: 'fr_FR', siteName: 'VALFRAN' },
  robots: env.demoMode && env.isProd && !process.env.ALLOW_INDEXING ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  themeColor: '#111216',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={archivo.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
