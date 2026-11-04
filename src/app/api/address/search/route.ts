import { geocode } from '@/modules/zones/geocoder';
import { listCommunes } from '@/modules/settings/repo';
import { rateLimit, clientIp, fingerprint } from '@/modules/security/rate-limit';
import { json } from '@/lib/http';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.slice(0, 120) ?? '';
  if (q.trim().length < 2) return json({ results: [] });
  const rl = await rateLimit(`addr:${fingerprint(clientIp(req.headers))}`, 120, 600);
  if (!rl.ok) return json({ results: [], error: 'rate_limited' }, 429);
  const communes = await listCommunes();
  const { results, provider } = await geocode(q, communes.filter((c) => c.status !== 'excluded'));
  return json({ results, provider });
}
