/**
 * Génère les images statiques (posters) des scènes 3D à partir du rendu réel dans le navigateur.
 * Prérequis : serveur lancé (npm run dev) et Playwright disponible.
 * Usage : BASE_URL=http://localhost:3000 node scripts/capture-posters.cjs
 */
const { chromium } = require('playwright');
const sharp = require('sharp');
const path = require('node:path');

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const out = (f) => path.join(__dirname, '..', 'public', 'media', f);

(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1400 }, deviceScaleFactor: 1 });
  // Moteur : état éclaté initial (t = 0), identique à la première image de l'animation.
  await page.goto(`${BASE}/?3d=on&engine-t=0`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);
  const canvas = page.locator('section canvas').first();
  const png = await canvas.screenshot({ omitBackground: true });
  await sharp(png).resize(1200, 1200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).webp({ quality: 82, alphaQuality: 90 }).toFile(out('engine-poster.webp'));
  console.log('engine-poster.webp');
  if (process.argv.includes('--garage')) {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto(`${BASE}/garage-virtuel?3d=on&poster=1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(9000);
    const g = await page.locator('[data-garage-canvas] canvas').first().screenshot();
    await sharp(g).resize(1600, 1000, { fit: 'cover' }).webp({ quality: 80 }).toFile(out('garage-poster.webp'));
    console.log('garage-poster.webp');
  }
  await browser.close();
})();
