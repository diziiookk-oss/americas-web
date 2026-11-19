'use client';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { Ic } from './Icono';
import { api, leer, guardar, K, fechaCorta, useTienda } from './Tienda';
import { plata } from '@/lib/precios';

const PASOS = ['Nuevo', 'Preparando', 'Listo', 'Entregado'];
export default function MisPedidos() {
  const { toast } = useTienda();
  const [mis, setMis] = useState(null), [res, setRes] = useState(null), [nro, setNro] = useState(''), [tel, setTel] = useState('');
  useEffect(() => { setMis(leer(K.mis, []) || []); setTel((leer(K.yo, {}) || {}).tel || ''); }, []);
  const cargar = useCallback(async (lista) => { if (!lista?.length) return; const r = await api('seguimiento', { lista }); setRes(r); }, []);
  useEffect(() => { if (!mis) return; cargar(mis); const t = setInterval(() => document.visibilityState === 'visible' && cargar(mis), 30000); return () => clearInterval(t); }, [mis, cargar]);
  const agregar = () => {
    const n = nro.trim().toUpperCase().replace(/^P?-?(\d+)$/, (m, d) => 'P-' + d.padStart(4, '0'));
    if (!/^P-\d+$/.test(n) || tel.replace(/\D/g, '').length < 8) return toast('Escribí el número de pedido y tu WhatsApp.', true);
    const L = [{ nro: n, tel, t: Date.now() }, ...(mis || []).filter((m) => m.nro !== n)].slice(0, 12); guardar(K.mis, L); setMis(L); setNro('');
  };
  const quitar = (n) => { const L = mis.filter((m) => m.nro !== n); guardar(K.mis, L); setMis(L); };
  const enc = {}; (res?.pedidos || []).forEach((p) => { enc[p.nro] = p; });
  return (<>
    <div className="sec" style={{ marginTop: 16 }}><h1 className="h1pag">Mis pedidos<small style={{ display: 'block', font: '600 12.5px/1.3 var(--hf)', color: 'var(--mute)', textTransform: 'none', letterSpacing: 0, marginTop: 4 }}>Seguí el estado de tu pedido en tiempo real</small></h1></div>
    {mis === null ? <div className="sk" style={{ height: 150 }} /> : !mis.length ? <div className="pcard" style={{ textAlign: 'center' }}><div className="muted">Todavía no hiciste pedidos desde este celular.</div><Link className="btn r" style={{ marginTop: 14 }} href="/productos">Hacer mi primer pedido</Link></div>
      : !res ? <div className="sk" style={{ height: 150 }} /> : !res.ok ? <div className="aviso">No se pudo consultar ahora. Probá en un ratito.</div>
        : <>{mis.map((m) => {
          const p = enc[m.nro];
          if (!p) return <div className="pcard" key={m.nro}><b>{m.nro}</b> <span className="muted">· no lo encontramos con ese WhatsApp.</span> <a className="linkito" onClick={() => quitar(m.nro)}>Quitar</a></div>;
          const est = p.estado === 'En camino' ? 'Listo' : p.estado, k = PASOS.indexOf(est);
          const nom = { Nuevo: 'Recibido', Preparando: 'Preparando', Listo: p.entrega === 'Envío' ? (p.estado === 'En camino' ? 'En camino' : 'Listo') : 'Listo p/ retirar', Entregado: 'Entregado' };
          return (<div className="pcard" key={m.nro}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><div><b style={{ font: '800 18px/1 var(--hf)' }}>{p.nro}</b><div className="muted">{fechaCorta(p.fecha)} {new Date(p.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · {p.entrega === 'Envío' ? '🛵 Envío' : '🏪 Retiro'}</div></div><b style={{ font: '800 20px/1 var(--hf)' }}>{plata(p.total)}</b></div>
            {p.estado === 'Cancelado' ? <div className="aviso" style={{ marginTop: 12 }}>Este pedido fue cancelado. Escribinos por WhatsApp si tenés dudas.</div>
              : <div className="pasos">{PASOS.map((s, i) => <div key={s} className={'paso' + (i <= k ? ' ok' : '')}><i>{i <= k && <Ic n="check" cl="s" />}</i>{nom[s]}</div>)}</div>}
            <details style={{ marginTop: 8 }}><summary className="muted" style={{ cursor: 'pointer' }}>Ver detalle</summary><div style={{ whiteSpace: 'pre-line', fontSize: 13.5, color: 'var(--txt2)', marginTop: 8 }}>{p.detalle}</div></details>
          </div>);
        })}<div className="muted" style={{ textAlign: 'center', margin: '-2px 0 14px' }}>Se actualiza solo cada 30 segundos</div></>}
    <div className="pcard"><b style={{ font: '800 15px/1 var(--hf)' }}>¿Hiciste el pedido desde otro celular?</b>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><div style={{ flex: 1, minWidth: 130 }}><label className="campo">N° de pedido</label><input className="inp" placeholder="P-0012" value={nro} onChange={(e) => setNro(e.target.value)} /></div>
        <div style={{ flex: 1.4, minWidth: 160 }}><label className="campo">WhatsApp con el que pediste</label><input className="inp" type="tel" inputMode="tel" value={tel} onChange={(e) => setTel(e.target.value)} /></div></div>
      <button className="btn o blk" style={{ marginTop: 12 }} onClick={agregar}>Buscar pedido</button></div>
  </>);
}
