'use client';
// Página del revendedor: crear cuenta, entrar, y su panel (link, ventas y lo que cobra).
import { useCallback, useEffect, useState } from 'react';
import { Ic } from './Icono';
import { plata } from '@/lib/precios';

async function V(accion, body) {
  const r = await fetch('/api/vendedor/' + accion, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  try { return await r.json(); } catch { return { ok: false, msg: 'Sin conexión.' }; }
}
const fecha = (ms) => new Date(ms).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });

export default function VendedorApp({ pct }) {
  const [d, setD] = useState(null), [cargando, setCargando] = useState(true);
  const cargar = useCallback(async () => { const r = await V('yo'); setD(r.ok ? r : null); setCargando(false); }, []);
  useEffect(() => { cargar(); }, [cargar]);
  if (cargando) return <div className="vacio">Cargando…</div>;
  return d ? <MiPanel d={d} salir={async () => { await V('salir'); setD(null); }} recargar={cargar} /> : <Entrada pct={pct} onEntro={cargar} />;
}

function Entrada({ pct, onEntro }) {
  const [modo, setModo] = useState('crear'), [f, setF] = useState({ nombre: '', telefono: '', clave: '', alias: '', nota: '' }), [msg, setMsg] = useState(null), [env, setEnv] = useState(false);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  async function enviar(e) {
    e.preventDefault(); setEnv(true); setMsg(null);
    if (modo === 'crear') {
      const r = await V('registro', f); setEnv(false); setMsg({ ok: r.ok, t: r.msg });
      if (r.ok && r.estado === 'activo') { const l = await V('login', f); if (l.ok) onEntro(); }
    } else {
      const r = await V('login', { telefono: f.telefono, clave: f.clave }); setEnv(false);
      if (r.ok) onEntro(); else setMsg({ ok: false, t: r.msg });
    }
  }
  return (<div className="vend">
    <section className="hero tema-oscuro" style={{ padding: '28px 22px' }}>
      <span className="kicker">★ Programa de revendedores</span>
      <h1 className="h2s" style={{ margin: '14px 0 8px' }}>Vendé con nosotros y <em>ganá plata</em>.</h1>
      <p style={{ color: 'var(--txt2)', margin: 0, maxWidth: 520 }}>Compartís tu link con amigos, familia y grupos. Cada pedido que se entrega te deja el <b style={{ color: '#fff' }}>{pct}% de la ganancia</b>. Sin invertir, sin stock: nosotros preparamos y entregamos. <b style={{ color: '#fff' }}>Cobrás todas las semanas.</b></p>
    </section>
    <div className="pasos3">
      <div><b>1</b><span>Creás tu cuenta gratis</span></div><div><b>2</b><span>Te aprobamos y recibís tu link</span></div><div><b>3</b><span>Compartís y cobrás cada semana</span></div>
    </div>
    <div className="panel" style={{ maxWidth: 520, margin: '16px auto 0' }}>
      <div className="seg" style={{ marginBottom: 6 }}><button className={modo === 'crear' ? 'on' : ''} onClick={() => { setModo('crear'); setMsg(null); }}>Crear cuenta</button><button className={modo === 'entrar' ? 'on' : ''} onClick={() => { setModo('entrar'); setMsg(null); }}>Ya tengo cuenta</button></div>
      <form onSubmit={enviar}>
        {modo === 'crear' && <><label className="campo">Nombre y apellido</label><input className="inp" autoComplete="name" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} /></>}
        <label className="campo">Tu WhatsApp</label><input className="inp" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ej. 343 4123456" value={f.telefono} onChange={(e) => set('telefono', e.target.value)} />
        <label className="campo">{modo === 'crear' ? 'Elegí una contraseña (mínimo 6)' : 'Contraseña'}</label><input className="inp" type="password" autoComplete={modo === 'crear' ? 'new-password' : 'current-password'} value={f.clave} onChange={(e) => set('clave', e.target.value)} />
        {modo === 'crear' && <>
          <label className="campo">Alias o CBU para pagarte (opcional, lo podés cargar después)</label><input className="inp" value={f.alias} onChange={(e) => set('alias', e.target.value)} placeholder="ej. pedro.gomez.mp" />
          <label className="campo">¿Cómo pensás vender? (opcional)</label><textarea className="inp" rows={2} value={f.nota} onChange={(e) => set('nota', e.target.value)} placeholder="Ej. a mis compañeros de trabajo, en el grupo del barrio…" />
        </>}
        {msg && <div className={'aviso' + (msg.ok ? ' ok' : '')}>{msg.t}</div>}
        <button className="btn r blk" style={{ marginTop: 14 }} disabled={env}>{env ? 'Un momento…' : modo === 'crear' ? 'Crear mi cuenta' : 'Entrar'}</button>
      </form>
    </div>
  </div>);
}

