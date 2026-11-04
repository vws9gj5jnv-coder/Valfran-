import { AdminHeader, Panel } from '@/components/admin/ui';
import { ActionForm } from '@/components/admin/ActionForm';
import { savePricing, saveNotifications } from '@/modules/admin/settings-actions';
import { runRetention } from '@/modules/admin/maintenance';
import { getSettings } from '@/modules/settings/repo';
import { PasswordForm } from './PasswordForm';
import { env } from '@/lib/env';

export const metadata = { title: 'Paramètres' };

export default async function SettingsAdmin() {
  const s = await getSettings();
  const integrations: [string, string, 'ok' | 'demo' | 'off'][] = [
    ['Base de données', env.databaseUrl ? 'PostgreSQL (DATABASE_URL)' : 'PGlite local — démonstration / développement', env.databaseUrl ? 'ok' : 'demo'],
    ['Identification par plaque', env.plateProvider === 'http' ? (env.plateApiKey ? 'Fournisseur HTTP configuré' : 'Fournisseur HTTP sans clé') : env.plateProvider === 'none' ? 'Désactivée' : 'Simulée (plaques d’essai)', env.plateProvider === 'http' && env.plateApiKey ? 'ok' : env.plateProvider === 'none' ? 'off' : 'demo'],
    ['E-mails', env.emailProvider === 'demo' ? 'Simulés (journalisés, non envoyés)' : env.emailProvider === 'none' ? 'Désactivés' : `${env.emailProvider}${env.emailApiKey ? '' : ' — clé manquante'}`, env.emailProvider === 'demo' ? 'demo' : env.emailApiKey && env.emailProvider !== 'none' ? 'ok' : 'off'],
    ['SMS', env.smsProvider === 'demo' ? 'Simulés' : env.smsProvider === 'none' ? 'Désactivés' : `${env.smsProvider}${env.smsApiKey ? '' : ' — clé manquante'}`, env.smsProvider === 'demo' ? 'demo' : env.smsApiKey && env.smsProvider !== 'none' ? 'ok' : 'off'],
    ['Adresses et distances', env.geocoder === 'ban' ? 'Base Adresse Nationale (gratuit) + estimation à vol d’oiseau × coefficient' : 'Liste locale des communes + estimation', env.geocoder === 'ban' ? 'ok' : 'demo'],
    ['Stockage des photos', env.storageProvider === 'supabase' ? 'Supabase Storage (bucket privé)' : `Disque local (${env.uploadDir})`, env.storageProvider === 'supabase' ? 'ok' : 'demo'],
    ['Paiement en ligne', 'Non activé (aucun paiement n’est encaissé par le site)', 'off'],
    ['Synchronisation d’agenda', env.calendarFeedToken ? 'Flux iCalendar actif' : 'Inactive (CALENDAR_FEED_TOKEN non défini)', env.calendarFeedToken ? 'ok' : 'off'],
    ['Mesure d’audience', env.analyticsProvider === 'plausible' ? `Plausible (${env.analyticsDomain})` : 'Aucune', env.analyticsProvider === 'plausible' ? 'ok' : 'off'],
    ['Catalogue de pièces', 'Non connecté (interface prévue, nécessite un contrat de licence)', 'off'],
  ];
  const tone = { ok: 'bg-[#dcebe1] text-[#24563a]', demo: 'bg-[#f4efe6] text-champagne-ink', off: 'bg-graphite/10 text-graphite/70' };
  const label = { ok: 'Actif', demo: 'Démonstration', off: 'Inactif' };
  return (
    <>
      <AdminHeader title="Paramètres" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Tarification générale">
          <ActionForm action={savePricing} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className="field-label" htmlFor="hourlyRate">Taux horaire (€)</label><input id="hourlyRate" name="hourlyRate" className="input" defaultValue={s.pricing.hourlyRateCents / 100} /></div>
              <div><label className="field-label" htmlFor="vatMode">TVA</label><select id="vatMode" name="vatMode" className="input" defaultValue={s.pricing.vatMode}><option value="franchise">Franchise en base</option><option value="normal">Applicable</option></select></div>
              <div><label className="field-label" htmlFor="vatRate">Taux de TVA (%)</label><input id="vatRate" name="vatRate" type="number" step="0.1" className="input" defaultValue={s.pricing.vatRate} /></div>
              <div><label className="field-label" htmlFor="quoteValidityDays">Validité des devis (jours)</label><input id="quoteValidityDays" name="quoteValidityDays" type="number" className="input" defaultValue={s.pricing.quoteValidityDays} /></div>
            </div>
            <div><label className="field-label" htmlFor="estimateDisclaimer">Mention accompagnant les estimations</label><textarea id="estimateDisclaimer" name="estimateDisclaimer" className="input" rows={3} defaultValue={s.pricing.estimateDisclaimer} /></div>
            <label className="flex items-center gap-3"><input type="checkbox" name="demoPrices" defaultChecked={s.pricing.demoPrices} className="size-5 accent-graphite" /> Afficher la mention « tarifs de démonstration »</label>
          </ActionForm>
        </Panel>
        <Panel title="Notifications et conservation des données">
          <ActionForm action={saveNotifications} className="space-y-3">
            <label className="flex items-center gap-3"><input type="checkbox" name="notifyAdminByEmail" defaultChecked={s.notifications.notifyAdminByEmail} className="size-5 accent-graphite" /> M’avertir par e-mail à chaque nouvelle demande</label>
            <label className="flex items-center gap-3"><input type="checkbox" name="customerEmail" defaultChecked={s.notifications.customerEmail} className="size-5 accent-graphite" /> Envoyer un accusé de réception par e-mail au client</label>
            <label className="flex items-center gap-3"><input type="checkbox" name="customerSms" defaultChecked={s.notifications.customerSms} className="size-5 accent-graphite" /> Envoyer des SMS au client (si un service SMS est configuré)</label>
            <div className="grid gap-4 pt-3 sm:grid-cols-2">
              <div><label className="field-label" htmlFor="prospectMonths">Conservation des demandes sans suite (mois)</label><input id="prospectMonths" name="prospectMonths" type="number" className="input" defaultValue={s.retention.prospectMonths} /></div>
              <div><label className="field-label" htmlFor="customerMonths">Conservation des clients (mois)</label><input id="customerMonths" name="customerMonths" type="number" className="input" defaultValue={s.retention.customerMonths} /></div>
            </div>
          </ActionForm>
          <div className="mt-6 border-t border-graphite/10 pt-5">
            <ActionForm action={runRetention} submitLabel="Appliquer la politique de conservation maintenant" submitClass="btn btn-outline-dark btn-sm" confirm="Anonymiser les fiches dont la durée de conservation est dépassée ?">
              <p className="text-[0.9375rem] text-mute">Supprime les photos non rattachées et anonymise les fiches inactives au-delà des durées ci-dessus. À lancer régulièrement (ou via une tâche planifiée, voir la documentation).</p>
            </ActionForm>
          </div>
        </Panel>
        <Panel title="Services externes">
          <ul className="divide-y divide-graphite/10">{integrations.map(([n, d, t]) => <li key={n} className="flex flex-wrap items-center justify-between gap-2 py-3"><span><span className="font-semibold">{n}</span><span className="block text-[0.9375rem] text-mute">{d}</span></span><span className={`badge ${tone[t]}`}>{label[t]}</span></li>)}</ul>
          <p className="mt-4 text-[0.9375rem] text-mute">Ces services se configurent par variables d’environnement chez l’hébergeur (voir docs/CONFIGURATION.md). Les clés ne sont jamais visibles ici.</p>
          {env.calendarFeedToken && <p className="mt-3 break-all text-[0.9375rem]">Adresse d’abonnement agenda : <code>{env.siteUrl}/api/calendar/{env.calendarFeedToken}.ics</code></p>}
        </Panel>
        <Panel title="Sécurité du compte"><PasswordForm /></Panel>
      </div>
    </>
  );
}
