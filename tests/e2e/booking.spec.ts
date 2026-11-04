import { test, expect, type Page } from '@playwright/test';

async function fresh(page: Page) {
  await page.goto('/rendez-vous');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Votre véhicule' })).toBeVisible();
}

async function fillAddress(page: Page, street: string, commune: string, pick: RegExp) {
  await page.getByLabel('Numéro et rue').fill(street);
  await page.getByLabel('Code postal ou commune').fill(commune);
  await page.getByRole('option', { name: pick }).click();
  await expect(page.getByText(/ : dans notre secteur$|^Déplacement à confirmer$/)).toBeVisible();
}

async function fillContact(page: Page, name: string, phone: string) {
  await page.getByLabel('Nom et prénom').fill(name);
  await page.getByLabel('Téléphone', { exact: false }).first().fill(phone);
  await page.getByRole('checkbox').check();
}

test('client particulier : plaque → vidange → adresse → rendez-vous', async ({ page }) => {
  await fresh(page);
  await page.getByLabel('Numéro d’immatriculation').fill('ab123cd');
  await page.getByRole('button', { name: 'Identifier mon véhicule' }).click();
  await expect(page.getByText('Véhicule identifié')).toBeVisible();
  await expect(page.getByText(/Renault Clio/)).toBeVisible();
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByRole('heading', { name: 'L’intervention' })).toBeVisible();
  await page.getByRole('button', { name: /Entretien et vidange/ }).first().click();
  await page.getByRole('button', { name: 'Continuer' }).click();

  await fillAddress(page, '12 rue des Écoles', 'Remiremont', /88200 Remiremont/);
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByRole('heading', { name: 'Vos disponibilités' })).toBeVisible();
  const slot = page.locator('button[aria-pressed="false"]:not([disabled])').filter({ hasText: /Matin|Après-midi/ }).first();
  await slot.click();
  await page.getByRole('button', { name: 'Continuer' }).click();

  await fillContact(page, 'Client Test', '06 39 98 00 01');
  await expect(page.getByText('Récapitulatif de votre demande')).toBeVisible();
  await page.getByRole('button', { name: 'Envoyer ma demande' }).click();

  await expect(page.getByRole('heading', { name: 'Demande bien reçue' })).toBeVisible();
  await expect(page.getByTestId('booking-reference')).toHaveText(/^VF-\d{4}-[A-Z0-9]{4}$/);
});

test('client sans immatriculation : choix manuel → diagnostic', async ({ page }) => {
  await fresh(page);
  await page.getByRole('tab', { name: 'Choisir manuellement' }).click();
  await page.getByLabel('Marque').selectOption('Peugeot');
  await page.getByLabel('Modèle').selectOption('208');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: /Je ne sais pas quelle est la panne/ }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('Décrivez en quelques mots ce que vous constatez.')).toBeVisible();
  await page.getByLabel('Décrivez ce que vous constatez').fill('Voyant moteur orange allumé depuis hier.');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await fillAddress(page, '3 chemin du Moulin', '88360', /88360 Rupt-sur-Moselle/);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click(); // sans créneau : rappel téléphonique
  await fillContact(page, 'Client Sans Plaque', '0639980002');
  await page.getByRole('button', { name: 'Envoyer ma demande' }).click();
  await expect(page.getByRole('heading', { name: 'Demande bien reçue' })).toBeVisible();
  await expect(page.locator('dd', { hasText: 'Diagnostic électronique' })).toBeVisible();
});

test('véhicule inconnu : l’échec d’identification laisse le parcours manuel accessible', async ({ page }) => {
  await fresh(page);
  await page.getByLabel('Numéro d’immatriculation').fill('ZZ-999-ZZ');
  await page.getByRole('button', { name: 'Identifier mon véhicule' }).click();
  await expect(page.getByText('Véhicule introuvable')).toBeVisible();
  await page.getByRole('button', { name: 'choisissez votre véhicule manuellement' }).click();
  await expect(page.getByLabel('Marque')).toBeVisible();
  await expect(page.getByText('Plaque conservée')).toBeVisible();
  // Fournisseur indisponible
  await page.getByRole('tab', { name: 'Avec la plaque' }).click();
  await page.getByLabel('Numéro d’immatriculation').fill('XX-500-XX');
  await page.getByRole('button', { name: 'Identifier mon véhicule' }).click();
  await expect(page.getByText('Service d’identification indisponible')).toBeVisible();
  // Plaque invalide
  await page.getByLabel('Numéro d’immatriculation').fill('IO-123-OU');
  await page.getByRole('button', { name: 'Identifier mon véhicule' }).click();
  await expect(page.getByText(/ne sont pas utilisées/)).toBeVisible();
});

test('plusieurs versions possibles : le client choisit la sienne', async ({ page }) => {
  await fresh(page);
  await page.getByLabel('Numéro d’immatriculation').fill('EF-456-GH');
  await page.getByRole('button', { name: 'Identifier mon véhicule' }).click();
  await expect(page.getByText('Plusieurs versions correspondent')).toBeVisible();
  await page.getByRole('button', { name: /BlueHDi/ }).click();
  await expect(page.getByText('Véhicule identifié')).toBeVisible();
});

test('erreur réseau à l’envoi : message clair et demande conservée', async ({ page }) => {
  await fresh(page);
  await page.getByRole('tab', { name: 'Choisir manuellement' }).click();
  await page.getByLabel('Marque').selectOption('Renault');
  await page.getByLabel('Modèle').selectOption('Clio');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: /^Freinage/ }).first().click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await fillAddress(page, '8 place du Marché', 'Le Thillot', /88160 Le Thillot/);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await fillContact(page, 'Client Réseau', '0639980003');
  await page.route('**/api/bookings', (r) => r.abort('internetdisconnected'));
  await page.getByRole('button', { name: 'Envoyer ma demande' }).click();
  await expect(page.getByText(/Connexion interrompue/)).toBeVisible();
  // Rechargement : la saisie est toujours là
  await page.unroute('**/api/bookings');
  await page.reload();
  await expect(page.getByText('Nous avons conservé votre demande en cours')).toBeVisible();
  await expect(page.getByLabel('Nom et prénom')).toHaveValue('Client Réseau');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Envoyer ma demande' }).click();
  await expect(page.getByRole('heading', { name: 'Demande bien reçue' })).toBeVisible();
});

test('parcours mobile, sans 3D @mobile', async ({ page }) => {
  await page.goto('/?3d=off');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.getByRole('link', { name: 'Rendez-vous' }).last().click();
  await expect(page.getByRole('heading', { name: 'Votre véhicule' })).toBeVisible();
  const overflow2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow2).toBeLessThanOrEqual(0);
});
