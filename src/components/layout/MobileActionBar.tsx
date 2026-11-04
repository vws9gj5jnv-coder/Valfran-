'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, CalendarCheck } from 'lucide-react';

/** Barre d'action permanente sur smartphone : appeler / prendre rendez-vous. */
export function MobileActionBar({ phoneHref }: { phoneHref: string }) {
  const pathname = usePathname();
  if (pathname.startsWith('/rendez-vous') || pathname.startsWith('/garage-virtuel')) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-graphite/10 bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm sm:hidden">
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <a href={phoneHref} className="btn btn-outline-dark px-5" aria-label="Appeler VALFRAN">
          <Phone className="size-5" aria-hidden="true" /> Appeler
        </a>
        <Link href="/rendez-vous" className="btn btn-accent">
          <CalendarCheck className="size-5" aria-hidden="true" /> Rendez-vous
        </Link>
      </div>
    </div>
  );
}
