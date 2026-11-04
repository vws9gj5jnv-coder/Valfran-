import { useMeta } from '../hooks/useMeta';
import { BUSINESS } from '../data/business';

const Page = ({ title, children }) => (
  <section className="pb-20 pt-28 sm:pt-36">
    <div className="container-x max-w-3xl">
      <h1 className="h-section">{title}</h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-chrome-300 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold">{children}</div>
      <p className="mt-10 rounded-xl border border-ember-500/30 bg-ember-500/10 p-4 text-xs text-ember-300">Modèle à compléter et à faire valider : les informations entre crochets ou génériques doivent être remplacées par vos données réelles.</p>
    </div>
  </section>
);

export function MentionsLegales() {
  useMeta('Mentions légales — Valfran Mécanique', 'Mentions légales du site Valfran Mécanique.');
  const l = BUSINESS.legal;
  return (
    <Page title="Mentions légales">
      <div><h2>Éditeur du site</h2><p>{BUSINESS.name} — {l.form}<br />SIRET : {l.siret}<br />Adresse : {l.address}<br />Téléphone : {BUSINESS.phone} · E-mail : {BUSINESS.email}</p></div>
      <div><h2>Hébergement</h2><p>{l.host}</p></div>
      <div><h2>Propriété intellectuelle</h2><p>L'ensemble des contenus (textes, logo, visuels) est la propriété de {BUSINESS.name}. Toute reproduction sans autorisation est interdite.</p></div>
      <div><h2>Responsabilité</h2><p>Les estimations de prix fournies par le Garage Virtuel sont indicatives et non contractuelles ; seul le devis ferme accepté par le client engage {BUSINESS.name}.</p></div>
    </Page>
  );
}

export function Confidentialite() {
  useMeta('Politique de confidentialité — Valfran Mécanique', 'Politique de confidentialité et protection des données personnelles.');
  return (
    <Page title="Politique de confidentialité">
      <div><h2>Données collectées</h2><p>Nom, téléphone, e-mail, adresse d'intervention, plaque d'immatriculation et informations sur le véhicule, uniquement lorsque vous remplissez un formulaire.</p></div>
      <div><h2>Finalités</h2><p>Répondre à vos demandes, établir un devis, planifier un rendez-vous et gérer la relation client.</p></div>
      <div><h2>Durée de conservation</h2><p>3 ans à compter du dernier contact pour les prospects ; durées légales pour les données de facturation.</p></div>
      <div><h2>Vos droits</h2><p>Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition et de portabilité en écrivant à {BUSINESS.email}. Vous pouvez introduire une réclamation auprès de la CNIL.</p></div>
      <div><h2>Cookies</h2><p>Ce site n'utilise aucun traceur publicitaire. Aucun bandeau de consentement n'est nécessaire tant que seuls des cookies strictement techniques sont utilisés.</p></div>
    </Page>
  );
}
