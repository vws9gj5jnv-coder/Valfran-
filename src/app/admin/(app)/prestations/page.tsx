import Link from 'next/link';
import { AdminHeader } from '@/components/admin/ui';
import { ActionForm } from '@/components/admin/ActionForm';
import { toggleService } from '@/modules/admin/settings-actions';
import { listServices, getSetting } from '@/modules/settings/repo';
import { euros } from '@/lib/text';

export const metadata = { title: 'Prestations et tarifs' };

export default async function ServicesAdmin() {
  const [services, pricing] = await Promise.all([listServices({ includeInactive: true }), getSetting('pricing')]);
  return (
    <>
      <AdminHeader title="Prestations et tarifs" intro="Activez, désactivez et modifiez chaque prestation. Un prix n’est affiché publiquement que s’il est marqué « validé »." actions={<Link href="/admin/prestations/nouvelle" className="btn btn-dark btn-sm">Ajouter une prestation</Link>} />
      {pricing.demoPrices && <p className="mb-5 rounded-sm border border-champagne/60 bg-[#f4efe6] p-4">Les tarifs sont actuellement signalés « tarifs de démonstration » sur le site. Désactivez cette mention dans <Link className="link-u" href="/admin/parametres">Paramètres</Link> une fois vos prix validés.</p>}
      <div className="overflow-x-auto rounded-sm border border-graphite/10 bg-white">
        <table className="w-full min-w-[760px] text-left text-[0.9688rem]">
          <thead className="border-b border-graphite/10 text-[0.875rem] text-mute"><tr>{['Prestation', 'Catégorie', 'Prix indicatif', 'Durée', 'Visible', ''].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-graphite/10">
            {services.map((s) => (
              <tr key={s.id} className={s.active ? '' : 'text-graphite/50'}>
                <td className="px-4 py-3"><Link href={`/admin/prestations/${s.id}`} className="font-semibold link-u">{s.name}</Link><span className="block text-[0.8125rem] text-mute">/services/{s.slug}</span></td>
                <td className="px-4 py-3">{s.category}</td>
                <td className="px-4 py-3">{s.laborPriceCents !== null ? euros(s.laborPriceCents) : '—'} {s.laborPriceCents !== null && (s.priceValidated ? <span className="badge bg-[#dcebe1] text-[#24563a]">validé</span> : <span className="badge bg-graphite/10">non affiché</span>)}</td>
                <td className="px-4 py-3">{s.durationMinutes} min</td>
                <td className="px-4 py-3">{s.active ? 'Oui' : 'Non'}</td>
                <td className="px-4 py-3"><ActionForm action={toggleService} submitLabel={s.active ? 'Désactiver' : 'Activer'} submitClass="btn btn-outline-dark btn-sm"><input type="hidden" name="id" value={s.id} /><input type="hidden" name="active" value={String(!s.active)} /></ActionForm></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
