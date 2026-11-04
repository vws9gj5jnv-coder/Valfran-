import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { MotionConfig } from 'framer-motion';
import App from './App';
import { GarageProvider } from './store/garageStore';
import { VEHICLES } from './data/vehicles';

/** Pages à pré-rendre (le chemin '/404' produit 404.html). */
export const routes = [
  '/', '/mecanique', '/garage-virtuel', '/vehicules', '/a-propos', '/contact',
  '/mentions-legales', '/confidentialite',
  ...VEHICLES.map((v) => `/vehicules/${v.id}`),
  '/404',
];

export function render(url) {
  globalThis.__SEO__ = null;
  const html = renderToString(
    <StaticRouter location={url === '/404' ? '/page-introuvable' : url}>
      <MotionConfig reducedMotion="user">
        <GarageProvider>
          <App />
        </GarageProvider>
      </MotionConfig>
    </StaticRouter>,
  );
  return { html, seo: globalThis.__SEO__ };
}
