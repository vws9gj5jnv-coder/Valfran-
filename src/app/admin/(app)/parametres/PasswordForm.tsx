'use client';

import { useActionState } from 'react';
import { changePasswordAction } from '@/modules/auth/login';

export function PasswordForm() {
  const [state, action, pending] = useActionState<{ error?: string; ok?: boolean }, FormData>(changePasswordAction, {});
  return (
    <form action={action} className="space-y-3">
      <div><label className="field-label" htmlFor="current">Mot de passe actuel</label><input id="current" name="current" type="password" className="input" autoComplete="current-password" /></div>
      <div><label className="field-label" htmlFor="next">Nouveau mot de passe (12 caractères minimum)</label><input id="next" name="next" type="password" className="input" autoComplete="new-password" minLength={12} /></div>
      {state.error && <p className="field-error">{state.error}</p>}
      {state.ok && <p className="text-ok">Mot de passe modifié.</p>}
      <button className="btn btn-dark btn-sm" disabled={pending}>Changer le mot de passe</button>
    </form>
  );
}
