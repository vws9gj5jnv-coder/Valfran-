import { test, expect } from '@playwright/test';

test('garage virtuel sans 3D (appareil peu puissant) : zone → intervention → réservation', async ({ page }) => {
  await page.goto('/garage-virtuel?3d=off');
  await expect(page.getByText('Prototype 3D de démonstration.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Revenir à la réservation' })).toBeVisible();
  await page.getByRole('button', { name: /Freinage/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Freinage', level: 2 })).toBeVisible();
  await expect(page.getByText('Contrôle et remplacement des composants de freinage selon votre véhicule')).toBeVisible();
  await page.getByRole('link', { name: 'Demander une intervention' }).click();
  await expect(page).toHaveURL(/\/rendez-vous\?service=freinage/);
  await expect(page.getByRole('heading', { name: 'Votre véhicule' })).toBeVisible();
});

test('le véhicule du client reste indiqué textuellement, l’illustration est générique', async ({ page }) => {
  await page.goto('/garage-virtuel?3d=off&categorie=citadine&vehicule=Renault%20Clio');
  await expect(page.getByText('Renault Clio')).toBeVisible();
  await expect(page.getByText(/Le modèle 3D de cette catégorie reste à produire/)).toBeVisible();
});

test('accueil : contenu et boutons visibles sans attendre la 3D', async ({ page }) => {
  await page.goto('/?3d=off');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/L.atelier vient à vous/);
  await expect(page.getByRole('link', { name: /Prendre rendez-vous/ }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Découvrir nos prestations' })).toBeVisible();
  await expect(page.locator('a[href^="tel:"]:visible').first()).toBeVisible();
});

test('SEO : pages de prestations, sitemap et données structurées', async ({ page, request }) => {
  await page.goto('/services/freinage');
  await expect(page).toHaveTitle(/plaquettes|Freinage/i);
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toContain('/services/freinage');
  expect(await page.locator('script[type="application/ld+json"]').count()).toBeGreaterThan(0);
  const sm = await request.get('/sitemap.xml');
  expect(await sm.text()).toContain('/zones-intervention/remiremont');
  const p404 = await request.get('/services/inexistant');
  expect(p404.status()).toBe(404);
});

test('sécurité : en-têtes, CSP et rejet des requêtes d’une autre origine', async ({ request }) => {
  const res = await request.get('/');
  expect(res.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
  const cross = await request.post('/api/bookings', { headers: { Origin: 'https://malveillant.example', 'Content-Type': 'application/json' }, data: {} });
  expect(cross.status()).toBe(403);
  const bad = await request.post('/api/uploads', { multipart: { file: { name: 'x.svg', mimeType: 'image/png', buffer: Buffer.from('<svg onload=alert(1)>') } } });
  expect(bad.status()).toBe(415);
});
