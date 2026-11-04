import { createBooking } from '@/modules/bookings/create';
import { rateLimit, clientIp, fingerprint } from '@/modules/security/rate-limit';
import { json, forbidden, sameOrigin, readJson } from '@/lib/http';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const rl = await rateLimit(`booking:${fingerprint(clientIp(req.headers))}`, Number(process.env.BOOKINGS_PER_HOUR ?? 8), 3600);
  if (!rl.ok) return json({ ok: false, error: 'rate_limited', message: 'Trop de demandes envoyées depuis cette connexion. Merci de nous appeler ou de réessayer plus tard.' }, 429);
  let body: unknown;
  try { body = await readJson(req, 32_000); } catch { return json({ ok: false, error: 'invalid', message: 'Requête invalide.' }, 400); }
  try {
    const r = await createBooking(body);
    return json(r, r.ok ? 201 : r.error === 'validation' ? 422 : 409);
  } catch (e) {
    console.error('[bookings] erreur', (e as Error).message);
    return json({ ok: false, error: 'server', message: 'Un problème technique empêche l’enregistrement. Vos informations sont conservées : réessayez dans un instant ou appelez-nous.' }, 500);
  }
}
