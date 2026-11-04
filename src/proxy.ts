import { NextResponse, type NextRequest } from 'next/server';

/**
 * - Politique de sécurité du contenu (CSP) avec nonce par requête.
 * - Redirection rapide des pages d'administration sans cookie de session
 *   (la vérification réelle de la session est faite côté serveur dans chaque page et action).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProd = process.env.NODE_ENV === 'production';
  const cookieName = isProd ? '__Host-vf_admin' : 'vf_admin';

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/connexion') && !request.cookies.get(cookieName)) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/connexion';
    url.search = '';
    return NextResponse.redirect(url);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const analytics = process.env.ANALYTICS_PROVIDER === 'plausible' ? new URL(process.env.ANALYTICS_SRC || 'https://plausible.io/js/script.js').origin : '';
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProd ? '' : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self'${analytics ? ' ' + analytics : ''}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    { source: '/((?!api|_next/static|_next/image|media|fonts|favicon.ico|robots.txt|sitemap.xml).*)', missing: [{ type: 'header', key: 'next-router-prefetch' }, { type: 'header', key: 'purpose', value: 'prefetch' }] },
  ],
};
