import Link from 'next/link';
import { getConfig, getProductos, getCategorias, getPremiosPublicos, paraCliente } from '@/lib/datos';
import { pagoMax, plata, esOferta, descDe } from '@/lib/precios';
import Portada, { RuletaCTA } from '@/components/Portada';
import Tarjeta from '@/components/Tarjeta';
import { Ic, iconoCat } from '@/components/Icono';

export default async function Inicio() {
  const [c, L, cats, premios] = await Promise.all([getConfig(), getProductos(), getCategorias(), getPremiosPublicos()]);
  const mp = pagoMax(c.descPagoMap);
  const titulo = String(c.destacado || 'Todo lo que buscás, a un mensaje.').trim().replace(/\.$/, '').split(' ');
  const ult = titulo.pop();
  const chips = []; if (mp.pct) chips.push(mp.pct + '% OFF ' + mp.txt); if (c.serviciosLista[0]) chips.push(c.serviciosLista[0]); if (c.envio) chips.push('Envíos' + (c.zona ? ' en ' + c.zona : '')); chips.push('Retiro en el local');
  const slides = [{ kicker: 'Tu drugstore en ' + (c.ciudad || 'Paraná'), titulo: titulo.join(' '), em: ult, despues: '.', texto: c.bajada, chips,
    botones: [{ t: 'Ver ofertas', href: '/ofertas' }, { t: 'Mi pedido', href: '/mis-pedidos', o: true }] }];
  if (mp.pct) slides.push({ kicker: 'Pagá menos', titulo: '', em: mp.pct + '% OFF', despues: ' en ' + mp.txt, texto: 'El descuento se aplica solo cuando elegís la forma de pago al confirmar el pedido. Se suma a las ofertas.', chips: [mp.pct + '% OFF', 'Se suma a ofertas'], botones: [{ t: 'Empezar a comprar', href: '/productos' }] });
  if (c.ruleta && premios.length > 1) slides.push({ kicker: 'Premios todas las semanas', titulo: 'Girá la ruleta y', em: 'ganá', despues: '.', texto: 'Descuentos, envío gratis y sorpresas para tu compra online. Un giro por semana.', chips: premios.filter((x) => !['Sin premio', 'Otra vez'].includes(x.tipo)).map((x) => x.texto), botones: [{ t: 'Girar ahora', accion: 'ruleta' }] });
  if (c.serviciosLista.length) {
    const s1 = c.serviciosLista.slice(0, 2).map((s) => s.replace(/\s*\(.*\)/, ''));
    slides.push({ kicker: 'Servicios en el local', titulo: s1[0] + (s1[1] ? ' y' : ''), em: s1[1] || '', despues: s1[1] ? '.' : '', texto: c.serviciosLista.join(' · ') + (c.direccion ? ' en ' + c.direccion.split(',')[0] + '.' : '.'), chips: c.serviciosLista,
      botones: [...(c.whatsappWA ? [{ t: 'Consultar', href: 'https://wa.me/' + c.whatsappWA + '?text=' + encodeURIComponent('¡Hola! Quería consultar por ' + s1[0]) }] : []), { t: 'Cómo llegar', href: '/nosotros', o: true }] });
  }
  const B = [];
  if (mp.pct) B.push(['cash', mp.pct + '% OFF', 'en ' + mp.txt]);
  if (c.envio) B.push(['moto', c.envioGratisDesde > 0 ? 'Envío gratis' : 'Envíos', c.envioGratisDesde > 0 ? 'desde ' + plata(c.envioGratisDesde) : 'en ' + (c.zona || 'la zona')]);
  B.push(['shop', 'Retiro en el local', c.direccion ? c.direccion.split(',')[0] : 'sin cargo']);
  if (c.horario) B.push(['clock', 'Abierto', c.horario]);
  const nOf = L.filter(esOferta).length;
  let top = L.filter((p) => p.hay && (p.pop > 0 || p.destacado)).sort((a, b) => (b.destacado - a.destacado) || b.pop - a.pop).slice(0, 14);
  if (top.length < 6) top = top.concat(L.filter((p) => p.hay && p.img && !top.includes(p)).slice(0, 10 - top.length));
  const of = L.filter((p) => esOferta(p) && p.hay).sort((a, b) => descDe(b) - descDe(a)).slice(0, 14);
  return (<>
    <Portada slides={slides} />
    <div className="benef">{B.map((b, i) => <div className="bf" key={i}><div className="ic"><Ic n={b[0]} /></div><div><b>{b[1]}</b><span>{b[2]}</span></div></div>)}</div>
    {of.length > 0 && <><div className="sec"><h3>Ofertas 🔥<small>Precios especiales comprando online</small></h3><Link href="/ofertas">Ver todas <Ic n="arrow" cl="s" /></Link></div>
      <div className="fila">{of.map((p) => <Tarjeta key={p.id} p={paraCliente(p)} />)}</div></>}
    <div className="sec"><h2 className="h1pag">Categorías<small style={{ display: 'block', font: '600 12.5px/1.3 Inter', color: 'var(--mute)', textTransform: 'none', letterSpacing: 0, marginTop: 4 }}>Elegí y encontrá todo más rápido</small></h2><Link href="/productos">Ver todo <Ic n="arrow" cl="s" /></Link></div>
    <div className="cats">
      <Link className="cat hot" href="/ofertas"><div className="ic"><Ic n="star" /></div><b>Ofertas</b><span>{nOf ? nOf + ' productos' : 'Ver todas'}</span></Link>
      {cats.map((k) => <Link key={k.slug} className="cat" href={'/categoria/' + k.slug}><div className="ic"><Ic n={iconoCat(k.nombre)} /></div><b>{k.nombre}</b><span>{k.n} productos</span></Link>)}
    </div>
    {top.length > 0 && <><div className="sec"><h3>Los más elegidos ⭐<small>Lo que más se lleva la gente del barrio</small></h3><Link href="/productos">Ver más <Ic n="arrow" cl="s" /></Link></div>
      <div className="fila">{top.map((p) => <Tarjeta key={p.id} p={paraCliente(p)} />)}</div></>}
    <RuletaCTA />
    <div className="sec" />
    <Link className="caja" href="/vendedor" style={{ padding: 16, borderColor: 'rgba(215,25,32,.35)' }}>
      <div className="ic" style={{ width: 48, height: 48 }}><Ic n="cash" cl="l" /></div>
      <div style={{ flex: 1 }}><b style={{ font: '700 18px/1.1 var(--hf)', textTransform: 'uppercase' }}>Vendé con nosotros y ganá plata</b><br /><span className="muted">Compartí tu link y llevate una parte de cada venta. Cobrás cada semana.</span></div>
      <span className="btn r" style={{ padding: '12px 16px' }}>Sumarme</span>
    </Link>
  </>);
}
