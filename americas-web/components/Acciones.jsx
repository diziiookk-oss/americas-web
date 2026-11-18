'use client';
// Botones de la ficha del producto: cantidad, gramos, encargar, avisame, WhatsApp.
import { useState } from 'react';
import { Ic } from './Icono';
import { useTienda } from './Tienda';
import { plata, precioLinea, cantTxt, minTxt } from '@/lib/precios';

export default function Acciones({ p }) {
  const { carrito, sumar, fijarCant, abrirCarrito, abrirAvisame, ev, cfg, toast } = useTienda();
  const c = carrito[p.id]?.c || 0;
  const [sel, setSel] = useState(() => c || (p.escalones[0]?.min ?? 0.25));
  const [gr, setGr] = useState(''), [pesos, setPesos] = useState('');
  const wa = cfg.whatsapp ? 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent('¡Hola! Quería consultar por: ' + p.nombre) : '';
  const extra = <>
    {!p.hay && <><a className="linkito y" onClick={() => abrirAvisame(p)}><Ic n="bell" cl="s" /> Avisame cuando ingrese</a><br /></>}
    {wa && <a className="linkito g" href={wa} target="_blank" rel="noopener" onClick={() => ev('whatsapp', 'producto: ' + p.nombre)}><Ic n="wa" cl="s" /> Consultar por WhatsApp</a>}
  </>;
  if (p.unidad !== 'kg') return (<>
    <div className="qty"><div className="step"><button onClick={() => sumar(p, -1)} aria-label="Sacar uno">−</button><span>{c}</span><button onClick={() => sumar(p, 1)} aria-label="Agregar uno">+</button></div>
      <button className="btn r" style={{ flex: 1, padding: 15 }} onClick={() => (c ? abrirCarrito() : sumar(p, 1))}>{c ? 'Ver mi pedido' : p.hay ? 'Agregar al pedido' : 'Encargar'}</button></div>
    {extra}</>);
  const pr = precioLinea(p, sel || 0);
  const prox = (p.escalones || []).find((x) => (sel || 0) < x.min - 1e-9);
  const porPlata = (v) => { setPesos(v); let g = 0; const q = Number(v) || 0; for (let x = 10; x <= 20000; x += 10) { const t = precioLinea(p, x / 1000).total; if (t <= q) g = x; else if (t > q * 1.3) break; } setSel(g / 1000); setGr(String(g)); };
  return (<>
    <div className="pesos">{[0.1, 0.25, 0.5, 1].map((g) => { const r = precioLinea(p, g); return <div key={g} className={'peso' + (Math.abs(sel - g) < 1e-6 ? ' on' : '')} onClick={() => { setSel(g); setGr(''); setPesos(''); }}><b>{cantTxt(p, g)}</b><span>{plata(r.total)}</span>{r.tier && <em>−{r.tier.pct}%</em>}</div>; })}</div>
    <div style={{ display: 'flex', gap: 8 }}>
      <div style={{ flex: 1 }}><label className="campo">Otra cantidad (gramos)</label><input className="inp" type="number" inputMode="numeric" min="50" step="50" value={gr} placeholder={String(Math.round(sel * 1000))} onChange={(e) => { setGr(e.target.value); setPesos(''); setSel(Math.max(0, (Number(e.target.value) || 0) / 1000)); }} /></div>
      <div style={{ flex: 1 }}><label className="campo">o cuánto querés gastar ($)</label><input className="inp" type="number" inputMode="numeric" placeholder="Ej. 3000" value={pesos} onChange={(e) => porPlata(e.target.value)} /></div>
    </div>
    <div className="caja" style={{ marginTop: 10, justifyContent: 'space-between' }}><span>{sel > 0 ? <b>{cantTxt(p, sel)}</b> : '—'}{pr.tier && <> · <b style={{ color: 'var(--ok)' }}>−{pr.tier.pct}% online</b></>}</span><b style={{ font: '900 22px/1 var(--hf)' }}>{plata(pr.total)}</b></div>
    {prox && sel > 0 && <div className="aviso ok" style={{ marginTop: 0, marginBottom: 10 }}>💡 Llevando {minTxt(p, prox)} pagás {plata(precioLinea(p, prox.min).total)} (−{prox.pct}%).</div>}
    <button className="btn r blk" onClick={() => { const v = Math.round((sel || 0) * 1000) / 1000; if (!(v >= 0.05)) return toast('Elegí al menos 50 g.', true); fijarCant(p, v, (p.hay ? 'Agregado: ' : 'Encargo: ') + cantTxt(p, v) + ' de ' + p.nombre); }}>{c ? 'Actualizar mi pedido' : p.hay ? 'Agregar al pedido' : 'Encargar'}</button>
    {c > 0 && <a className="linkito" onClick={() => fijarCant(p, 0)}><Ic n="trash" cl="s" /> Sacar del pedido ({cantTxt(p, c)})</a>}
    <br />{extra}
  </>);
}
