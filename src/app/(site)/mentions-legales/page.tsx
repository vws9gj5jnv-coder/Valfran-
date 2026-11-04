import type { Metadata } from 'next';
import { LegalPage, V } from '@/components/layout/LegalPage';
import { getSite } from '@/lib/site';

export const metadata: Metadata = { title: 'Mentions légales', alternates: { canonical: '/mentions-legales' } };

export default async function Page() {
  const { business: b, siteUrl } = await getSite();
  return (
    <LegalPage title="Mentions légales">
      <h2>Éditeur du site</h2>
      <p>
        <V v={b.legalName} label="dénomination ou nom de l’entrepreneur" /> — <V v={b.legalForm} label="forme juridique" /><br />
        Adresse : <V v={b.addressLine ? `${b.addressLine}, ${b.postcode} ${b.city}` : ''} label="adresse du siège" /><br />
        SIRET : <V v={b.siret} label="numéro SIRET" /><br />
        Immatriculation : <V v={b.registration} label="RCS / Répertoire des métiers" /><br />
        {b.vatNumber ? <>TVA intracommunautaire : {b.vatNumber}<br /></> : null}
        Téléphone : {b.phoneIsPlaceholder ? <V v="" label="téléphone" /> : b.phone}<br />
        E-mail : <V v={b.email} label="e-mail" /><br />
        Directeur de la publication : <V v={b.publicationDirector} label="directeur de la publication" />
      </p>
      <h2>Hébergement</h2>
      <p><V v={b.hostName} label="nom de l’hébergeur" /><br /><V v={b.hostAddress} label="adresse et téléphone de l’hébergeur" /></p>
      <h2>Assurance professionnelle</h2>
      <p><V v={b.insurance} label="assureur et couverture géographique (obligatoire pour certaines activités artisanales)" /></p>
      <h2>Médiation de la consommation</h2>
      <p>Conformément aux articles L.612-1 et suivants du Code de la consommation, le client peut recourir gratuitement au médiateur : <V v={b.mediator} label="nom et coordonnées du médiateur de la consommation" />.</p>
      <h2>Propriété intellectuelle</h2>
      <p>Les contenus de ce site ({siteUrl}) — textes, visuels, modèles 3D et logotype — sont la propriété de leur éditeur. Les marques et modèles de véhicules cités servent uniquement à identifier le véhicule des clients. Les véhicules présentés en 3D sont des créations originales génériques et ne représentent aucun modèle commercialisé.</p>
      <h2>Données personnelles</h2>
      <p>Voir la <a href="/confidentialite">politique de confidentialité</a> et la page <a href="/cookies">cookies</a>.</p>
    </LegalPage>
  );
}
