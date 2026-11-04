import { getDb } from '@/db/client';
import { notifications } from '@/db/schema';
import { newId } from '@/lib/ids';
import { getEmailAdapter, getSmsAdapter, type SendResult } from './adapters';

/**
 * Envoie (ou simule) une notification et l'enregistre dans le journal d'envoi.
 * Une notification simulée est explicitement marquée « simulée » : elle n'est jamais présentée comme envoyée.
 * Ne lève jamais d'exception : l'échec d'un envoi ne doit pas faire échouer l'enregistrement d'une demande.
 */
export async function notify(n: { channel: 'email' | 'sms'; to: string; subject?: string; body: string; bookingId?: string; quoteId?: string; replyTo?: string }): Promise<SendResult> {
  let result: SendResult;
  let provider = 'none';
  try {
    if (n.channel === 'email') {
      const a = getEmailAdapter();
      provider = a.name;
      result = await a.send({ to: n.to, subject: n.subject ?? '', text: n.body, replyTo: n.replyTo });
    } else {
      const a = getSmsAdapter();
      provider = a.name;
      result = await a.send({ to: n.to, text: n.body });
    }
  } catch (e) {
    result = { status: 'failed', error: (e as Error).message };
  }
  try {
    const db = await getDb();
    await db.insert(notifications).values({
      id: newId(), channel: n.channel, recipient: n.to, subject: n.subject ?? '', body: n.body,
      status: result.status, provider, error: result.error ?? '', bookingId: n.bookingId, quoteId: n.quoteId,
    });
  } catch (e) {
    console.error('[notify] journalisation impossible', (e as Error).message);
  }
  if (result.status === 'failed') console.warn('[notify] échec', { channel: n.channel, provider, error: result.error });
  return result;
}
