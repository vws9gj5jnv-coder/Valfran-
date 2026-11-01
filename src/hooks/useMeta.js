import { useEffect } from 'react';

/** Met à jour <title> et meta description à chaque page (SEO). */
export function useMeta(title, description) {
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
