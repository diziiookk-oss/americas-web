// Lista de productos con filtros por categoría y orden (se arma en el servidor para que Google la lea).
import Link from 'next/link';
import Tarjeta from './Tarjeta';
import OrdenSelect from './OrdenSelect';
import { paraCliente } from '@/lib/datos';
import { precioUnit, descDe } from '@/lib/precios';

const POR_PAG = 60;
export function ordenar(L, orden) {
  const f = { menor: (a, b) => precioUnit(a) - precioUnit(b), mayor: (a, b) => precioUnit(b) - precioUnit(a), desc: (a, b) => descDe(b) - descDe(a), az: (a, b) => a.nombre.localeCompare(b.nombre, 'es') }[orden]
    || ((a, b) => (b.hay - a.hay) || (b.pop - a.pop) || (!!b.img - !!a.img) || a.nombre.localeCompare(b.nombre, 'es'));
  return [...L].sort(f);
}

export default function Listado({ titulo, sub, L, cats, catActual, base, orden, pagina, q, vacio }) {
  const pag = Math.max(1, Number(pagina) || 1), tot = Math.ceil(L.length / POR_PAG);
  const vista = ordenar(L, orden).slice((pag - 1) * POR_PAG, pag * POR_PAG);
  const qs = (o) => { const p = new URLSearchParams(); if (q) p.set('q', q); if (o.orden ?? orden) p.set('orden', o.orden ?? orden); if (o.pagina > 1) p.set('pagina', o.pagina); const s = p.toString(); return s ? '?' + s : ''; };
  return (<>
    <div className="sec" style={{ marginTop: 16 }}><h1 className="h1pag">{titulo}<small style={{ display: 'block', font: '600 12.5px/1.3 Inter', color: 'var(--mute)', textTransform: 'none', letterSpacing: 0, marginTop: 4 }}>{sub}</small></h1></div>
    {cats && <nav className="chips" aria-label="Categorías"><Link className={'chip' + (!catActual ? ' on' : '')} href="/productos">Todas</Link>{cats.map((k) => <Link key={k.slug} className={'chip' + (catActual === k.slug ? ' on' : '')} href={'/categoria/' + k.slug}>{k.nombre}</Link>)}</nav>}
    <div className="orden"><span>{L.length} productos</span><OrdenSelect valor={orden || 'pop'} /></div>
    {L.length ? <div className="grid">{vista.map((p) => <Tarjeta key={p.id} p={paraCliente(p)} />)}</div> : vacio}
    {tot > 1 && <nav className="pager">{pag > 1 && <Link className="btn o" href={base + qs({ pagina: pag - 1 })}>← Anterior</Link>}<span className="muted" style={{ alignSelf: 'center' }}>Página {pag} de {tot}</span>{pag < tot && <Link className="btn o" href={base + qs({ pagina: pag + 1 })}>Siguiente →</Link>}</nav>}
  </>);
}
