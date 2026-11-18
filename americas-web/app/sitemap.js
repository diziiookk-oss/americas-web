import { getProductos, getCategorias } from '@/lib/datos';
export const dynamic = 'force-dynamic';
export default async function sitemap() {
  const base = (process.env.SITE_URL || process.env.URL || '').replace(/\/$/, '');
  if (!base) return [];
  const [L, cats] = await Promise.all([getProductos(), getCategorias()]);
  const hoy = new Date();
  return [
    { url: base + '/', lastModified: hoy, changeFrequency: 'daily', priority: 1 },
    { url: base + '/productos', lastModified: hoy, changeFrequency: 'daily', priority: 0.9 },
    { url: base + '/ofertas', lastModified: hoy, changeFrequency: 'daily', priority: 0.9 },
    { url: base + '/nosotros', lastModified: hoy, changeFrequency: 'monthly', priority: 0.7 },
    ...cats.map((k) => ({ url: base + '/categoria/' + k.slug, lastModified: hoy, changeFrequency: 'daily', priority: 0.8 })),
    ...L.map((p) => ({ url: base + '/producto/' + p.slug, lastModified: hoy, changeFrequency: 'weekly', priority: 0.6 }))
  ];
}
