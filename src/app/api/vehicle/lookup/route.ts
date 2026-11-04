import { lookupPlate } from '@/modules/plates/lookup';
import { clientIp } from '@/modules/security/rate-limit';
import { json, forbidden, sameOrigin, readJson } from '@/lib/http';

export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  let plate = '';
  try {
    const body = (await readJson(req, 2000)) as { plate?: unknown };
    plate = typeof body.plate === 'string' ? body.plate.slice(0, 20) : '';
  } catch {
    return json({ status: 'invalid', reason: 'Requête invalide.' }, 400);
  }
  const result = await lookupPlate(plate, clientIp(req.headers));
  return json(result, result.status === 'rate_limited' ? 429 : 200);
}
