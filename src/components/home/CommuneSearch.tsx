'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Loader2 } from 'lucide-react';
import { euros } from '@/lib/text';

type R = { status: string; distanceKm: number | null; feeCents: number | null; message: string };

/** Vérification rapide d'une commune, sans engagement. */
export function CommuneSearch() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<{ label: string; r: R } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function run(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setRes(null); setLoading(true);
    try {
      const s = await (await fetch(`/api/address/search?q=${encodeURIComponent(q)}`)).json();
      const first = s.results?.[0];
      if (!first) { setErr('Commune non trouvée dans notre liste. Faites votre demande : nous vérifierons le déplacement avec vous.'); return; }
      const r = await (await fetch('/api/address/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ street: '', postcode: first.postcode, city: first.city }) })).json();
      setRes({ label: `${first.postcode} ${first.city}`, r });
    } catch { setErr('Vérification impossible pour le moment. Réessayez ou appelez-nous.'); }
    finally { setLoading(false); }
  }
  return (
    <form onSubmit={run} className="card p-6">
      <label htmlFor="commune-check" className="field-label">Vérifier ma commune</label>
      <div className="flex gap-2">
        <input id="commune-check" className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Code postal ou commune" autoComplete="address-level2" />
        <button className="btn btn-dark shrink-0 px-4" aria-label="Vérifier">{loading ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <Search className="size-5" aria-hidden="true" />}</button>
      </div>
      <div aria-live="polite" className="mt-4">
        {err && <p className="text-mute">{err}</p>}
        {res && (
          <div>
            <p className="font-semibold">{res.label} : {res.r.status === 'served' ? 'desservie' : res.r.status === 'on_request' ? 'sur demande' : 'hors zone'}</p>
            <p className="mt-1 text-mute">{res.r.message}{res.r.status === 'served' && res.r.feeCents !== null ? ` Déplacement : ${res.r.feeCents === 0 ? 'offert' : euros(res.r.feeCents)}.` : ''}</p>
            {res.r.status !== 'outside' && <Link href="/rendez-vous" className="btn btn-accent btn-sm mt-4">Prendre rendez-vous</Link>}
          </div>
        )}
      </div>
    </form>
  );
}
