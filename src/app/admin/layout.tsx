import type { Metadata } from 'next';

export const metadata: Metadata = { title: { default: 'Administration', template: '%s — Administration VALFRAN' }, robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="min-h-svh bg-paper-2/60">{children}</div>;
}
