import { currentAdmin } from '@/modules/auth/session';
import { quotePdfResponse } from '@/modules/quotes/load';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentAdmin())) return new Response('Non autorisé', { status: 401 });
  return quotePdfResponse({ id: (await params).id });
}
