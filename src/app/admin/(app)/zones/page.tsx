import { AdminHeader, Panel } from '@/components/admin/ui';
import { ActionForm } from '@/components/admin/ActionForm';
import { saveZone, saveCommune, deleteCommune } from '@/modules/admin/settings-actions';
import { getSetting, listCommunes } from '@/modules/settings/repo';
import { computeCoverage } from '@/modules/zones/coverage';
import { euros } from '@/lib/text';

export const metadata = { title: 'Zones et déplacements' };

export default async function ZonesAdmin() {
  const [z, communes] = await Promise.all([getSetting('zone'), listCommunes()]);
  return (
    <>
      <AdminHeader title="Zones et déplacements" intro="Point de départ, rayon, frais par palier de distance et exceptions par commune. Les distances sont estimées : vol d’oiseau × coefficient routier." />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Panel title="Règles générales">
          <ActionForm action={saveZone} className="space-y-4">
            <div><label className="field-label" htmlFor="baseName">Point de départ</label><input id="baseName" name="baseName" className="input" defaultValue={z.baseName} /></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="field-label" htmlFor="baseLat">Latitude</label><input id="baseLat" name="baseLat" className="input" defaultValue={z.baseLat} /></div><div><label className="field-label" htmlFor="baseLon">Longitude</label><input id="baseLon" name="baseLon" className="input" defaultValue={z.baseLon} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><label className="field-label" htmlFor="maxKm">Distance maximale (km route)</label><input id="maxKm" name="maxKm" type="number" className="input" defaultValue={z.maxKm} /></div><div><label className="field-label" htmlFor="roadFactor">Coefficient routier</label><input id="roadFactor" name="roadFactor" type="number" step="0.05" min="1" max="2" className="input" defaultValue={z.roadFactor} /></div></div>
            <div><label className="field-label" htmlFor="outsidePolicy">Au-delà de la distance maximale</label><select id="outsidePolicy" name="outsidePolicy" className="input" defaultValue={z.outsidePolicy}><option value="on_request">Accepter la demande « à confirmer »</option><option value="refuse">Refuser la demande</option></select></div>
            <fieldset><legend className="field-label">Paliers de frais de déplacement</legend>
              <div className="space-y-2">{Array.from({ length: 6 }, (_, i) => z.tiers[i]).map((t, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_auto_1fr] items-center gap-2"><span className="text-mute">jusqu’à</span><input aria-label={`Palier ${i + 1} : km`} name={`tierKm${i}`} className="input min-h-[44px]" defaultValue={t?.upToKm ?? ''} placeholder="km" /><span className="text-mute">km :</span><input aria-label={`Palier ${i + 1} : frais`} name={`tierFee${i}`} className="input min-h-[44px]" defaultValue={t ? String(t.feeCents / 100) : ''} placeholder="€" /></div>
              ))}</div>
            </fieldset>
          </ActionForm>
        </Panel>
        <Panel title={`Communes (${communes.length})`}>
          <div className="max-h-[720px] overflow-y-auto">
            <table className="w-full text-left text-[0.9375rem]">
              <thead className="sticky top-0 bg-white text-[0.8125rem] text-mute"><tr><th className="py-2">Commune</th><th className="py-2">Distance</th><th className="py-2">Réglages</th></tr></thead>
              <tbody className="divide-y divide-graphite/10">
                {communes.map((c) => { const cov = computeCoverage(c, z, c); return (
                  <tr key={c.id} className="align-top">
                    <td className="py-3 pr-3"><span className="font-semibold">{c.name}</span><span className="block text-mute">{c.postcode}</span></td>
                    <td className="py-3 pr-3 whitespace-nowrap">≈ {cov.distanceKm} km<span className="block text-mute">{cov.status === 'served' ? (cov.feeCents === 0 ? 'offert' : euros(cov.feeCents)) : cov.status === 'on_request' ? 'sur demande' : 'exclue'}</span></td>
                    <td className="py-3">
                      <ActionForm action={saveCommune} submitLabel="OK" submitClass="btn btn-outline-dark btn-sm">
                        <input type="hidden" name="id" value={c.id} />
                        <div className="flex flex-wrap items-center gap-2">
                          <select name="status" aria-label={`Statut ${c.name}`} defaultValue={c.status} className="input min-h-[40px] w-auto py-1 text-[0.9375rem]"><option value="served">Desservie</option><option value="on_request">Sur demande</option><option value="excluded">Exclue</option></select>
                          <input name="fee" aria-label={`Frais spécifiques ${c.name}`} defaultValue={c.travelFeeOverrideCents != null ? c.travelFeeOverrideCents / 100 : ''} placeholder="frais €" className="input min-h-[40px] w-24 text-[0.9375rem]" />
                          <label className="flex items-center gap-1.5 text-[0.875rem]"><input type="checkbox" name="featured" defaultChecked={c.featured} className="size-4 accent-graphite" /> page locale</label>
                        </div>
                        {c.featured && <textarea name="localIntro" aria-label={`Texte local ${c.name}`} defaultValue={c.localIntro} placeholder="Texte de présentation de la page locale (facultatif)" className="input mt-2 min-h-[70px] text-[0.9375rem]" />}
                      </ActionForm>
                      <ActionForm action={deleteCommune} submitLabel="Supprimer" submitClass="text-[0.8125rem] text-danger underline" confirm={`Supprimer ${c.name} ?`}><input type="hidden" name="id" value={c.id} /></ActionForm>
                    </td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 border-t border-graphite/10 pt-5">
            <h3 className="font-semibold">Ajouter une commune</h3>
            <ActionForm action={saveCommune} submitLabel="Ajouter" resetOnSuccess className="mt-3">
              <div className="grid gap-2 sm:grid-cols-5">
                <input name="name" aria-label="Nom" placeholder="Nom" className="input sm:col-span-2" />
                <input name="postcode" aria-label="Code postal" placeholder="Code postal" className="input" />
                <input name="lat" aria-label="Latitude" placeholder="Latitude" className="input" />
                <input name="lon" aria-label="Longitude" placeholder="Longitude" className="input" />
              </div>
              <input type="hidden" name="status" value="served" />
              <p className="field-hint">Coordonnées du centre de la commune (disponibles sur adresse.data.gouv.fr ou une carte en ligne).</p>
            </ActionForm>
          </div>
        </Panel>
      </div>
    </>
  );
}
