import type { Metadata } from 'next';
import { LegalPage } from '@/components/layout/LegalPage';
import { env } from '@/lib/env';

export const metadata: Metadata = { title: 'Cookies', alternates: { canonical: '/cookies' } };

export default function Page() {
  return (
    <LegalPage title="Cookies et stockage local">
      <p>Ce site n’utilise <strong>aucun cookie publicitaire ni de suivi</strong>. C’est pourquoi aucun bandeau de consentement ne vous est présenté.</p>
      <h2>Ce qui est utilisé</h2>
      <ul>
        <li><strong>Stockage local du navigateur</strong> (« localStorage ») : conserve votre demande de rendez-vous en cours pendant sept jours au maximum, pour que vous puissiez la reprendre après une coupure. Il reste sur votre appareil et est effacé dès l’envoi de la demande.</li>
        <li><strong>Cookie de session de l’administration</strong> : réservé à l’équipe VALFRAN, strictement nécessaire à la connexion.</li>
        {env.analyticsProvider === 'plausible' && <li><strong>Mesure d’audience sans cookie</strong> (Plausible) : statistiques agrégées de pages vues, sans identifiant personnel.</li>}
      </ul>
      <p>Si un outil nécessitant votre consentement était ajouté à l’avenir, un choix vous serait proposé avant tout dépôt.</p>
    </LegalPage>
  );
}
