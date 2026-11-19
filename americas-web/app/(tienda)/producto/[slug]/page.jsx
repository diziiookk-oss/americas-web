import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProducto, getProductos, getConfig, paraCliente, catSlug } from '@/lib/datos';
import { plata, precioUnit, pctOferta, pagoMax, minTxt } from '@/lib/precios';
import { Ic } from '@/components/Icono';
import { Foto } from '@/components/Tarjeta';
import Tarjeta from '@/components/Tarjeta';
import Acciones from '@/components/Acciones';
import Registrar from '@/components/Registrar';

export async function generateMetadata({ params }) {
  const { slug } = await params; const p = await getProducto(slug); const c = await getConfig();
  if (!p) return { title: 'Producto no encontrado', robots: { index: false } };
  const precio = plata(precioUnit(p)) + (p.unidad === 'kg' ? ' el kg' : '');
  return { title: p.nombre + ' — ' + precio, description: `${p.nombre}${p.marca ? ' (' + p.marca + ')' : ''} a ${precio} en ${c.negocio}, ${c.ciudad || 'Paraná'}. ${p.hay ? 'Pedilo online y retiralo en el local o recibilo en tu casa.' : 'Encargalo online.'}`,
    alternates: { canonical: '/producto/' + slug }, openGraph: { title: p.nombre + ' · ' + precio, images: p.img ? [p.img] : ['/og.png'] } };
}

export default async function Producto({ params }) {
  const { slug } = await params;
  const [p, L, c] = await Promise.all([getProducto(slug), getProductos(), getConfig()]);
  if (!p) notFound();
  const pct = pctOferta(p), mp = pagoMax(c.descPagoMap);
  const rel = L.filter((x) => x.categoria === p.categoria && x.id !== p.id && x.hay).slice(0, 12);
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.nombre, brand: p.marca ? { '@type': 'Brand', name: p.marca } : undefined, category: p.categoria, image: p.img || undefined,
    description: p.descripcion || undefined, sku: p.id,
    offers: { '@type': 'Offer', priceCurrency: 'ARS', price: precioUnit(p), availability: p.hay ? 'https://schema.org/InStock' : 'https://schema.org/BackOrder', url: c.sitio ? c.sitio + '/producto/' + slug : undefined, seller: { '@type': 'Organization', name: c.negocio } } };
  return (<>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    <Registrar tipo="producto" detalle={p.nombre} />
    <div className="det">
      <Foto p={p} cls="foto">{pct > 0 && <span className="bdg" style={{ left: 14, top: 14, fontSize: 12, padding: '8px 12px' }}>Ahorrás {plata(p.precio - precioUnit(p))}{p.unidad === 'kg' ? '/kg' : ''}</span>}
        {p.etiqueta && <span className="etq" style={{ left: 14, top: pct > 0 ? 50 : 14, fontSize: 11 }}>{p.etiqueta}</span>}</Foto>
      <div>
        <nav className="migas" aria-label="Migas"><Link href="/">Inicio</Link>/<Link href={'/categoria/' + catSlug(p.categoria)}>{p.categoria}</Link>/<span style={{ color: 'var(--txt2)' }}>{p.nombre}</span></nav>
        <h1>{p.nombre}</h1>{p.marca && <div className="marca">{p.marca}</div>}
        <div className="precio"><b>{plata(precioUnit(p))}</b>{p.unidad === 'kg' && <small>el kg</small>}{pct > 0 && <s>{plata(p.precio)}</s>}</div>
        {pct > 0 && <div className="ahorro">🔥 Comprando online <b>te ahorrás {plata(p.precio - precioUnit(p))}</b>{p.unidad === 'kg' ? ' por kg' : ''}</div>}
        {mp.pct > 0 && <div className="caja"><div className="ic"><Ic n="cash" cl="s" /></div><div><b>{plata(precioUnit(p) * (1 - mp.pct / 100))}{p.unidad === 'kg' ? '/kg' : ''}</b> pagando en {mp.txt} <b style={{ color: 'var(--red2)' }}>({mp.pct}% OFF)</b></div></div>}
        {p.escalones.length > 0 && <div className="caja ok"><div className="ic"><Ic n="star" cl="s" /></div><div><b>Descuento online por cantidad:</b> {p.escalones.map((x) => minTxt(p, x) + ' −' + x.pct + '%').join(' · ')}</div></div>}
        {p.descripcion && <p className="desc">{p.descripcion}</p>}
        {p.hay ? <span className={'estado ' + (p.max !== null && p.max <= 5 && p.unidad !== 'kg' ? 'no' : 'si')}><i />{p.max !== null && p.max <= 5 && p.unidad !== 'kg' ? (p.max === 1 ? '¡Queda la última!' : '¡Últimas ' + p.max + ' unidades!') : 'En stock · listo para llevar'}</span>
          : <><span className="estado no"><i />Sin stock por el momento</span><div className="muted" style={{ marginBottom: 8 }}>Podés encargarlo igual: lo sumás a tu pedido y coordinamos la entrega por WhatsApp cuando vuelva a ingresar.</div></>}
        <Acciones p={paraCliente(p)} />
        <div className="info2"><span><Ic n="shop" cl="s" />Retiro gratis{c.direccion ? ' en ' + c.direccion.split(',')[0] : ''}</span>{c.envio && <span><Ic n="moto" cl="s" />Envíos a domicilio{c.zona ? ' en ' + c.zona : ''}</span>}</div>
      </div>
    </div>
    {rel.length > 0 && <><div className="sec"><h3>También te puede interesar</h3><Link href={'/categoria/' + catSlug(p.categoria)}>Ver {p.categoria} <Ic n="arrow" cl="s" /></Link></div>
      <div className="fila">{rel.map((x) => <Tarjeta key={x.id} p={paraCliente(x)} />)}</div></>}
  </>);
}
