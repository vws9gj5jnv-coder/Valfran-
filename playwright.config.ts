import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.E2E_PORT ?? 3200);
const external = process.env.BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: external ?? `http://localhost:${PORT}`,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: external
    ? undefined
    : {
        command: `npx next start -p ${PORT}`,
        port: PORT,
        timeout: 120_000,
        reuseExistingServer: false,
        env: { PGLITE_DIR: '.data/e2e', DEMO_MODE: 'true', UPLOAD_DIR: '.data/e2e-uploads', BOOKINGS_PER_HOUR: '200', PLATE_LOOKUPS_PER_HOUR: '200' },
      },
});
