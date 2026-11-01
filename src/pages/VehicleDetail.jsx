import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, Phone, ShieldCheck, Wrench } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';
import { getVehicle, VEHICLES } from '../data/vehicles';
import CarVisual from '../components/CarVisual';
import VehicleCard from '../components/VehicleCard';
import Reveal from '../components/Reveal';
import { BUSINESS } from '../data/business';
import { submitVehicleRequest } from '../lib/api';
import NotFound from './NotFound';

export default function VehicleDetail() {
  const { id } = useParams();
  const v = getVehicle(id);
  useMeta(v ? `${v.brand} ${v.model} ${v.version} ${v.year} — Valfran Mécanique` : 'Véhicule introuvable', v ? `${v.brand} ${v.model} ${v.year}, ${v.km.toLocaleString('fr-FR')} km, ${v.fuel}, ${v.price.toLocaleString('fr-FR')} € — révisé et garanti.` : '');
  const [view, setView] = useState(0);
  const [form, setForm] = useState({ name: '', phone: '', email: '', type: 'essai', msg: '' });
  const [state, setState] = useState('idle'); // idle | sending | done

  if (!v) return <NotFound />;
  const specs = [
    ['Année', v.year], ['Kilométrage', `${v.km.toLocaleString('fr-FR')} km`], ['Carburant', v.fuel], ['Boîte', v.gearbox],
    ['Puissance', v.power], ['Carrosserie', v.body], ['Couleur', v.colorName], ['Portes / places', `${v.doors} / ${v.seats}`],
    ['Crit\'Air', v.crit], ['Propriétaires', v.owners],
  ];
  const others = VEHICLES.filter((x) => x.id !== v.id).slice(0, 3);

  const submit = async (e) => {
    e.preventDefault();
    setState('sending');
    await submitVehicleRequest({ vehicle: v.id, ...form });
    setState('done');
  };

  return (
    <section className="pb-20 pt-28 sm:pt-32">
      <div className="container-x">
        <Link to="/vehicules" className="mb-6 inline-flex items-center gap-2 text-sm text-chrome-400 hover:text-chrome-100"><ArrowLeft size={16} /> Retour au showroom</Link>
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="card overflow-hidden">
              <div className="bg-gradient-to-b from-ink-600 to-ink-800 px-8 py-10 sm:px-16 sm:py-14">
                <CarVisual color={v.color} body={v.body} angle={view === 1 ? -1 : 0} className="w-full" />
              </div>
              <div className="flex gap-2 border-t border-ink-600 p-3">
                {['Profil gauche', 'Profil droit'].map((l, i) => (
                  <button key={l} onClick={() => setView(i)} aria-pressed={view === i}
                    className={`rounded-lg px-4 py-2 text-xs font-medium transition ${view === i ? 'bg-ink-500 text-chrome-100' : 'text-chrome-400 hover:bg-ink-700'}`}>{l}</button>
                ))}
                <span className="ml-auto self-center pr-2 text-[11px] text-chrome-500">Illustration · photos réelles sur demande</span>
              </div>
            </div>

            <Reveal className="mt-8">
              <h2 className="text-xl font-bold">Caractéristiques</h2>
              <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink-600 bg-ink-600 sm:grid-cols-3">
                {specs.map(([k, val]) => <div key={k} className="bg-ink-800 p-4"><dt className="text-[11px] uppercase tracking-wider text-chrome-500">{k}</dt><dd className="mt-1 font-medium text-chrome-100">{val}</dd></div>)}
              </dl>
            </Reveal>

            <Reveal className="mt-8">
              <h2 className="text-xl font-bold">Équipements &amp; options</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {v.options.map((o) => <li key={o} className="flex items-center gap-2 text-sm text-chrome-300"><Check size={16} className="text-emerald-400" />{o}</li>)}
              </ul>
            </Reveal>

            <Reveal className="mt-8">
              <h2 className="text-xl font-bold">Historique d'entretien</h2>
              <ol className="mt-5 space-y-5 border-l border-ink-500 pl-6">
                {v.history.map((h) => (
                  <li key={h.date} className="relative">
                    <span className="absolute -left-[31px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-volt-500 bg-ink-950" />
                    <div className="text-xs text-chrome-500">{h.date} · {h.km.toLocaleString('fr-FR')} km</div>
                    <div className="font-medium text-chrome-100">{h.label}</div>
                  </li>
                ))}
                <li className="relative">
                  <span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full bg-ember-500" />
                  <div className="text-xs text-ember-400">Avant vente</div>
                  <div className="font-medium text-chrome-100 flex items-center gap-2"><Wrench size={15} /> Contrôle 40 points + remise en état par Valfran Mécanique</div>
                </li>
              </ol>
            </Reveal>
          </div>

          <aside>
            <div className="card sticky top-24 p-6">
              <span className="chip !border-emerald-500/40 !text-emerald-300"><ShieldCheck size={13} /> Révisé · Garanti</span>
              <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{v.brand} {v.model}</h1>
              <p className="text-chrome-400">{v.version}</p>
              <div className="mt-4 font-display text-4xl font-bold text-ember-400">{v.price.toLocaleString('fr-FR')} €</div>

              {state === 'done' ? (
                <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200" role="status">
                  Merci {form.name.split(' ')[0]} ! Je vous recontacte très rapidement.
                </div>
              ) : (
                <form onSubmit={submit} className="mt-6 space-y-3">
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Type de demande">
                    {[['essai', 'Réserver un essai'], ['infos', 'Demander des infos']].map(([val, l]) => (
                      <button key={val} type="button" role="radio" aria-checked={form.type === val} onClick={() => setForm({ ...form, type: val })}
                        className={`rounded-lg border px-2 py-2.5 text-xs font-medium transition ${form.type === val ? 'border-ember-500 bg-ember-500/10 text-chrome-100' : 'border-ink-500 text-chrome-400'}`}>{l}</button>
                    ))}
                  </div>
                  <input required className="field" placeholder="Nom et prénom" aria-label="Nom et prénom" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <input required type="tel" className="field" placeholder="Téléphone" aria-label="Téléphone" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <input required type="email" className="field" placeholder="E-mail" aria-label="E-mail" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <textarea rows={2} className="field" placeholder="Message (facultatif)" aria-label="Message" value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })} />
                  <button className="btn-primary w-full" disabled={state === 'sending'}>
                    {state === 'sending' ? <><Loader2 size={16} className="animate-spin" /> Envoi…</> : form.type === 'essai' ? 'Réserver un essai' : 'Demander des infos'}
                  </button>
                  <p className="text-[11px] leading-relaxed text-chrome-500">Vos données servent uniquement à répondre à votre demande.</p>
                </form>
              )}
              <a href={BUSINESS.phoneHref} className="btn-ghost mt-3 w-full"><Phone size={16} /> {BUSINESS.phone}</a>
            </div>
          </aside>
        </div>

        <div className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Autres véhicules</h2>
          <div className="grid gap-5 md:grid-cols-3">{others.map((o) => <VehicleCard key={o.id} v={o} />)}</div>
        </div>
      </div>
    </section>
  );
}
