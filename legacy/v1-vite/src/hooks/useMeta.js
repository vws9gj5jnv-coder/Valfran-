import { useEffect } from 'react';

/**
 * Met à jour <title> et meta description (SEO).
 * Pendant le pré-rendu (pas de `document`), les valeurs sont déposées dans
 * globalThis.__SEO__ pour que scripts/prerender.mjs les injecte dans le HTML.
 */
export function useMeta(title, description) {
  if (typeof document === 'undefined') globalThis.__SEO__ = { title, description };
  useEffect(() => {
    document.title = title;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) {
        m = document.createElement('meta');
        m.name = 'description';
        document.head.appendChild(m);
      }
      m.content = description;
    }
  }, [title, description]);
}
