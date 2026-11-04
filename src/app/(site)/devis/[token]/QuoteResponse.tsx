'use client';

import { useActionState } from 'react';
import { Loader2 } from 'lucide-react';
import { respondToQuote, type PublicQuoteState } from '@/modules/quotes/public-actions';
import { Notice } from '@/components/ui/Field';

export function QuoteResponse({ token }: { token: string }) {
  const [state, action, pending] = useActionState<PublicQuoteState, FormData>(respondToQuote, {});
  if (state.ok) return <Notice tone={state.decision === 'accepte' ? 'ok' : 'info'} role="status" title={state.decision === 'accepte' ? 'Devis accepté' : 'Devis refusé'}>{state.decision === 'accepte' ? 'Merci. Nous vous contactons pour fixer la date de l’intervention.' : 'Votre réponse est enregistrée. N’hésitez pas à nous appeler.'}</Notice>;
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <div><label htmlFor="qname" className="field-label">Votre nom</label><input id="qname" name="name" className="input" autoComplete="name" /></div>
      <label className="flex items-start gap-3"><input type="checkbox" name="agree" className="mt-1 size-6 accent-graphite" /> <span>J’accepte ce devis et ses conditions. Cette acceptation vaut bon pour accord.</span></label>
      {state.error && <p className="field-error" role="alert">{state.error}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button name="decision" value="accepte" className="btn btn-accent" disabled={pending}>{pending && <Loader2 className="size-5 animate-spin" aria-hidden="true" />} Accepter le devis</button>
        <button name="decision" value="refuse" className="btn btn-outline-dark" disabled={pending}>Refuser</button>
      </div>
    </form>
  );
}
