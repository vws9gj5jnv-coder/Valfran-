import { NextResponse } from 'next/server';

/** Protection CSRF pour les routes POST : l'origine doit correspondre à l'hôte. */
export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return req.headers.get('sec-fetch-site') !== 'cross-site';
  try {
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

export const forbidden = () => json({ error: 'forbidden', message: 'Requête refusée.' }, 403);

export async function readJson(req: Request, maxBytes = 64_000): Promise<unknown> {
  const text = await req.text();
  if (text.length > maxBytes) throw new Error('too_large');
  return JSON.parse(text);
}
