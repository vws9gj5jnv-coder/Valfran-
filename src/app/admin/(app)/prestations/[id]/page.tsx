import { notFound } from 'next/navigation';
import { AdminHeader, Panel } from '@/components/admin/ui';
import { ActionForm } from '@/components/admin/ActionForm';
import { saveService } from '@/modules/admin/settings-actions';
import { listServices } from '@/modules/settings/repo';

export const metadata = { title: 'Prestation' };
const ZONES = [['moteur', 'Moteur'], ['batterie', 'Batterie'], ['freinage', 'Freinage'], ['pneumatiques', 'Pneumatiques'], ['suspension', 'Suspension'], ['direction', 'Direction'], ['transmission', 'Transmission'], ['refroidissement', 'Refroidissement']];

export default async function ServiceEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = id === 'nouvelle' ? null : (await listServices({ includeInactive: true })).find((x) => x.id === id);
  if (id !== 'nouvelle' && !s) notFound();
  const F = ({ name, label, children, hint }: { name: string; label: string; children: React.ReactNode; hint?: string }) => (<div><label className="field-label" htmlFor={name}>{label}</label>{children}{hint && <p className="field-hint">{hint}</p>}</div>);
  return (
    <>
      <AdminHeader back={{ href: '/admin/prestations', label: 'Prestations' }} title={s ? s.name : 'Nouvelle prestation'} />
      <Panel>
        <ActionForm action={saveService} className="space-y-6">
          <input type="hidden" name="id" value={s?.id ?? ''} />
          <div className="grid gap-5 md:grid-cols-2">
            <F name="name" label="Nom"><input id="name" name="name" className="input" defaultValue={s?.name} required /></F>
            <F name="category" label="Catégorie"><input id="category" name="category" className="input" defaultValue={s?.category ?? 'Mécanique'} /></F>
            {!s && <F name="slug" label="Adresse de la page (slug)" hint="Laisser vide pour la générer depuis le nom."><input id="slug" name="slug" className="input" /></F>}
            <F name="shortDescription" label="Résumé (une ligne)"><input id="shortDescription" name="shortDescription" className="input" defaultValue={s?.shortDescription} /></F>
          </div>
          <F name="description" label="Description"><textarea id="description" name="description" className="input" rows={3} defaultValue={s?.description} /></F>
          <div className="grid gap-5 md:grid-cols-3">
            <F name="includes" label="Ce que comprend l’intervention" hint="Une ligne par élément."><textarea id="includes" name="includes" className="input" rows={5} defaultValue={s?.includes.join('\n')} /></F>
            <F name="requirements" label="Conditions sur place" hint="Une ligne par condition."><textarea id="requirements" name="requirements" className="input" rows={5} defaultValue={s?.requirements.join('\n')} /></F>
            <F name="infoNeeded" label="Informations à préparer" hint="Une ligne par information."><textarea id="infoNeeded" name="infoNeeded" className="input" rows={5} defaultValue={s?.infoNeeded.join('\n')} /></F>
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            <F name="laborPrice" label="Prix indicatif (€ TTC)" hint="Vide = sur devis."><input id="laborPrice" name="laborPrice" className="input" inputMode="decimal" defaultValue={s?.laborPriceCents != null ? String(s.laborPriceCents / 100) : ''} /></F>
            <F name="durationMinutes" label="Durée estimée (min)"><input id="durationMinutes" name="durationMinutes" type="number" min={15} step={15} className="input" defaultValue={s?.durationMinutes ?? 60} /></F>
            <F name="sortOrder" label="Ordre d’affichage"><input id="sortOrder" name="sortOrder" type="number" className="input" defaultValue={s?.sortOrder ?? 50} /></F>
            <div className="space-y-3 pt-8">
              <label className="flex items-center gap-3"><input type="checkbox" name="priceValidated" defaultChecked={s?.priceValidated} className="size-5 accent-graphite" /> Prix validé (affiché)</label>
              <label className="flex items-center gap-3"><input type="checkbox" name="active" defaultChecked={s?.active ?? true} className="size-5 accent-graphite" /> Prestation active</label>
              <label className="flex items-center gap-3"><input type="checkbox" name="isDiagnostic" defaultChecked={s?.isDiagnostic} className="size-5 accent-graphite" /> Prestation de diagnostic</label>
            </div>
          </div>
          <F name="priceNote" label="Précision sur le prix"><input id="priceNote" name="priceNote" className="input" defaultValue={s?.priceNote} /></F>
          <fieldset><legend className="field-label">Zones du garage virtuel associées</legend><div className="flex flex-wrap gap-4">{ZONES.map(([k, v]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" name="garageZones" value={k} defaultChecked={s?.garageZones.includes(k)} className="size-5 accent-graphite" />{v}</label>)}</div></fieldset>
          <div className="grid gap-5 md:grid-cols-2">
            <F name="seoTitle" label="Titre pour les moteurs de recherche"><input id="seoTitle" name="seoTitle" className="input" defaultValue={s?.seoTitle} maxLength={120} /></F>
            <F name="seoDescription" label="Description pour les moteurs de recherche"><input id="seoDescription" name="seoDescription" className="input" defaultValue={s?.seoDescription} maxLength={300} /></F>
          </div>
        </ActionForm>
      </Panel>
    </>
  );
}
