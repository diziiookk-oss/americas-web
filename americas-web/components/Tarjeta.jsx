'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Ic, iconoCat, iniciales } from './Icono';
import { useTienda } from './Tienda';
import { plata, precioUnit, pctOferta, maxEscalon, pagoMax } from '@/lib/precios';

export function Foto({ p, cls = 'ph', children }) {
  const [mal, setMal] = useState(false);
  if (!p.img || mal) return <div className={cls + ' nofoto'}><div className="ini"><Ic n={iconoCat(p.categoria + ' ' + p.nombre)} /><b>{p.categoria}</b></div>{children}</div>;
  return <div className={cls}><img src={p.img} alt={p.nombre} loading="lazy" referrerPolicy="no-referrer" onError={() => setMal(true)} />{children}</div>;
}

export default function Tarjeta({ p }) {
  const { carrito, sumar, cfg } = useTienda();
  const c = carrito[p.id]?.c || 0, pct = pctOferta(p), md = maxEscalon(p), mp = pagoMax(cfg.descPagoMap);
  const url = '/producto/' + p.slug;
  let boton;
  if (p.unidad === 'kg') boton = <Link className={'add' + (c ? ' sel' : p.hay ? '' : ' enc')} href={url}><Ic n={c ? 'check' : 'plus'} cl="s" />{c ? (c >= 1 ? String(c).replace('.', ',') + ' kg' : Math.round(c * 1000) + ' g') : p.hay ? 'Elegir peso' : 'Encargar'}</Link>;
  else if (c) boton = <div className="step"><button onClick={() => sumar(p, -1)} aria-label="Sacar uno">−</button><span>{c}</span><button onClick={() => sumar(p, 1)} aria-label="Agregar uno">+</button></div>;
  else boton = <button className={'add' + (p.hay ? '' : ' enc')} onClick={() => sumar(p, 1)}><Ic n="plus" cl="s" />{p.hay ? 'Agregar' : 'Encargar'}</button>;
  return (
    <article className="prod">
      <Link href={url} aria-label={p.nombre}><Foto p={p}>
        {pct > 0 ? <span className="bdg">★ −{pct}% OFF</span> : md > 0 ? <span className="bdg">hasta −{md}%</span> : null}
        {p.unidad === 'kg' && <span className="bdg2">x kg</span>}{!p.hay && <span className="bdg3">⏳ A pedido</span>}
      </Foto></Link>
      <div className="bd">
        <Link className="n" href={url}><h3 style={{ font: 'inherit', margin: 0 }}>{p.nombre}</h3></Link>
        <div className="pr"><b>{plata(precioUnit(p))}</b>{p.unidad === 'kg' && <small>/kg</small>}{pct > 0 && <s>{plata(p.precio)}</s>}</div>
        {mp.pct > 0 && <div className="ef"><b>{plata(precioUnit(p) * (1 - mp.pct / 100))}</b> en {mp.txt.split(' o ')[0]}{mp.txt.includes(' o ') ? ' o transf.' : ''}</div>}
        {boton}
      </div>
    </article>
  );
}
