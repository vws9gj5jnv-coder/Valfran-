import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, Briefcase, Loader2, CalendarCheck } from 'lucide-react';
import { useGarage } from '../store/garageStore';
import { getDays, getSlots, toISO } from '../lib/slots';
import { submitBooking } from '../lib/api';
import { eur } from '../lib/pricing';

const fmtDay = (d) => ({
  wd: d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
  day: d.getDate(),
  mo: d.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
});
const PHONE_RE = /^(?:(?:\+|00)33|0)\s?[1-9](?:[\s.-]?\d{2}){4}$/;
const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function StepBooking() {
  const { state, dispatch, quote } = useGarage();
  const days = useMemo(() => getDays(), []);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const { contact } = state;
  const selDay = state.date ? days.find((d) => toISO(d) === state.date) : null;
  const slots = selDay ? getSlots(selDay) : [];

  const validate = () => {
    const e = {};
    if (!state.date) e.date = 'Choisissez une date.';
    if (!state.slot) e.slot = 'Choisissez un créneau.';
    if (state.address.trim().length < 6) e.address = 'Indiquez l\'adresse complète d\'intervention.';
    if (contact.name.trim().length < 2) e.name = 'Nom requis.';
    if (!PHONE_RE.test(contact.phone.trim())) e.phone = 'Numéro de téléphone invalide.';
    if (!MAIL_RE.test(contact.email.trim())) e.email = 'Adresse e-mail invalide.';
    if (!contact.consent) e.consent = 'Veuillez accepter le traitement de vos données.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSending(true);
    const res = await submitBooking({
      vehicle: state.vehicle, service: quote.service.id, addons: state.addons, note: state.otherNote,
      city: quote.city?.name, estimate: { total: quote.total, min: quote.min, max: quote.max },
      date: state.date, slot: state.slot, placeType: state.placeType, address: state.address, contact,
    });
    setSending(false);
    dispatch({ type: 'CONFIRM', confirmation: { ref: res.ref } });
  };

  const Err = ({ k }) => (errors[k] ? <p role="alert" className="mt-1 text-xs text-red-400">{errors[k]}</p> : null);
  const set = (patch) => dispatch({ type: 'SET_CONTACT', patch });

  return (
    <form onSubmit={submit} noValidate>
      <h3 className="text-2xl font-bold">Choisissez votre créneau</h3>
      <p className="mt-2 text-sm text-chrome-400">Je viens à vous, du lundi au samedi.</p>

      <div className="mt-5">
        <span className="label">Date</span>
        <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" role="radiogroup" aria-label="Date">
          {days.map((d) => {
            const f = fmtDay(d); const iso = toISO(d); const sel = state.date === iso;
            return (
              <button key={iso} type="button" role="radio" aria-checked={sel}
                onClick={() => dispatch({ type: 'SET', patch: { date: iso, slot: null } })}
                className={`flex w-16 shrink-0 snap-start flex-col items-center rounded-xl border py-2.5 transition ${
                  sel ? 'border-ember-500 bg-ember-500 text-ink-950 shadow-ember' : 'border-ink-500 bg-ink-800 hover:border-chrome-400'
                }`}>
                <span className="text-[11px] uppercase opacity-80">{f.wd}</span>
                <span className="font-display text-xl font-bold leading-tight">{f.day}</span>
                <span className="text-[11px] uppercase opacity-80">{f.mo}</span>
              </button>
            );
          })}
        </div>
        <Err k="date" />
      </div>

      {selDay && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <span className="label">Heure d'arrivée</span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Heure">
            {slots.map((s) => {
              const sel = state.slot === s.time;
              return (
                <button key={s.time} type="button" role="radio" aria-checked={sel} disabled={!s.available}
                  onClick={() => dispatch({ type: 'SET', patch: { slot: s.time } })}
                  className={`rounded-lg border py-2.5 text-sm font-medium transition ${
                    sel ? 'border-volt-500 bg-volt-500 text-white' : 'border-ink-500 hover:border-chrome-400'
                  } ${!s.available ? 'text-chrome-500 line-through opacity-40' : ''}`}>
                  {s.time}
                </button>
              );
            })}
          </div>
          <Err k="slot" />
        </motion.div>
      )}

      <div className="mt-6">
        <span className="label">Lieu de prise en charge</span>
        <div className="grid grid-cols-2 gap-2">
          {[{ id: 'domicile', label: 'À mon domicile', icon: Home }, { id: 'travail', label: 'Sur mon lieu de travail', icon: Briefcase }].map((o) => {
            const sel = state.placeType === o.id;
            return (
              <button key={o.id} type="button" aria-pressed={sel}
                onClick={() => dispatch({ type: 'SET', patch: { placeType: o.id } })}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition ${
                  sel ? 'border-volt-500 bg-volt-500/15 text-chrome-100' : 'border-ink-500 text-chrome-300 hover:border-chrome-400'
                }`}>
                <o.icon size={16} /> {o.label}
              </button>
            );
          })}
        </div>
        <input className="field mt-2" placeholder={`Adresse complète (${quote.city?.name ?? 'commune'})`} autoComplete="street-address"
          value={state.address} onChange={(e) => dispatch({ type: 'SET', patch: { address: e.target.value } })} aria-label="Adresse d'intervention" />
        <Err k="address" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="b-name">Nom et prénom</label>
          <input id="b-name" className="field" autoComplete="name" value={contact.name} onChange={(e) => set({ name: e.target.value })} />
          <Err k="name" />
        </div>
        <div>
          <label className="label" htmlFor="b-phone">Téléphone</label>
          <input id="b-phone" className="field" type="tel" autoComplete="tel" placeholder="06 12 34 56 78" value={contact.phone} onChange={(e) => set({ phone: e.target.value })} />
          <Err k="phone" />
        </div>
        <div>
          <label className="label" htmlFor="b-mail">E-mail</label>
          <input id="b-mail" className="field" type="email" autoComplete="email" value={contact.email} onChange={(e) => set({ email: e.target.value })} />
          <Err k="email" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="b-notes">Précisions (facultatif)</label>
          <textarea id="b-notes" rows={2} className="field" placeholder="Accès, digicode, symptômes constatés…" value={contact.notes} onChange={(e) => set({ notes: e.target.value })} />
        </div>
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-chrome-400">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-orange-500" checked={contact.consent} onChange={(e) => set({ consent: e.target.checked })} />
        <span>J'accepte que mes informations soient utilisées pour traiter ma demande, conformément à la <a className="underline hover:text-chrome-100" href="/confidentialite" target="_blank" rel="noreferrer">politique de confidentialité</a>.</span>
      </label>
      <Err k="consent" />

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" className="btn-ghost" onClick={() => dispatch({ type: 'GO', step: 4 })}><ArrowLeft size={16} /> Retour</button>
        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? <><Loader2 size={18} className="animate-spin" /> Envoi…</> : <><CalendarCheck size={18} /> Confirmer · {eur(quote.total)}</>}
        </button>
      </div>
    </form>
  );
}
