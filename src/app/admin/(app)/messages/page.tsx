import { desc } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { messages, notifications } from '@/db/schema';
import { AdminHeader, Panel, Empty, dt } from '@/components/admin/ui';
import { ActionForm } from '@/components/admin/ActionForm';
import { markMessage } from '@/modules/admin/settings-actions';
import { maskEmail, maskPhone } from '@/lib/text';

export const metadata = { title: 'Messages et envois' };
const STATUS: Record<string, [string, string]> = { sent: ['Envoyé', 'bg-[#dcebe1] text-[#24563a]'], simulated: ['Simulé — non envoyé', 'bg-[#f4efe6] text-champagne-ink border border-champagne/60'], failed: ['Échec', 'bg-[#f3dcd8] text-[#7c2a20]'], disabled: ['Non envoyé (service désactivé)', 'bg-graphite/10'] };

export default async function MessagesAdmin() {
  const db = await getDb();
  const [msgs, outbox] = await Promise.all([db.select().from(messages).orderBy(desc(messages.createdAt)).limit(100), db.select().from(notifications).orderBy(desc(notifications.createdAt)).limit(100)]);
  return (
    <>
      <AdminHeader title="Messages et envois" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Formulaire de contact">
          {msgs.length === 0 ? <Empty>Aucun message.</Empty> : (
            <ul className="divide-y divide-graphite/10">{msgs.map((m) => (
              <li key={m.id} className={`py-4 ${m.status === 'traite' ? 'opacity-60' : ''}`}>
                <p className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{m.name}</span><span className="text-[0.875rem] text-mute">{dt.format(m.createdAt)}</span></p>
                <p className="text-[0.9375rem]">{m.phone && <a className="link-u" href={`tel:${m.phone}`}>{m.phone}</a>} {m.email && <a className="link-u" href={`mailto:${m.email}`}>{m.email}</a>}</p>
                <p className="mt-2 whitespace-pre-wrap">{m.body}</p>
                <ActionForm action={markMessage} submitLabel={m.status === 'traite' ? 'Marquer non traité' : 'Marquer traité'} submitClass="btn btn-outline-dark btn-sm"><input type="hidden" name="id" value={m.id} /><input type="hidden" name="status" value={m.status === 'traite' ? 'nouveau' : 'traite'} /></ActionForm>
              </li>
            ))}</ul>
          )}
        </Panel>
        <Panel title="Journal des notifications (e-mails, SMS)">
          <p className="mb-4 text-[0.9375rem] text-mute">Chaque notification est journalisée avec son statut réel. « Simulé » signifie qu’aucun message n’est parti (mode démonstration ou service non configuré).</p>
          {outbox.length === 0 ? <Empty>Aucune notification.</Empty> : (
            <ul className="divide-y divide-graphite/10">{outbox.map((n) => (
              <li key={n.id} className="py-3">
                <p className="flex flex-wrap items-center gap-2"><span className={`badge ${STATUS[n.status]?.[1] ?? ''}`}>{STATUS[n.status]?.[0] ?? n.status}</span><span className="text-[0.875rem] uppercase text-mute">{n.channel} · {n.provider}</span><span className="ml-auto text-[0.875rem] text-mute">{dt.format(n.createdAt)}</span></p>
                <p className="mt-1 text-[0.9375rem]">À : {n.channel === 'email' ? maskEmail(n.recipient) : maskPhone(n.recipient)}{n.subject && <> — {n.subject}</>}</p>
                <details className="mt-1 text-[0.9375rem]"><summary className="cursor-pointer text-mute">Contenu</summary><pre className="mt-2 whitespace-pre-wrap font-sans text-[0.875rem]">{n.body}</pre></details>
                {n.error && <p className="text-[0.875rem] text-danger">{n.error}</p>}
              </li>
            ))}</ul>
          )}
        </Panel>
      </div>
    </>
  );
}
