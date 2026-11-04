/**
 * Décide si l'appareil peut afficher une scène 3D sans dégrader l'expérience.
 * Prudence par défaut : en cas de doute, on garde l'image statique.
 */
export type Quality = 'high' | 'medium' | 'none';

export function detect3DQuality(): Quality {
  if (typeof window === 'undefined') return 'none';
  try {
    const url = new URL(window.location.href);
    const force = url.searchParams.get('3d');
    if (force === 'off') return 'none';
    if (force === 'on') return 'high';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'none';
    const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };
    if (nav.connection?.saveData) return 'none';
    if (nav.connection?.effectiveType && /(^|-)2g|3g/.test(nav.connection.effectiveType)) return 'none';
    if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return 'none';
    if ((nav.hardwareConcurrency ?? 4) < 4) return 'none';
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return 'none';
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    if (/swiftshader|llvmpipe|software/i.test(renderer)) return 'none';
    const small = Math.min(window.screen.width, window.screen.height) < 600;
    return small || (nav.hardwareConcurrency ?? 4) < 8 ? 'medium' : 'high';
  } catch {
    return 'none';
  }
}

export function whenIdle(cb: () => void, timeout = 1500) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(cb, { timeout });
  else setTimeout(cb, 300);
}
