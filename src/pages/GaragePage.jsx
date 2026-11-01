import { useMeta } from '../hooks/useMeta';
import GarageVirtuel from '../garage/GarageVirtuel';
import { TrustBadges } from '../components/Sections';

export default function GaragePage() {
  useMeta('Garage Virtuel & RDV en ligne — Valfran Mécanique', 'Entrez votre plaque, choisissez votre intervention, obtenez un devis instantané et réservez votre rendez-vous à domicile.');
  return (
    <section className="pb-20 pt-28 sm:pt-36">
      <div className="container-x">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <span className="eyebrow">Garage Virtuel</span>
          <h1 className="h-section mt-3">Devis et rendez-vous en 5 étapes</h1>
          <p className="lead mt-4">Plaque, intervention, prix, créneau : tout se fait ici, en moins de deux minutes.</p>
        </div>
        <div className="mx-auto max-w-5xl"><GarageVirtuel showSummary /></div>
        <div className="mt-16"><TrustBadges /></div>
      </div>
    </section>
  );
}
