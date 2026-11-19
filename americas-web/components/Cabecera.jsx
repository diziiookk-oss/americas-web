'use client';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, Suspense } from 'react';
import { Ic, Logo } from './Icono';
import { useTienda } from './Tienda';

function Buscador({ mob }) {
  const router = useRouter(), sp = useSearchParams(), pathname = usePathname();
  const [q, setQ] = useState(pathname === '/productos' ? sp.get('q') || '' : '');
  const t = useRef(null);
  useEffect(() => { if (pathname !== '/productos') setQ(''); }, [pathname]);
  const ir = (v, ya) => {
    clearTimeout(t.current);
    t.current = setTimeout(() => {
      const s = v.trim();
      if (!s && pathname !== '/productos') return;
      router.replace('/productos' + (s ? '?q=' + encodeURIComponent(s) : ''), { scroll: false });
    }, ya ? 0 : 350);
  };
  return (
    <form className={'busca' + (mob ? ' mob' : '')} role="search" onSubmit={(e) => { e.preventDefault(); ir(q, true); e.target.querySelector('input').blur(); }}>
      <input type="search" placeholder="¿Qué estás buscando?" aria-label="Buscar productos" value={q} onChange={(e) => { setQ(e.target.value); ir(e.target.value); }} />
      <button type="submit" aria-label="Buscar"><Ic n="search" cl="s" /></button>
    </form>
  );
}

const TABS = [['/', 'home', 'Inicio'], ['/productos', 'grid', 'Productos'], ['/ofertas', 'star', 'Ofertas'], ['/mis-pedidos', 'receipt', 'Pedidos'], ['/nosotros', 'shop', 'Nosotros']];

export default function Cabecera({ direccion }) {
  const { carrito, abrirCarrito, cfg, ev } = useTienda();
  const pathname = usePathname();
  const n = Object.keys(carrito).length;
  const activo = (h) => h === '/' ? pathname === '/' : pathname.startsWith(h) || (h === '/productos' && (pathname.startsWith('/categoria') || pathname.startsWith('/producto/')));
  const [d1, ...d2] = String(direccion || '').split(',');
  if (pathname.startsWith('/admin')) return null;
  // Fija arriba queda solo la barra del logo y el carrito (en el celu ocupa poco);
  // el buscador del celu y las pestañas se van con el scroll.
  return (
    <>
      <header className="tema-oscuro">
        <div className="wrap">
          <div className="hbar">
            <Link className="logo" href="/" aria-label="Inicio"><Logo /></Link>
            <Suspense fallback={<div className="busca" />}><Buscador /></Suspense>
            <div className="hbtns">
              {direccion && <div className="dir"><Ic n="pin" cl="s" /><div><b>{d1}</b>{d2.join(',').trim()}</div></div>}
              <Link className="rb lupa" href="/productos" aria-label="Buscar"><Ic n="search" /></Link>
              {cfg.whatsapp && <a className="rb" href={'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent('¡Hola! Tengo una consulta 😊')} target="_blank" rel="noopener" aria-label="WhatsApp" onClick={() => ev('whatsapp', 'header')}><Ic n="wa" /></a>}
              <button className="rb" id="cartBtn" onClick={abrirCarrito} aria-label="Mi pedido"><Ic n="bag" /><b>{n || ''}</b></button>
            </div>
          </div>
        </div>
      </header>
      <div className="subhead wrap">
        <Suspense fallback={null}><Buscador mob /></Suspense>
        <div className="tabsw"><nav className="tabs" aria-label="Secciones">{TABS.map(([h, i, t]) => <Link key={h} href={h} className={'tab' + (h === '/ofertas' ? ' of' : '') + (activo(h) ? ' on' : '')}><Ic n={i} />{t}</Link>)}</nav></div>
      </div>
    </>
  );
}
