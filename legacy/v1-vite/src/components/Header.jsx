import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck, Menu, Phone, X } from 'lucide-react';
import Logo from './Logo';
import { BUSINESS } from '../data/business';

export const NAV = [
  { to: '/mecanique', label: 'Mécanique & Tarifs' },
  { to: '/garage-virtuel', label: 'Garage Virtuel / RDV' },
  { to: '/vehicules', label: 'Vente de Véhicules' },
  { to: '/a-propos', label: 'À Propos' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const link = ({ isActive }) =>
    `relative whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'text-chrome-100' : 'text-chrome-400 hover:text-chrome-100'}`;

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition duration-300 ${scrolled || open ? 'border-b border-ink-600 bg-ink-950/85 backdrop-blur-xl' : 'border-b border-transparent'}`}>
      <div className="container-x flex h-[72px] items-center justify-between gap-4">
        <Link to="/" aria-label="Valfran Mécanique — accueil"><Logo /></Link>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Navigation principale">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={link}>
              {({ isActive }) => (
                <>
                  {n.label}
                  {isActive && <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded bg-ember-500" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href={BUSINESS.phoneHref} className="btn-ghost hidden !px-3 sm:inline-flex 2xl:hidden" aria-label="Appeler"><Phone size={16} /></a>
          <Link to="/garage-virtuel" className="btn-primary hidden whitespace-nowrap !py-2.5 sm:inline-flex"><CalendarCheck size={16} /> Prendre RDV en ligne</Link>
          <button className="btn-ghost !px-3 xl:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'calc(100dvh - 72px)' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-y-auto xl:hidden" aria-label="Navigation mobile">
            <ul className="container-x space-y-1 py-4">
              {NAV.map((n, i) => (
                <motion.li key={n.to} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <NavLink to={n.to} className={({ isActive }) => `block rounded-xl px-4 py-4 font-display text-xl font-semibold ${isActive ? 'bg-ink-700 text-ember-400' : 'text-chrome-200'}`}>
                    {n.label}
                  </NavLink>
                </motion.li>
              ))}
              <li className="pt-4">
                <Link to="/garage-virtuel" className="btn-primary w-full !py-4"><CalendarCheck size={18} /> Prendre RDV en ligne</Link>
                <a href={BUSINESS.phoneHref} className="btn-ghost mt-3 w-full !py-4"><Phone size={18} /> {BUSINESS.phone}</a>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
