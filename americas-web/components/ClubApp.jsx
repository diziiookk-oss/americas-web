'use client';
// Club Américas: el cliente se anota (opcional) y ve su tarjeta de sellos.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from './Tienda';

const K = 'ad_cliente_v1';
const leer = () => { try { return JSON.parse(localStorage.getItem(K) || '{}') || {}; } catch { return {}; } };
const guardar = (v) => { try { localStorage.setItem(K, JSON.stringify({ ...leer(), ...v })); } catch {} };

export default function ClubApp() {
  const [f, setF] = useState({ nombre: '', tel: '', cumple: '', acepta: true }), [e, setE] = useState(null), [msg, setMsg] = useState(null), [env, setEnv] = useState(false);
  useEffect(() => { const y = leer(); setF((x) => ({ ...x, nombre: y.nombre || '', tel: y.tel || '' })); if (y.tel) consultar(y.tel); }, []); // eslint-disable-line
  async function consultar(tel) { const r = await api('club', { tel }); if (r && r.ok) setE(r); }
  async function unirme(ev) {
    ev.preventDefault(); setEnv(true); setMsg(null);
    const r = await api('unirme', f); setEnv(false); setMsg({ ok: r.ok, t: r.msg });
    if (r.ok) { guardar({ nombre: f.nombre, tel: f.tel }); setE(r.estado); }
  }
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  return (<div className="clubpag" style={{ paddingTop: 14 }}>
    <section className="hero tema-oscuro" style={{ padding: '26px 22px' }}>
      <span className="kicker">★ Club Américas</span>
      <h1 className="h2s" style={{ margin: '14px 0 8px', color: '#fff' }}>Comprá seguido y <em>ahorrá</em>.</h1>
      <p style={{ color: 'var(--txt2)', margin: 0, maxWidth: 520 }}>Es gratis y no es obligatorio. Te anotás con tu nombre y WhatsApp, y <b style={{ color: '#fff' }}>cada {e?.cada || 5} compras tenés {e?.pct || 15}% OFF</b> en tu pedido. Se descuenta solo en el carrito.</p>
    </section>

    {e?.registrado ? (<div className="tarjeta" style={{ marginTop: 14 }}>
      <div style={{ font: '800 20px/1.1 var(--hf)', position: 'relative', zIndex: 1 }}>Tu tarjeta del Club</div>
      <div style={{ color: '#cfcfcf', marginTop: 4, position: 'relative', zIndex: 1 }}>{e.toca ? `🎉 ¡Tu próxima compra tiene ${e.pct}% OFF!` : `Llevás ${e.progreso} de ${e.cada - 1} compras · te faltan ${e.faltan} para tu ${e.pct}% OFF`}</div>
      <div className="sellos" style={{ position: 'relative', zIndex: 1 }}>{Array.from({ length: e.cada }).map((_, i) => <i key={i} className={i < e.progreso ? 'on' : i === e.cada - 1 ? 'pz' : ''}>{i === e.cada - 1 ? '%' : i < e.progreso ? '✓' : ''}</i>)}</div>
      <div style={{ color: '#9a9a9a', fontSize: 12.5, marginTop: 10, position: 'relative', zIndex: 1 }}>Cuentan las compras entregadas hechas con tu WhatsApp. {e.entregados} en total.</div>
      <Link className="btn r" href="/productos" style={{ marginTop: 14, position: 'relative', zIndex: 1 }}>Hacer un pedido</Link>
    </div>) : (
    <div className="panel" style={{ maxWidth: 520, margin: '16px auto 0' }}>
      <b style={{ font: '800 20px/1.1 var(--hf)' }}>Sumarme gratis</b>
      <form onSubmit={unirme}>
        <label className="campo">Tu nombre</label><input className="inp" autoComplete="name" value={f.nombre} onChange={(x) => set('nombre', x.target.value)} />
        <label className="campo">Tu WhatsApp</label><input className="inp" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ej. 343 4123456" value={f.tel} onChange={(x) => set('tel', x.target.value)} />
        <label className="campo">Tu cumpleaños (opcional, día/mes) 🎂</label><input className="inp" placeholder="Ej. 17/09" value={f.cumple} onChange={(x) => set('cumple', x.target.value)} />
        <label className="chk"><input type="checkbox" checked={f.acepta} onChange={(x) => set('acepta', x.target.checked)} /> Quiero recibir ofertas por WhatsApp (pocas, prometido)</label>
        {msg && <div className={'aviso' + (msg.ok ? ' ok' : '')}>{msg.t}</div>}
        <button className="btn r blk" style={{ marginTop: 14 }} disabled={env}>{env ? 'Un momento…' : 'Sumarme al Club'}</button>
      </form>
    </div>)}

    <div className="pasos3" style={{ marginTop: 14 }}>
      <div><b>1</b><span>Te anotás con tu nombre y WhatsApp</span></div><div><b>2</b><span>Hacés tus pedidos por la web como siempre*</span></div><div><b>3</b><span>En la compra {e?.cada || 5}, {e?.pct || 15}% OFF solo</span></div>
    </div>
    <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>*Cuentan los pedidos hechos por la tienda online con tu WhatsApp, una vez entregados.</div>
  </div>);
}
