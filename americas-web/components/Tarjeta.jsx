'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Ic, iconoCat, iniciales } from './Icono';
import { useTienda } from './Tienda';
import { plata, precioUnit, pctOferta, maxEscalon, pagoMax } from '@/lib/precios';

export function Foto({ p, cls = 'ph', children }) {
  const [mal, setMal] = useState(false);
  if (!p.img || mal) return <div className={cls + ' nofoto'}><div className="ini"><Ic n={iconoCat(p.categoria + ' ' + p.nombre)} /><b>{p.categoria}</b></div>{children}</div>;
  // Fondo: la misma foto desenfocada (empareja fotos sacadas en distintos lugares). Adelante: la foto entera, centrada y con sombra.
  return <div className={cls + ' confoto'}><i className="fondo" style={{ backgroundImage: `url("${p.img}")` }} aria-hidden="true" /><img src={p.img} alt={p.nombre} loading="lazy" referrerPolicy="no-referrer" onError={() => setMal(true)} />{children}</div>;
}

export default function Tarjeta({ p }) {
  const { carrito, sumar, cfg } = useTienda();
  const c = carrito[p.id]?.c || 0, pct = pctOferta(p), md = maxEscalon(p), mp = pagoMax(cfg.descPagoMap);
  const url = '/producto/' + p.slug;
  // El ahorro se muestra en pesos, no en %: "Ahorrás $ 750" se entiende sin hacer cuentas.
  const ahorro = pct > 0 ? Math.round(p.precio - precioUnit(p)) : 0;
  const pocas = p.hay && p.unidad === 'un' && p.max !== null && p.max > 0 && p.max <= 5;
  let boton;
  if (p.unidad === 'kg') boton = <Link className={'add' + (c ? ' sel' : p.hay ? '' : ' enc')} href={url}><Ic n={c ? 'check' : 'plus'} cl="s" />{c ? (c >= 1 ? String(c).replace('.', ',') + ' kg' : Math.round(c * 1000) + ' g') : p.hay ? 'Elegir peso' : 'Encargar'}</Link>;
  else if (c) boton = <div className="step"><button onClick={() => sumar(p, -1)} aria-label="Sacar uno">−</button><span>{c}</span><button onClick={() => sumar(p, 1)} aria-label="Agregar uno">+</button></div>;
  else boton = <button className={'add' + (p.hay ? '' : ' enc')} onClick={() => sumar(p, 1)}><Ic n="plus" cl="s" />{p.hay ? 'Agregar' : 'Encargar'}</button>;
  return (
    <article className="prod">
      <Link href={url} aria-label={p.nombre}><Foto p={p}>
        {ahorro > 0 ? <span className="bdg">Ahorrás {plata(ahorro)}{p.unidad === 'kg' ? '/kg' : ''}</span> : md > 0 ? <span className="bdg">Hasta −{md}% llevando más</span> : null}
        {p.etiqueta && <span className={'etq' + (ahorro > 0 || md > 0 ? ' baja' : '')}>{p.etiqueta}</span>}
        {p.unidad === 'kg' && <span className="bdg2">x kg</span>}{!p.hay && <span className="bdg3">⏳ A pedido</span>}
      </Foto></Link>
      <div className="bd">
        <Link className="n" href={url}><h3 style={{ font: 'inherit', margin: 0 }}>{p.nombre}</h3></Link>
        {pocas && <div className="pocas">🔥 {p.max === 1 ? '¡Queda la última!' : '¡Últimas ' + p.max + ' unidades!'}</div>}
        <div className="pr"><b>{plata(precioUnit(p))}</b>{p.unidad === 'kg' && <small>/kg</small>}{pct > 0 && <s>{plata(p.precio)}</s>}</div>
        {mp.pct > 0 && <div className="ef"><b>{plata(precioUnit(p) * (1 - mp.pct / 100))}</b> en {mp.txt.split(' o ')[0]}{mp.txt.includes(' o ') ? ' o transf.' : ''}</div>}
        {boton}
      </div>
    </article>
  );
}
