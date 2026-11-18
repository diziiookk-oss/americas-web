import { getProductos, getConfig } from '@/lib/datos';
import { esOferta, pagoMax } from '@/lib/precios';
import Listado from '@/components/Listado';

export const metadata = { title: 'Ofertas', description: 'Ofertas de la semana y descuentos por cantidad comprando online en Américas Drugstore, Paraná.', alternates: { canonical: '/ofertas' } };

export default async function Ofertas({ searchParams }) {
  const { orden, pagina } = await searchParams;
  const [L, c] = await Promise.all([getProductos(), getConfig()]);
  const mp = pagoMax(c.descPagoMap), F = L.filter(esOferta);
  return <Listado titulo="Ofertas 🔥" sub={F.length + ' productos con descuento' + (mp.pct ? ' · y además ' + mp.pct + '% OFF en ' + mp.txt : '')} L={F} base="/ofertas" orden={orden || 'desc'} pagina={pagina}
    vacio={<div className="vacio">Esta semana no hay ofertas cargadas. ¡Volvé pronto!</div>} />;
}
