import { eq } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { attachments } from '@/db/schema';
import { currentAdmin } from '@/modules/auth/session';
import { getStorage } from '@/modules/storage/storage';

/** Fichiers envoyés : accessibles à l'administration, ou publics s'ils illustrent une réalisation publiée. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = (await params).id;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response('Introuvable', { status: 404 });
  const db = await getDb();
  const f = (await db.select().from(attachments).where(eq(attachments.id, id)))[0];
  if (!f) return new Response('Introuvable', { status: 404 });
  if (!f.isPublic && !(await currentAdmin())) return new Response('Non autorisé', { status: 401 });
  const data = await getStorage().get(f.storageKey);
  if (!data) return new Response('Introuvable', { status: 404 });
  return new Response(Buffer.from(data), { headers: { 'Content-Type': f.mime, 'Cache-Control': f.isPublic ? 'public, max-age=86400' : 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'" } });
}
