import { quotePdfResponse } from '@/modules/quotes/load';

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return new Response('Introuvable', { status: 404 });
  return quotePdfResponse({ token });
}
