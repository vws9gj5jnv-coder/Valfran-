/** Données structurées. Le contenu est sérialisé et échappé (pas d'injection possible via « </script> »). */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