function MiPanel({ d, salir, recargar }) {
  const sitio = typeof window !== 'undefined' ? window.location.origin : '';
  const link = sitio + '/?ref=' + d.yo.codigo, linkOf = sitio + '/ofertas?ref=' + d.yo.codigo;
  const [alias, setAlias] = useState(d.yo.alias || ''), [ok, setOk] = useState('');
  const copiar = async (t) => { try { await navigator.clipboard.writeText(t); setOk('¡Copiado!'); setTimeout(() => setOk(''), 1800); } catch { setOk(t); } };
  const compartir = (txt) => window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank');
  const R = d.resumen;
  return (<div className="vend">
    <div className="saludo" style={{ marginTop: 16 }}><b>¡Hola, {d.yo.nombre.split(' ')[0]}! 👋</b><span>Este es tu panel de revendedor. Ganás el {d.cfg.pct}% de la ganancia de cada pedido entregado.</span></div>
    {!d.yo.activo && <div className="aviso y">Tu cuenta está pausada por ahora: los pedidos nuevos no suman comisión. Escribinos si tenés dudas.</div>}
    <div className="kps" style={{ marginTop: 12 }}>
      <div className="kp hero"><div className="l">Para cobrar</div><div className="v">{plata(R.aCobrar)}</div><div className="s">te lo pagamos esta semana</div></div>
      <div className="kp"><div className="l">En camino</div><div className="v">{plata(R.enCurso)}</div><div className="s">se suma cuando se entrega</div></div>
      <div className="kp"><div className="l">Ya cobraste</div><div className="v">{plata(R.cobrado)}</div></div>
      <div className="kp"><div className="l">Tus ventas</div><div className="v">{R.pedidos}</div><div className="s">{plata(R.vendido)} entregado</div></div>
    </div>

    <div className="panel" style={{ marginTop: 14 }}>
      <b style={{ font: '700 18px/1.1 var(--hf)' }}>🔗 Tu link para compartir</b>
      <div className="inp" style={{ marginTop: 8, wordBreak: 'break-all', cursor: 'pointer' }} onClick={() => copiar(link)}>{link}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button className="btn r" onClick={() => copiar(link)}><Ic n="copy" cl="s" /> Copiar link</button>
        <button className="btn w" onClick={() => compartir(`🛒 ¡Hacé tu pedido en Américas Drugstore! Dietética, despensa, kiosco y bebidas, con envío en Paraná y 10% OFF en efectivo o transferencia 👉 ${link}`)}><Ic n="wa" cl="s" /> Compartir por WhatsApp</button>
        <button className="btn o" onClick={() => compartir(`🔥 Mirá las ofertas de esta semana en Américas Drugstore 👉 ${linkOf}`)}>🔥 Compartir ofertas</button>
      </div>
      {ok && <div className="aviso ok">{ok}</div>}
      <div className="muted" style={{ marginTop: 8 }}>Quien entra por tu link queda asociado a vos durante 30 días, aunque compre otro día.</div>
    </div>

    <div className="panel" style={{ marginTop: 14 }}>
      <b style={{ font: '700 18px/1.1 var(--hf)' }}>💳 ¿Dónde te pagamos?</b>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><input className="inp" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="Alias o CBU" />
        <button className="btn o" onClick={async () => { const r = await V('alias', { alias }); setOk(r.msg); recargar(); }}>Guardar</button></div>
    </div>

    <div className="sec"><h3>Tus ventas</h3></div>
    {!d.ventas.length ? <div className="pcard muted" style={{ textAlign: 'center' }}>Todavía no tenés ventas. ¡Compartí tu link para arrancar! 💪</div>
      : d.ventas.map((v) => (<div className="pcard mini" key={v.nro}>
        <div style={{ flex: 1, minWidth: 0 }}><b>{v.nro} · {v.cliente}</b><div className="muted">{fecha(v.fecha)} · {plata(v.total)}</div></div>
        <span className={'est e-' + v.estado.replace(' ', '')}>{v.estado}</span>
        <b style={{ font: '700 17px/1 var(--hf)', minWidth: 80, textAlign: 'right' }}>{v.estado === 'Cancelado' ? '—' : plata(v.comision)}{v.pagada ? ' ✅' : ''}</b>
      </div>))}

    <div className="panel" style={{ marginTop: 14 }}>
      <b style={{ font: '700 18px/1.1 var(--hf)' }}>💡 Tips para vender más</b>
      <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: 'var(--txt2)' }}>
        <li>Subí tu link a tus estados de WhatsApp 2 o 3 veces por semana.</li>
        <li>Compartí las ofertas: “Ahorrás $…” llama más que un porcentaje.</li>
        <li>Contá que hay envío en Paraná y 10% OFF pagando en efectivo o transferencia.</li>
      </ul>
    </div>
    <button className="btn o" style={{ marginTop: 14 }} onClick={salir}>Salir</button>
  </div>);
}
