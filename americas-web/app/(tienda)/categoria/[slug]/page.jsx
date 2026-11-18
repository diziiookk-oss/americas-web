import { notFound } from 'next/navigation';
import { getProductos, getCategorias, getConfig } from '@/lib/datos';
import Listado from '@/components/Listado';

async function cat(slug) { return (await getCategorias()).find((k) => k.slug === slug); }

export async function generateMetadata({ params }) {
  const { slug } = await params; const k = await cat(slug); const c = await getConfig();
  if (!k) return { title: 'Categoría' };
  return { title: k.nombre + ' en ' + (c.ciudad || 'Paraná'), description: `${k.nombre}: ${k.n} productos en ${c.negocio}, ${c.ciudad || 'Paraná'}. Pedí online y retirá en el local o recibilo en tu casa.`, alternates: { canonical: '/categoria/' + slug } };
}

export default async function Categoria({ params, searchParams }) {
  const { slug } = await params; const { orden, pagina } = await searchParams;
  const k = await cat(slug); if (!k) notFound();
  const [L, cats] = await Promise.all([getProductos(), getCategorias()]);
  return <Listado titulo={k.nombre} sub={k.n + ' productos'} L={L.filter((p) => p.categoria === k.nombre)} cats={cats} catActual={slug} base={'/categoria/' + slug} orden={orden} pagina={pagina} />;
}
