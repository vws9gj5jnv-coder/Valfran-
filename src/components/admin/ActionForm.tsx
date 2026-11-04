'use client';

import { useActionState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export type ActionResult = { ok?: boolean; error?: string; message?: string } | null;

/** Formulaire d'administration : action serveur + retour visuel (enregistré / erreur). */
export function ActionForm({ action, children, className = '', submitLabel = 'Enregistrer', resetOnSuccess = false, confirm, submitClass = 'btn btn-dark btn-sm', hideSubmit = false }: {
  action: (prev: ActionResult, form: FormData) => Promise<ActionResult>;
  children: React.ReactNode; className?: string; submitLabel?: string; resetOnSuccess?: boolean; confirm?: string; submitClass?: string; hideSubmit?: boolean;
}) {
  const [state, run, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok && resetOnSuccess) ref.current?.reset(); }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={run} className={className} onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
      {children}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!hideSubmit && <button className={submitClass} disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}{submitLabel}</button>}
        <span aria-live="polite" className="text-[0.9375rem]">
          {state?.ok && <span className="inline-flex items-center gap-1.5 text-ok"><CheckCircle2 className="size-4" aria-hidden="true" />{state.message ?? 'Enregistré'}</span>}
          {state?.error && <span className="inline-flex items-center gap-1.5 text-danger"><AlertCircle className="size-4" aria-hidden="true" />{state.error}</span>}
        </span>
      </div>
    </form>
  );
}
