'use client';
// Club Américas: cuenta propia (nombre + WhatsApp + contraseña). Con la sesión iniciada se ve la tarjeta
// de sellos y el descuento se aplica solo en el carrito.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from './Tienda';

const K = 'ad_cliente_v1';
const leer = () => { try { return JSON.parse(localStorage.getItem(K) || '{}') || {}; } catch { return {}; } };
const guardar = (v) => { try { localStorage.setItem(K, JSON.stringify({ ...leer(), ...v })); } catch {} };

export function Sellos({ e }) {
  return <div className="sellos">{Array.from({ length: e.cada }).map((_, i) => <i key={i} className={i < e.progreso ? 'on' : i === e.cada - 1 ? 'pz' : ''}>{i === e.cada - 1 ? '%' : i < e.progreso ? '✓' : ''}</i>)}</div>;
}

export default function ClubApp() {
  const [e, setE] = useState(null), [cargando, setCargando] = useState(true);
  const cargar = async () => { const r = await api('miClub'); setE(r && r.ok ? r : null); setCargando(false); if (r && r.ok) guardar({ nombre: r.nombre, tel: r.tel }); };
  useEffect(() => { cargar(); }, []);
  if (cargando) return <div className="vacio">Cargando…</div>;
  return (<div className="clubpag" style={{ paddingTop: 14 }}>
    <section className="hero tema-oscuro" style={{ padding: '26px 22px' }}>
      <span className="kicker">★ Club Américas</span>
      <h1 className="h2s" style={{ margin: '14px 0 8px', color: '#fff' }}>Comprá seguido y <em>ahorrá</em>.</h1>
      <p style={{ color: 'var(--txt2)', margin: 0, maxWidth: 520 }}>Creá tu cuenta gratis y <b style={{ color: '#fff' }}>cada {e?.cada || 5} compras tenés {e?.pct || 15}% OFF</b> en tu pedido. Se descuenta solo en el carrito cuando entrás con tu cuenta.</p>
    </section>
    {e ? <Tarjeta e={e} salir={async () => { await api('salirClub'); setE(null); }} /> : <Acceso onOk={cargar} />}
    <div className="pasos3" style={{ marginTop: 14 }}>
      <div><b>1</b><span>Creás tu cuenta con tu WhatsApp y una contraseña</span></div><div><b>2</b><span>Hacés tus pedidos por la web con tu cuenta*</span></div><div><b>3</b><span>En la compra {e?.cada || 5}, {e?.pct || 15}% OFF solo</span></div>
    </div>
    <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>*Cuentan los pedidos hechos por la tienda online con el WhatsApp de tu cuenta, una vez entregados.</div>
  </div>);
}

function Tarjeta({ e, salir }) {
  return (<div className="tarjeta" style={{ marginTop: 14 }}>
    <div style={{ font: '800 20px/1.1 var(--hf)', position: 'relative', zIndex: 1 }}>¡Hola, {String(e.nombre).split(' ')[0]}! Tu tarjeta del Club</div>
    <div style={{ color: '#cfcfcf', marginTop: 4, position: 'relative', zIndex: 1 }}>{e.toca ? `🎉 ¡Tu próxima compra tiene ${e.pct}% OFF!` : `Llevás ${e.progreso} de ${e.cada - 1} compras · te faltan ${e.faltan} para tu ${e.pct}% OFF`}</div>
    <div style={{ position: 'relative', zIndex: 1 }}><Sellos e={e} /></div>
    <div style={{ color: '#9a9a9a', fontSize: 12.5, marginTop: 10, position: 'relative', zIndex: 1 }}>WhatsApp de tu cuenta: {e.tel}. Compras entregadas: {e.entregados}.</div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14, position: 'relative', zIndex: 1 }}>
      <Link className="btn r" href="/productos">Hacer un pedido</Link>
      <button className="btn o" style={{ color: '#fff', borderColor: '#444' }} onClick={salir}>Salir</button>
    </div>
  </div>);
}

function Acceso({ onOk }) {
  const [modo, setModo] = useState('crear'), [f, setF] = useState({ nombre: '', tel: '', clave: '', cumple: '', acepta: true, privacidad: false }), [msg, setMsg] = useState(null), [env, setEnv] = useState(false);
  useEffect(() => { const y = leer(); setF((x) => ({ ...x, nombre: y.nombre || '', tel: y.tel || '' })); }, []);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  async function enviar(ev) {
    ev.preventDefault(); setEnv(true); setMsg(null);
    const r = await api(modo === 'crear' ? 'unirme' : 'entrarClub', f); setEnv(false);
    if (r.ok) { guardar({ nombre: f.nombre, tel: f.tel }); onOk(); } else setMsg(r.msg);
  }
  return (<div className="panel" style={{ maxWidth: 520, margin: '16px auto 0' }}>
    <div className="seg" style={{ marginBottom: 6 }}><button className={modo === 'crear' ? 'on' : ''} onClick={() => { setModo('crear'); setMsg(null); }}>Crear mi cuenta</button><button className={modo === 'entrar' ? 'on' : ''} onClick={() => { setModo('entrar'); setMsg(null); }}>Ya tengo cuenta</button></div>
    <form onSubmit={enviar}>
      {modo === 'crear' && <><label className="campo">Tu nombre</label><input className="inp" autoComplete="name" value={f.nombre} onChange={(x) => set('nombre', x.target.value)} /></>}
      <label className="campo">Tu WhatsApp</label><input className="inp" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ej. 343 4123456" value={f.tel} onChange={(x) => set('tel', x.target.value)} />
      <label className="campo">{modo === 'crear' ? 'Elegí una contraseña (mínimo 6)' : 'Contraseña'}</label><input className="inp" type="password" autoComplete={modo === 'crear' ? 'new-password' : 'current-password'} value={f.clave} onChange={(x) => set('clave', x.target.value)} />
      {modo === 'crear' && <>
        <label className="campo">Tu cumpleaños (opcional, día/mes) 🎂</label><input className="inp" placeholder="Ej. 17/09" value={f.cumple} onChange={(x) => set('cumple', x.target.value)} />
        <label className="chk"><input type="checkbox" checked={f.acepta} onChange={(x) => set('acepta', x.target.checked)} /> Quiero recibir ofertas por WhatsApp (pocas, prometido)</label>
        <label className="chk" style={{ alignItems: 'flex-start' }}><input type="checkbox" checked={f.privacidad} onChange={(x) => set('privacidad', x.target.checked)} style={{ marginTop: 2 }} /><span>Acepto la <a href="/privacidad" target="_blank" rel="noopener" style={{ textDecoration: 'underline' }}>Política de privacidad</a>.</span></label>
      </>}
      {msg && <div className="aviso">{msg}</div>}
      <button className="btn r blk" style={{ marginTop: 14 }} disabled={env || (modo === 'crear' && !f.privacidad)}>{env ? 'Un momento…' : modo === 'crear' ? 'Crear mi cuenta del Club' : 'Entrar'}</button>
    </form>
  </div>);
}
