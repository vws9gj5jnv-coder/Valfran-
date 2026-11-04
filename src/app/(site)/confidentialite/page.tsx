import type { Metadata } from 'next';
import { LegalPage, V } from '@/components/layout/LegalPage';
import { getSite } from '@/lib/site';
import { env } from '@/lib/env';

export const metadata: Metadata = { title: 'Politique de confidentialité', alternates: { canonical: '/confidentialite' } };

export default async function Page() {
  const s = await getSite();
  const b = s.business;
  const processors = [
    env.databaseUrl ? 'Hébergeur de la base de données (à préciser selon le prestataire retenu)' : null,
    env.emailProvider === 'resend' ? 'Resend (envoi d’e-mails)' : env.emailProvider === 'brevo' ? 'Brevo (envoi d’e-mails)' : null,
    env.smsProvider === 'brevo' ? 'Brevo (envoi de SMS)' : null,
    env.plateProvider === 'http' ? 'Fournisseur d’identification de véhicule par immatriculation (à préciser)' : null,
    env.geocoder === 'ban' ? 'Base Adresse Nationale (service public, recherche d’adresse)' : null,
    env.analyticsProvider === 'plausible' ? 'Plausible Analytics (mesure d’audience sans cookie, données agrégées)' : null,
  ].filter(Boolean);
  return (
    <LegalPage title="Politique de confidentialité">
      <p>Cette page explique quelles données nous utilisons, pourquoi, et comment exercer vos droits (règlement européen 2016/679, « RGPD », et loi Informatique et Libertés).</p>
      <h2>Responsable du traitement</h2>
      <p><V v={b.legalName} label="dénomination" />, <V v={b.addressLine ? `${b.addressLine}, ${b.postcode} ${b.city}` : ''} label="adresse" />. Contact : <V v={b.email} label="e-mail de contact" />.</p>
      <h2>Données collectées et finalités</h2>
      <ul>
        <li><strong>Demande de rendez-vous</strong> : nom, téléphone, e-mail (facultatif), adresse d’intervention, véhicule (immatriculation ou marque, modèle, année), description du besoin, photos facultatives, créneaux souhaités. Finalité : étudier et organiser l’intervention, établir un devis. Base légale : mesures précontractuelles prises à votre demande.</li>
        <li><strong>Devis et interventions</strong> : informations nécessaires à l’exécution du contrat et aux obligations comptables. Base légale : contrat et obligation légale.</li>
        <li><strong>Formulaire de contact</strong> : nom, coordonnées, message. Base légale : intérêt légitime à répondre à vos questions.</li>
        <li><strong>Sécurité</strong> : empreinte non réversible de l’adresse IP pour limiter les abus (recherches de plaques, envois répétés). Base légale : intérêt légitime.</li>
      </ul>
      <p>L’immatriculation n’est utilisée que pour identifier votre véhicule ; elle n’est jamais transmise à des outils de mesure d’audience ni inscrite en clair dans les journaux techniques.</p>
      <h2>Durées de conservation</h2>
      <ul>
        <li>Demandes sans suite : {s.retention.prospectMonths} mois après le dernier contact.</li>
        <li>Clients : {s.retention.customerMonths} mois après la dernière intervention ; les pièces comptables sont conservées dix ans (obligation légale).</li>
        <li>Brouillon de demande : conservé uniquement dans votre navigateur, sept jours au maximum.</li>
      </ul>
      <h2>Destinataires</h2>
      <p>Vos données sont destinées exclusivement à {b.name}. Elles ne sont ni vendues ni cédées. Sous-traitants techniques :</p>
      <ul>{processors.length ? processors.map((p) => <li key={p as string}>{p}</li>) : <li>Aucun sous-traitant externe n’est activé dans la configuration actuelle (hébergeur du site mis à part : <V v={b.hostName} label="hébergeur" />).</li>}</ul>
      <h2>Vos droits</h2>
      <p>Vous pouvez demander l’accès, la rectification, l’effacement, la limitation ou la portabilité de vos données, et vous opposer à leur traitement, en écrivant à <V v={b.email} label="e-mail" />. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).</p>
      <h2>Sécurité</h2>
      <p>Connexion chiffrée (HTTPS), accès à l’administration protégé par mot de passe robuste et session sécurisée, photos stockées hors de l’espace public et accessibles uniquement après authentification.</p>
    </LegalPage>
  );
}
