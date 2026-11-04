import { z } from 'zod';
import { checkAddress } from '@/modules/zones/check';
import { json, forbidden, sameOrigin, readJson } from '@/lib/http';

const schema = z.object({ street: z.string().max(200), postcode: z.string().regex(/^\d{5}$/), city: z.string().min(1).max(80) });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return forbidden();
  const parsed = schema.safeParse(await readJson(req, 2000).catch(() => null));
  if (!parsed.success) return json({ error: 'invalid', message: 'Code postal à 5 chiffres et commune nécessaires.' }, 400);
  const r = await checkAddress(parsed.data);
  return json({ status: r.status, distanceKm: r.distanceKm, feeCents: r.feeCents, message: r.message });
}
