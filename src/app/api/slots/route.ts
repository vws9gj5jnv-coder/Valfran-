import { getAvailableWindows } from '@/modules/availability/service';
import { listServices } from '@/modules/settings/repo';
import { json } from '@/lib/http';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const slugs = (sp.get('services') ?? '').split(',').filter(Boolean).slice(0, 6);
  const services = await listServices();
  const selected = services.filter((s) => slugs.includes(s.slug));
  const diag = services.find((s) => s.isDiagnostic);
  const duration = Math.max(60, selected.reduce((a, s) => a + s.durationMinutes, 0) || (diag?.durationMinutes ?? 60));
  const windows = await getAvailableWindows(duration);
  return json({ windows, durationMinutes: duration });
}
