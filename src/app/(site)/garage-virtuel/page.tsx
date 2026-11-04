import type { Metadata } from 'next';
import { GarageExperience, type ZoneInfo } from '@/components/three/car/GarageExperience';
import { listServices } from '@/modules/settings/repo';
import { CATEGORY_LABELS, type VehicleCategory } from '@/modules/vehicles/catalog';
import type { ZoneId } from '@/components/three/car/buildCar';

export const metadata: Metadata = {
  title: 'Garage virtuel',
  description: 'Explorez un véhicule de démonstration en 3D, sélectionnez une zone mécanique (freinage, moteur, batterie, pneus…) et demandez l’intervention correspondante.',
  alternates: { canonical: '/garage-virtuel' },
};

const ZONE_TEXT: Record<ZoneId, { label: string; title: string; text: string }> = {
  moteur: { label: 'Moteur', title: 'Moteur', text: 'Entretien, vidange, distribution et diagnostic : le cœur mécanique de votre véhicule, contrôlé selon les préconisations du constructeur.' },
  batterie: { label: 'Batterie', title: 'Batterie et démarrage', text: 'Test de la batterie et du circuit de charge, remplacement si nécessaire, contrôle de l’alternateur et du démarreur.' },
  freinage: { label: 'Freinage', title: 'Freinage', text: 'Contrôle et remplacement des composants de freinage selon votre véhicule : plaquettes, disques, étriers et liquide de frein.' },
  pneumatiques: { label: 'Pneumatiques', title: 'Pneumatiques', text: 'Montage, équilibrage, permutation et changement été / hiver, directement chez vous.' },
  suspension: { label: 'Suspension', title: 'Suspension et amortisseurs', text: 'Amortisseurs, ressorts, silentblocs : confort, tenue de route et distances de freinage en dépendent.' },
  direction: { label: 'Direction', title: 'Direction', text: 'Rotules, biellettes et crémaillère : recherche de jeu et remplacement des éléments accessibles sur place.' },
  transmission: { label: 'Transmission', title: 'Transmission', text: 'Bruits, vibrations, soufflets de cardan : diagnostic, puis réparation lorsqu’elle est réalisable à domicile.' },
  refroidissement: { label: 'Refroidissement', title: 'Refroidissement', text: 'Niveau et état du liquide, durites, radiateur et pompe à eau : prévenir la surchauffe du moteur.' },
};

export default async function GaragePage({ searchParams }: { searchParams: Promise<{ categorie?: string; vehicule?: string }> }) {
  const sp = await searchParams;
  const services = await listServices();
  const zones: ZoneInfo[] = (Object.keys(ZONE_TEXT) as ZoneId[]).map((id) => ({
    id, ...ZONE_TEXT[id],
    services: services.filter((s) => s.garageZones.includes(id)).map((s) => ({ slug: s.slug, name: s.name })),
  }));
  const cat = (sp.categorie ?? '') as VehicleCategory;
  const vehicleText = sp.vehicule ? sp.vehicule.slice(0, 80) : null;
  const categoryNote = vehicleText
    ? cat && cat !== 'compacte' && CATEGORY_LABELS[cat]
      ? `Catégorie : ${CATEGORY_LABELS[cat]}. Le modèle 3D de cette catégorie reste à produire : la berline compacte de démonstration est affichée.`
      : 'Illustration 3D générique non contractuelle.'
    : null;
  return (
    <>
      <section className="on-dark bg-graphite text-paper">
        <div className="container-x pb-8 pt-12 sm:pt-16">
          <p className="eyebrow flex items-center gap-3 text-alu"><span className="h-px w-8 bg-champagne" aria-hidden="true" />Garage virtuel</p>
          <h1 className="mt-5 max-w-3xl text-h1 font-light wide">Explorez. Sélectionnez. Demandez.</h1>
          <p className="mt-5 max-w-2xl text-lead text-paper/75">Touchez une zone du véhicule pour découvrir les interventions possibles. Cette expérience est facultative : la réservation reste accessible à tout moment.</p>
        </div>
      </section>
      <GarageExperience zones={zones} vehicleText={vehicleText} categoryNote={categoryNote} poster="/media/garage-poster.webp" />
    </>
  );
}
