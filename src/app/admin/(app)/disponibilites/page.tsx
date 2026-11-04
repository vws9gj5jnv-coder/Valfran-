import { asc, gte } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { closures } from '@/db/schema';
import { AdminHeader, Panel, Empty, dt } from '@/components/admin/ui';
import { ActionForm } from '@/components/admin/ActionForm';
import { saveAvailability, addClosure, deleteClosure } from '@/modules/admin/settings-actions';
import { getSetting } from '@/modules/settings/repo';

export const metadata = { title: 'Horaires et congés' };
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default async function AvailabilityAdmin() {
  const a = await getSetting('availability');
  const db = await getDb();
  const list = await db.select().from(closures).where(gte(closures.endsAt, new Date())).orderBy(asc(closures.startsAt));
  return (
    <>
      <AdminHeader title="Horaires et congés" intro="Les créneaux proposés aux clients (matin / après-midi) sont calculés à partir de ces horaires, des congés et des rendez-vous déjà confirmés. Le client exprime une préférence : vous confirmez ensuite." />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Horaires hebdomadaires">
          <ActionForm action={saveAvailability}>
            <div className="space-y-2">
              {DAYS.map((d, i) => {
                const r = a.weekly[String(i + 1)] ?? [];
                const am = r.find((x) => x.start < '12:30'), pm = r.find((x) => x.start >= '12:30');
                return (
                  <div key={d} className="grid grid-cols-[6.5rem_1fr_1fr] items-center gap-3 border-b border-graphite/10 py-2 last:border-0">
                    <span className="font-semibold">{d}</span>
                    {([['am', am, '08:00', '12:00', 'Matin'], ['pm', pm, '13:30', '18:00', 'Après-midi']] as const).map(([p, v, s, e, l]) => (
                      <div key={p} className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-2 text-[0.9375rem]"><input type="checkbox" name={`d${i + 1}${p}`} defaultChecked={!!v} className="size-5 accent-graphite" />{l}</label>
                        <input type="time" name={`d${i + 1}${p}s`} aria-label={`${d} ${l} début`} defaultValue={v?.start ?? s} className="input min-h-[40px] w-[7.5rem] py-1" />
                        <input type="time" name={`d${i + 1}${p}e`} aria-label={`${d} ${l} fin`} defaultValue={v?.end ?? e} className="input min-h-[40px] w-[7.5rem] py-1" />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><label className="field-label" htmlFor="minNoticeHours">Délai minimal avant un créneau (heures)</label><input id="minNoticeHours" name="minNoticeHours" type="number" min={0} className="input" defaultValue={a.minNoticeHours} /></div>
              <div><label className="field-label" htmlFor="daysAhead">Créneaux proposés sur (jours)</label><input id="daysAhead" name="daysAhead" type="number" min={3} max={90} className="input" defaultValue={a.daysAhead} /></div>
            </div>
          </ActionForm>
        </Panel>
        <div className="space-y-6">
          <Panel title="Ajouter des congés ou une indisponibilité">
            <ActionForm action={addClosure} submitLabel="Ajouter la période" resetOnSuccess>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="field-label" htmlFor="from">Du</label><input id="from" name="from" type="date" className="input" required /></div>
                <div><label className="field-label" htmlFor="fromTime">à partir de</label><input id="fromTime" name="fromTime" type="time" className="input" defaultValue="00:00" /></div>
                <div><label className="field-label" htmlFor="to">Au</label><input id="to" name="to" type="date" className="input" required /></div>
                <div><label className="field-label" htmlFor="toTime">jusqu’à</label><input id="toTime" name="toTime" type="time" className="input" defaultValue="23:59" /></div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div><label className="field-label" htmlFor="kind">Type</label><select id="kind" name="kind" className="input"><option value="conges">Congés</option><option value="indisponibilite">Indisponibilité</option></select></div>
                <div><label className="field-label" htmlFor="reason">Motif (interne)</label><input id="reason" name="reason" className="input" /></div>
              </div>
            </ActionForm>
          </Panel>
          <Panel title="Périodes à venir">
            {list.length === 0 ? <Empty>Aucune période programmée.</Empty> : (
              <ul className="divide-y divide-graphite/10">{list.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span><span className="font-semibold">{c.kind === 'conges' ? 'Congés' : 'Indisponibilité'}</span> — {dt.format(c.startsAt)} → {dt.format(c.endsAt)}{c.reason && <span className="block text-mute">{c.reason}</span>}</span>
                  <ActionForm action={deleteClosure} submitLabel="Supprimer" submitClass="btn btn-outline-dark btn-sm"><input type="hidden" name="id" value={c.id} /></ActionForm>
                </li>
              ))}</ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
