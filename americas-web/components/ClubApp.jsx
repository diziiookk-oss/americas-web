'use client';
// Club Américas: el cliente se anota (opcional) y ve su tarjeta de sellos.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from './Tienda';

const K = 'ad_cliente_v1';
const leer = () => { try { return JSON.parse(localStorage.getItem(K) || '{}') || {}; } catch { return {}; } };
const guardar = (v) => { try { localStorage.setItem(K, JSON.stringify({ ...leer(), ...v })); } catch {} };

// "Ya soy del Club": entra solo con el WhatsApp (sin contraseña: el club no guarda nada sensible).
function YaSoy({ onOk }) {
  const [abierto, setAbierto] = useState(false), [tel, setTel] = useState(''), [msg, setMsg] = useState(''), [env, setEnv] = useState(false);
  if (!abierto) return <button className="linkito" style={{ marginTop: 10, background: 'none', border: 0 }} onClick={() => setAbierto(true)}>¿Ya sos del Club? <b style={{ marginLeft: 4 }}>Entrá con tu WhatsApp</b></button>;
  return (<form style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 12 }} onSubmit={async (ev) => {
    ev.preventDefault(); setEnv(true); setMsg(''); const r = await api('club', { tel }); setEnv(false);
    if (r && r.ok && r.registrado) onOk(tel, r); else setMsg('No encontramos ese WhatsApp en el Club. Sumate arriba, es gratis 🙌');
  }}>
    <label className="campo">Tu WhatsApp</label>
    <div style={{ display: 'flex', gap: 8 }}><input className="inp" type="tel" inputMode="tel" placeholder="Ej. 343 4123456" value={tel} onChange={(x) => setTel(x.target.value)} /><button className="btn o" disabled={env}>{env ? '…' : 'Entrar'}</button></div>
    {msg && <div className="aviso y">{msg}</div>}
  </form>);
}

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
        <div className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>Al sumarte aceptás nuestra <a href="/privacidad" target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>Política de privacidad</a>. Podés pedir la baja cuando quieras.</div>
        <button className="btn r blk" style={{ marginTop: 12 }} disabled={env}>{env ? 'Un momento…' : 'Sumarme al Club'}</button>
      </form>
      <YaSoy onOk={(tel, est) => { guardar({ tel }); setE(est); }} />
    </div>)}

    <div className="pasos3" style={{ marginTop: 14 }}>
      <div><b>1</b><span>Te anotás con tu nombre y WhatsApp</span></div><div><b>2</b><span>Hacés tus pedidos por la web como siempre*</span></div><div><b>3</b><span>En la compra {e?.cada || 5}, {e?.pct || 15}% OFF solo</span></div>
    </div>
    <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>*Cuentan los pedidos hechos por la tienda online con tu WhatsApp, una vez entregados.</div>
  </div>);
}
