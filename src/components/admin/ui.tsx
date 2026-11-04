import Link from 'next/link';
import { BOOKING_STATUSES, type BookingStatus } from '@/modules/bookings/status';
import { QUOTE_STATUSES, type QuoteStatus } from '@/modules/quotes/totals';

export function AdminHeader({ title, intro, actions, back }: { title: string; intro?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && <Link href={back.href} className="mb-2 inline-flex min-h-[36px] items-center text-[0.9375rem] text-mute hover:text-graphite">← {back.label}</Link>}
        <h1 className="text-[1.875rem] font-light leading-tight wide">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-mute">{intro}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

const bookingTone: Record<BookingStatus, string> = {
  nouvelle: 'bg-champagne text-graphite',
  a_etudier: 'bg-[#e6e2d8] text-graphite',
  devis_necessaire: 'bg-[#f3e3c3] text-[#6b4a10]',
  confirmee: 'bg-[#dcebe1] text-[#24563a]',
  terminee: 'bg-graphite/10 text-graphite/70',
  annulee: 'bg-[#f3dcd8] text-[#7c2a20]',
};
export function BookingBadge({ status }: { status: string }) {
  const s = status as BookingStatus;
  return <span className={`badge ${bookingTone[s] ?? 'bg-graphite/10'}`}>{BOOKING_STATUSES[s] ?? status}</span>;
}
const quoteTone: Record<QuoteStatus, string> = { brouillon: 'bg-graphite/10 text-graphite', envoye: 'bg-[#f3e3c3] text-[#6b4a10]', accepte: 'bg-[#dcebe1] text-[#24563a]', refuse: 'bg-[#f3dcd8] text-[#7c2a20]', expire: 'bg-graphite/10 text-graphite/60' };
export function QuoteBadge({ status }: { status: string }) {
  const s = status as QuoteStatus;
  return <span className={`badge ${quoteTone[s] ?? ''}`}>{QUOTE_STATUSES[s] ?? status}</span>;
}
export const DemoTag = ({ show }: { show: boolean }) => (show ? <span className="badge ml-2 border border-champagne/70 bg-[#f4efe6] text-champagne-ink">Démo</span> : null);

export function Panel({ title, children, actions, className = '' }: { title?: React.ReactNode; children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-sm border border-graphite/10 bg-white ${className}`}>
      {title && <div className="flex items-center justify-between gap-3 border-b border-graphite/10 px-5 py-4"><h2 className="text-[1.0625rem] font-semibold">{title}</h2>{actions}</div>}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-mute">{children}</p>;
}

export const dt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const dOnly = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short', day: 'numeric', month: 'short' });
export const tOnly = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' });
