import { AlertCircle } from 'lucide-react';
import { cloneElement, isValidElement, useId } from 'react';

/** Champ de formulaire accessible : libellé, aide et message d'erreur reliés au contrôle. */
export function Field({ label, hint, error, children, optional, className = '' }: {
  label: React.ReactNode; hint?: React.ReactNode; error?: string; children: React.ReactElement<Record<string, unknown>>; optional?: boolean; className?: string;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: (children.props.id as string) ?? id,
        'aria-describedby': [hintId, errId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? true : undefined,
      })
    : children;
  const controlId = (isValidElement(children) && (children.props.id as string)) || id;
  return (
    <div className={className}>
      <label htmlFor={controlId} className="field-label">
        {label} {optional && <span className="font-normal text-mute">(facultatif)</span>}
      </label>
      {control}
      {hint && <p id={hintId} className="field-hint">{hint}</p>}
      {error && (
        <p id={errId} className="field-error" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}

export function Notice({ tone = 'info', title, children, role }: { tone?: 'info' | 'ok' | 'warn' | 'danger' | 'demo'; title?: React.ReactNode; children?: React.ReactNode; role?: 'status' | 'alert' }) {
  const styles = {
    info: 'border-graphite/15 bg-white',
    ok: 'border-ok/40 bg-[#eef5f0]',
    warn: 'border-warn/40 bg-[#f8f1e4]',
    danger: 'border-danger/40 bg-[#f8ebe8]',
    demo: 'border-champagne/60 bg-[#f4efe6]',
  }[tone];
  const bar = { info: 'bg-graphite/40', ok: 'bg-ok', warn: 'bg-warn', danger: 'bg-danger', demo: 'bg-champagne' }[tone];
  return (
    <div className={`relative overflow-hidden rounded-sm border p-4 pl-5 ${styles}`} role={role}>
      <span className={`absolute inset-y-0 left-0 w-1 ${bar}`} aria-hidden="true" />
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-1 text-[0.9688rem] text-graphite/85' : 'text-[0.9688rem]'}>{children}</div>}
    </div>
  );
}
