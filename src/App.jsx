import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import Home from './pages/Home';

const GaragePage = lazy(() => import('./pages/GaragePage'));
const Mecanique = lazy(() => import('./pages/Mecanique'));
const Vehicules = lazy(() => import('./pages/Vehicules'));
const VehicleDetail = lazy(() => import('./pages/VehicleDetail'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));
const MentionsLegales = lazy(() => import('./pages/Legal').then((m) => ({ default: m.MentionsLegales })));
const Confidentialite = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Confidentialite })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-ember-500 focus:px-4 focus:py-2 focus:text-ink-950">Aller au contenu</a>
      <ScrollToTop />
      <Header />
      <Suspense fallback={<div className="min-h-screen" />}>
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/mecanique" element={<Mecanique />} />
              <Route path="/garage-virtuel" element={<GaragePage />} />
              <Route path="/vehicules" element={<Vehicules />} />
              <Route path="/vehicules/:id" element={<VehicleDetail />} />
              <Route path="/a-propos" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/confidentialite" element={<Confidentialite />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </AnimatePresence>
      </Suspense>
      <Footer />
    </>
  );
}
