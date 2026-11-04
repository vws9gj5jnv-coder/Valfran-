'use client';

import { useActionState } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { loginAction, type LoginState } from '@/modules/auth/login';
import { Field } from '@/components/ui/Field';

export function LoginForm({ demoHint }: { demoHint?: { email: string; password: string } }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-6">
      <Field label="E-mail"><input name="email" type="email" className="input" autoComplete="username" required defaultValue={demoHint?.email} /></Field>
      <Field label="Mot de passe"><input name="password" type="password" className="input" autoComplete="current-password" required defaultValue={demoHint?.password} /></Field>
      {state.error && <p className="field-error" role="alert">{state.error}</p>}
      <button className="btn btn-dark w-full" disabled={pending}>{pending ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <LogIn className="size-5" aria-hidden="true" />} Se connecter</button>
    </form>
  );
}
