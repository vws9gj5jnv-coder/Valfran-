import { sql, eq } from 'drizzle-orm';
import { requireAdmin } from '@/modules/auth/session';
import { AdminNav } from '@/components/admin/AdminNav';
import { getDb } from '@/db/client';
import { bookings } from '@/db/schema';
import { env } from '@/lib/env';

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const db = await getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(bookings).where(eq(bookings.status, 'nouvelle'));
  return (
    <div className="lg:flex">
      <AdminNav newCount={n} user={user} demo={env.demoMode} />
      <div className="min-w-0 flex-1">
        {env.demoMode && <p className="bg-champagne px-5 py-1.5 text-center text-[0.875rem] font-medium text-graphite">Mode démonstration — les lignes marquées « Démo » sont fictives ; aucun e-mail ni SMS n’est réellement envoyé.</p>}
        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8 lg:py-10">{children}</div>
      </div>
    </div>
  );
}
