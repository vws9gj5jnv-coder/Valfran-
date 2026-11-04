import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/admin\/connexion/);
  await page.getByLabel('E-mail').fill('demo@valfran.example');
  await page.getByLabel('Mot de passe').fill('demo-valfran-2026');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
}

test('la page d’administration est protégée', async ({ page, request }) => {
  await page.goto('/admin/demandes');
  await expect(page).toHaveURL(/\/admin\/connexion/);
  const pdf = await request.get('/api/admin/quotes/00000000-0000-0000-0000-000000000000/pdf');
  expect(pdf.status()).toBe(401);
});

test('mauvais mot de passe refusé', async ({ page }) => {
  await page.goto('/admin/connexion');
  await page.getByLabel('E-mail').fill('demo@valfran.example');
  await page.getByLabel('Mot de passe').fill('mauvais-mot-de-passe');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page.getByText('Identifiants incorrects.')).toBeVisible();
});

test('une demande apparaît et peut être planifiée, confirmée puis annulée', async ({ page }) => {
  // Création d'une demande côté client
  await page.goto('/rendez-vous');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('tab', { name: 'Choisir manuellement' }).click();
  await page.getByLabel('Marque').selectOption('Dacia');
  await page.getByLabel('Modèle').selectOption('Sandero');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: /Pneumatiques/ }).first().click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByLabel('Numéro et rue').fill('5 rue du Test');
  await page.getByLabel('Code postal ou commune').fill('Lure');
  await page.getByRole('option', { name: /70200 Lure/ }).click();
  await expect(page.getByText(/ : dans notre secteur$|^Déplacement à confirmer$/)).toBeVisible();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByLabel('Nom et prénom').fill('Admin Parcours');
  await page.getByLabel('Téléphone', { exact: false }).first().fill('0639980099');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Envoyer ma demande' }).click();
  const ref = await page.getByTestId('booking-reference').innerText();

  await login(page);
  await page.goto(`/admin/demandes?q=${encodeURIComponent(ref)}`);
  await page.getByRole('link', { name: ref }).click();
  await expect(page.getByRole('heading', { name: `Demande ${ref}` })).toBeVisible();
  await expect(page.getByText('Nouvelle demande').first()).toBeVisible();

  // Modifier : planifier et confirmer
  const d = new Date(Date.now() + 3 * 86400_000).toISOString().slice(0, 10);
  await page.getByLabel('Date').fill(d);
  await page.getByLabel('Heure').fill('10:30');
  await page.getByRole('button', { name: 'Planifier' }).click();
  await expect(page.getByText('Rendez-vous planifié et confirmé')).toBeVisible();
  await page.reload();
  await expect(page.locator('span.badge', { hasText: 'Confirmée' })).toBeVisible();

  // Annuler
  await page.getByLabel('Nouveau statut').selectOption('annulee');
  await page.getByLabel('Commentaire (motif d’annulation, etc.)').fill('Annulé par test');
  await page.getByRole('button', { name: 'Changer le statut' }).click();
  await expect(page.getByText('Statut : Annulée').first()).toBeVisible();
  await page.reload();
  await expect(page.locator('span.badge', { hasText: 'Annulée' })).toBeVisible();
});

test('création d’un devis depuis une demande et export PDF', async ({ page }) => {
  await login(page);
  await page.goto('/admin/demandes?statut=nouvelle');
  await page.locator('tbody a').first().click();
  await page.getByRole('button', { name: 'Créer un devis' }).click();
  await expect(page).toHaveURL(/\/admin\/devis\//);
  await page.getByRole('button', { name: 'Pièce' }).click();
  await page.getByLabel('Désignation').last().fill('Filtre à huile (test)');
  await page.getByLabel('Prix unitaire HT').last().fill('12.50');
  await page.getByRole('button', { name: 'Enregistrer le devis' }).click();
  await expect(page.getByText(/Devis enregistré — total/)).toBeVisible();
  const url = page.url().replace(/.*\/admin\/devis\//, '');
  const res = await page.request.get(`/api/admin/quotes/${url}/pdf`);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/pdf');
  await page.getByRole('button', { name: 'Envoyer le devis' }).click();
  await expect(page.getByText(/Devis marqué envoyé/)).toBeVisible();
});

test('pages d’administration principales accessibles', async ({ page }) => {
  await login(page);
  for (const [path, title] of [['/admin/planning', 'Planning'], ['/admin/clients', 'Clients'], ['/admin/prestations', 'Prestations et tarifs'], ['/admin/zones', 'Zones et déplacements'], ['/admin/disponibilites', 'Horaires et congés'], ['/admin/contenus', 'Textes et contenus'], ['/admin/messages', 'Messages et envois'], ['/admin/parametres', 'Paramètres']]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  }
});
