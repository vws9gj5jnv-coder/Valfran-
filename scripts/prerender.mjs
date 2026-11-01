// Pré-rendu statique : génère un HTML complet par route à partir du build client + du bundle SSR.
// URL publique : SITE_URL=https://mon-domaine.fr npm run build
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SITE = (process.env.SITE_URL || 'https://www.valfran-mecanique.fr').replace(/\/$/, '');
const dist = 'dist';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const template = await readFile(join(dist, 'index.html'), 'utf8');
const { render, routes } = await import(pathToFileURL(join(process.cwd(), 'dist-server', 'entry-server.js')).href);

const setTag = (html, re, tag) => (re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`));

for (const route of routes) {
  const { html, seo } = render(route);
  const is404 = route === '/404';
  const url = SITE + (route === '/' ? '/' : route);
  let out = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
  if (seo?.title) {
    out = out.replace(/<title>.*?<\/title>/s, `<title>${esc(seo.title)}</title>`);
    out = setTag(out, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(seo.title)}" />`);
  }
  if (seo?.description) {
    out = setTag(out, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(seo.description)}" />`);
    out = setTag(out, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(seo.description)}" />`);
  }
  if (is404) out = out.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>');
  else {
    out = out.replace('</head>', `    <link rel="canonical" href="${url}" />\n    <meta property="og:url" content="${url}" />\n  </head>`);
  }
  const file = is404 ? join(dist, '404.html') : route === '/' ? join(dist, 'index.html') : join(dist, route, 'index.html');
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, out);
  console.log('prerendered', route);
}

const urls = routes.filter((r) => r !== '/404');
await writeFile(join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((r) => `  <url><loc>${SITE}${r === '/' ? '/' : r}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
await rm('dist-server', { recursive: true, force: true });
