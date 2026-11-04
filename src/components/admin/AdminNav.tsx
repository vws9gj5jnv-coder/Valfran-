'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Inbox, CalendarDays, Users, FileText, Wrench, MapPinned, Clock, PenSquare, Mail, Settings, Menu, X, LogOut, ExternalLink } from 'lucide-react';
import { Wordmark } from '@/components/ui/Wordmark';
import { logoutAction } from '@/modules/auth/login';

const ITEMS = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/admin/demandes', label: 'Demandes', icon: Inbox, badge: 'new' as const },
  { href: '/admin/planning', label: 'Planning', icon: CalendarDays },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/devis', label: 'Devis', icon: FileText },
  { href: '/admin/prestations', label: 'Prestations et tarifs', icon: Wrench },
  { href: '/admin/zones', label: 'Zones et déplacements', icon: MapPinned },
  { href: '/admin/disponibilites', label: 'Horaires et congés', icon: Clock },
  { href: '/admin/contenus', label: 'Textes et contenus', icon: PenSquare },
  { href: '/admin/messages', label: 'Messages et envois', icon: Mail },
  { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
];

export function AdminNav({ newCount, user, demo }: { newCount: number; user: { name: string; email: string }; demo: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (h: string, exact?: boolean) => (exact ? pathname === h : pathname === h || pathname.startsWith(h + '/'));
  const nav = (
    <nav aria-label="Administration" className="flex h-full flex-col">
      <ul className="flex-1 space-y-0.5 p-3">
        {ITEMS.map((it) => (
          <li key={it.href}>
            <Link href={it.href} onClick={() => setOpen(false)} aria-current={active(it.href, it.exact) ? 'page' : undefined}
              className={`flex min-h-[46px] items-center gap-3 rounded-sm px-3 text-[0.9688rem] transition-colors ${active(it.href, it.exact) ? 'bg-paper/10 text-paper' : 'text-paper/65 hover:bg-paper/5 hover:text-paper'}`}>
              <it.icon className="size-[18px] shrink-0" strokeWidth={1.6} aria-hidden="true" />
              <span className="flex-1">{it.label}</span>
              {it.badge && newCount > 0 && <span className="rounded-xs bg-champagne px-1.5 text-[0.8125rem] font-semibold text-graphite" aria-label={`${newCount} nouvelles`}>{newCount}</span>}
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-paper/10 p-3">
        <Link href="/" target="_blank" className="flex min-h-[44px] items-center gap-3 px-3 text-[0.9375rem] text-paper/60 hover:text-paper"><ExternalLink className="size-4" aria-hidden="true" /> Voir le site</Link>
        <p className="truncate px-3 pt-2 text-[0.8125rem] text-paper/45">{user.name || user.email}{demo ? ' · démo' : ''}</p>
        <form action={logoutAction}><button className="flex min-h-[44px] w-full items-center gap-3 px-3 text-[0.9375rem] text-paper/60 hover:text-paper"><LogOut className="size-4" aria-hidden="true" /> Se déconnecter</button></form>
      </div>
    </nav>
  );
  return (
    <>
      <div className="on-dark sticky top-0 z-40 flex h-16 items-center justify-between bg-graphite px-4 text-paper lg:hidden">
        <Link href="/admin"><Wordmark /></Link>
        <button type="button" className="inline-flex size-11 items-center justify-center rounded-sm border border-paper/20" aria-expanded={open} aria-controls="admin-menu" aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} onClick={() => setOpen(!open)}>
          {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </div>
      {open && <div id="admin-menu" className="on-dark fixed inset-0 top-16 z-40 overflow-y-auto bg-graphite text-paper lg:hidden">{nav}</div>}
      <aside className="on-dark sticky top-0 hidden h-svh w-[264px] shrink-0 flex-col bg-graphite text-paper lg:flex">
        <div className="flex h-[72px] items-center px-6"><Link href="/admin"><Wordmark /></Link></div>
        {nav}
      </aside>
    </>
  );
}
