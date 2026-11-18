import { getProductos, getCategorias, getConfig } from '@/lib/datos';
import { norm } from '@/lib/precios';
import Listado from '@/components/Listado';
import Registrar from '@/components/Registrar';

export async function generateMetadata({ searchParams }) {
  const { q } = await searchParams;
  return q ? { title: 'Buscar “' + q + '”', robots: { index: false } } : { title: 'Todos los productos', description: 'Kiosco, bebidas, dietética, despensa y más en Américas Drugstore, Paraná. Pedí online.', alternates: { canonical: '/productos' } };
}

export default async function Productos({ searchParams }) {
  const { q = '', orden, pagina } = await searchParams;
  const [L, cats, c] = await Promise.all([getProductos(), getCategorias(), getConfig()]);
  const palabras = norm(q).split(/\s+/).filter(Boolean);
  const F = palabras.length ? L.filter((p) => { const t = norm(p.nombre + ' ' + p.marca + ' ' + p.categoria); return palabras.every((w) => t.includes(w)); }) : L;
  const vacio = <div className="vacio">No encontramos productos{q ? ' con “' + q + '”' : ''}.<br /><br />{c.whatsappWA && <a className="btn w" href={'https://wa.me/' + c.whatsappWA + '?text=' + encodeURIComponent('¡Hola! ¿Tienen ' + (q || 'este producto') + '?')} target="_blank" rel="noopener">Preguntar por WhatsApp</a>}</div>;
  return (<>
    {q && <Registrar tipo="buscar" detalle={q.trim().slice(0, 60)} />}
    <Listado titulo={q ? 'Resultados para “' + q + '”' : 'Todos los productos'} sub={q ? '' : 'Kiosco, bebidas, dietética, despensa y más'} L={F} cats={cats} base="/productos" orden={orden} pagina={pagina} q={q} vacio={vacio} />
  </>);
}
