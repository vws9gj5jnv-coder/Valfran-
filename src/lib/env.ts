/**
 * Lecture centralisée des variables d'environnement (côté serveur uniquement).
 * Aucune clé secrète ne doit être exposée au navigateur : ne jamais préfixer par NEXT_PUBLIC_.
 */

const bool = (v: string | undefined, d = false) => (v === undefined || v === '' ? d : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase()));
const str = (v: string | undefined, d = '') => (v === undefined || v === '' ? d : v);

export const env = {
  get isProd() { return process.env.NODE_ENV === 'production'; },
  /** Par défaut : démonstration uniquement avec la base locale PGlite. Avec DATABASE_URL, il faut DEMO_MODE=true explicitement. */
  get demoMode() { return bool(process.env.DEMO_MODE, !process.env.DATABASE_URL); },
  get siteUrl() { return str(process.env.SITE_URL, 'http://localhost:3000').replace(/\/$/, ''); },
  get databaseUrl() { return str(process.env.DATABASE_URL); },
  get pgliteDir() { return str(process.env.PGLITE_DIR, '.data/pglite'); },
  get hashSalt() { return str(process.env.HASH_SALT, 'valfran-dev-salt-change-me'); },

  get plateProvider() { return str(process.env.PLATE_PROVIDER, 'demo') as 'demo' | 'http' | 'none'; },
  get plateApiUrl() { return str(process.env.PLATE_API_URL); },
  get plateApiKey() { return str(process.env.PLATE_API_KEY); },
  get plateLookupsPerHour() { return Number(str(process.env.PLATE_LOOKUPS_PER_HOUR, '10')); },

  get geocoder() { return str(process.env.GEOCODER_PROVIDER, 'local') as 'local' | 'ban'; },

  get emailProvider() { return str(process.env.EMAIL_PROVIDER, 'demo') as 'none' | 'demo' | 'resend' | 'brevo'; },
  get emailApiKey() { return str(process.env.EMAIL_API_KEY); },
  get emailFrom() { return str(process.env.EMAIL_FROM, 'VALFRAN <no-reply@example.invalid>'); },
  get adminNotifyEmail() { return str(process.env.ADMIN_NOTIFY_EMAIL); },

  get smsProvider() { return str(process.env.SMS_PROVIDER, 'demo') as 'none' | 'demo' | 'brevo'; },
  get smsApiKey() { return str(process.env.SMS_API_KEY); },
  get smsSender() { return str(process.env.SMS_SENDER, 'VALFRAN'); },

  get storageProvider() { return str(process.env.STORAGE_PROVIDER, 'local') as 'local' | 'supabase'; },
  get uploadDir() { return str(process.env.UPLOAD_DIR, '.data/uploads'); },
  get supabaseUrl() { return str(process.env.SUPABASE_URL); },
  get supabaseServiceKey() { return str(process.env.SUPABASE_SERVICE_KEY); },
  get supabaseBucket() { return str(process.env.SUPABASE_BUCKET, 'valfran-private'); },

  get paymentProvider() { return str(process.env.PAYMENT_PROVIDER, 'none') as 'none'; },

  get analyticsProvider() { return str(process.env.ANALYTICS_PROVIDER, 'none') as 'none' | 'plausible'; },
  get analyticsDomain() { return str(process.env.ANALYTICS_DOMAIN); },
  get analyticsSrc() { return str(process.env.ANALYTICS_SRC, 'https://plausible.io/js/script.js'); },

  get calendarFeedToken() { return str(process.env.CALENDAR_FEED_TOKEN); },
};
