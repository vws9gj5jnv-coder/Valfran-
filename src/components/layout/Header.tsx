'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu, Phone, X, ArrowRight } from 'lucide-react';
import { Wordmark } from '@/components/ui/Wordmark';
import { NAV } from './nav';

export function Header({ phone, phoneHref }: { phone: string; phoneHref: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const first = menuRef.current?.querySelector<HTMLElement>('a,button');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); }
      if (e.key === 'Tab' && menuRef.current) {
        const items = [...menuRef.current.querySelectorAll<HTMLElement>('a,button')];
        const firstEl = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); firstEl.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header
      className={`on-dark sticky top-0 z-50 text-paper transition-[background-color,border-color] duration-300 ${scrolled || open ? 'border-b border-paper/10 bg-graphite' : 'border-b border-transparent bg-graphite'}`}
    >
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:bg-paper focus:px-4 focus:py-3 focus:text-graphite">
        Aller au contenu
      </a>
      <div className="container-x flex h-[72px] items-center justify-between gap-6">
        <Link href="/" className="-m-2 shrink-0 p-2" aria-label="VALFRAN — accueil">
          <Wordmark />
        </Link>

        <nav aria-label="Navigation principale" className="hidden xl:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={`relative inline-flex min-h-[44px] items-center whitespace-nowrap px-3 text-[0.9375rem] transition-colors ${isActive(item.href) ? 'text-paper' : 'text-paper/70 hover:text-paper'}`}
                >
                  {item.label}
                  {isActive(item.href) && <span className="absolute inset-x-3 -bottom-[14px] h-px bg-champagne" aria-hidden="true" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a href={phoneHref} className="hidden min-h-[44px] items-center gap-2 whitespace-nowrap px-3 text-[0.9375rem] font-medium text-paper/90 hover:text-paper 2xl:inline-flex">
            <Phone className="size-4 text-champagne" aria-hidden="true" />
            <span className="tabular-nums">{phone}</span>
          </a>
          <a href={phoneHref} className="inline-flex size-11 items-center justify-center rounded-sm border border-paper/20 2xl:hidden" aria-label={`Appeler VALFRAN au ${phone}`}>
            <Phone className="size-5" aria-hidden="true" />
          </a>
          <Link href="/rendez-vous" className="btn btn-accent btn-sm hidden whitespace-nowrap sm:inline-flex">
            Prendre rendez-vous
          </Link>
          <button
            ref={buttonRef}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-sm border border-paper/20 xl:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        id="menu-mobile"
        ref={menuRef}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[72px] z-40 overflow-y-auto bg-graphite xl:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <nav aria-label="Menu mobile" className="container-x py-6">
          <ul className="divide-y divide-paper/10 border-y border-paper/10">
            {[{ href: '/', label: 'Accueil' }, ...NAV, { href: '/faq', label: 'Questions fréquentes' }, { href: '/a-propos', label: 'À propos' }].map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex min-h-[60px] items-center justify-between text-[1.25rem] text-paper" aria-current={pathname === item.href ? 'page' : undefined}>
                  {item.label}
                  <ArrowRight className="size-5 text-paper/40" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 grid gap-3">
            <Link href="/rendez-vous" className="btn btn-accent w-full">Prendre rendez-vous</Link>
            <a href={phoneHref} className="btn btn-outline-light w-full"><Phone className="size-5" aria-hidden="true" /> Appeler le {phone}</a>
          </div>
        </nav>
      </div>
    </header>
  );
}
