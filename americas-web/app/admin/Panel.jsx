'use client';
// Panel del dueño: pedidos, estadísticas, productos, ruleta, avisos y configuración.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Ic, Logo } from '@/components/Icono';
import { plata, telWA } from '@/lib/precios';

async function A(accion, body) {
  const r = await fetch('/api/admin/' + accion, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  let j; try { j = await r.json(); } catch { j = { ok: false, msg: 'Sin conexión.' }; }
  if (j.login) window.dispatchEvent(new Event('ad-login'));
  return j;
}
const hora = (ms) => new Date(ms).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const wa = (tel, txt) => window.open('https://wa.me/' + telWA(tel) + '?text=' + encodeURIComponent(txt), '_blank');

// Secciones del panel: las 5 primeras van en la barra de abajo del celu; el resto en "Más".
const SECCIONES = [
  ['inicio', 'home', 'Inicio'], ['pedidos', 'receipt', 'Pedidos'], ['productos', 'bag', 'Productos'], ['vendedores', 'gift', 'Revendedores'],
  ['estadisticas', 'grid', 'Estadísticas'], ['ruleta', 'wheel', 'Ruleta'], ['avisos', 'bell', 'Avisos de stock'], ['config', 'shop', 'Ajustes']
];
const TITULOS = { inicio: 'Inicio', pedidos: 'Pedidos', productos: 'Productos', vendedores: 'Revendedores', estadisticas: 'Estadísticas', ruleta: 'Ruleta de premios', avisos: 'Avisos de stock', config: 'Ajustes de la tienda' };

export default function Panel() {
  const [log, setLog] = useState(null), [tab, setTab] = useState('inicio'), [extra, setExtra] = useState(null), [toast, setToast] = useState(null), [nuevos, setNuevos] = useState(0), [mas, setMas] = useState(false);
  const avisar = useCallback((t, mal) => { setToast({ t, mal }); setTimeout(() => setToast(null), 2800); }, []);
  useEffect(() => { A('pedidos').then((r) => { setLog(!!r.ok); if (r.ok) setNuevos(r.nuevos); }); const h = () => setLog(false); window.addEventListener('ad-login', h); return () => window.removeEventListener('ad-login', h); }, []);
  // vigila pedidos nuevos desde cualquier sección (suena y avisa)
  const ultN = useRef(-1);
  useEffect(() => {
    if (!log) return;
    const t = setInterval(async () => { const r = await A('pedidos'); if (!r.ok) return; if (ultN.current >= 0 && r.nuevos > ultN.current) { avisar('🛒 ¡Entró un pedido nuevo!'); sonar(); } ultN.current = r.nuevos; setNuevos(r.nuevos); }, 30000);
    return () => clearInterval(t);
  }, [log, avisar]);
  if (log === null) return <div className="vacio">Cargando…</div>;
  if (!log) return <Login onOk={() => setLog(true)} />;
  const ir = (k, x) => { setTab(k); setExtra(x || null); setMas(false); window.scrollTo(0, 0); };
  const item = ([k, i, t]) => <button key={k} className={'adi' + (tab === k ? ' on' : '')} onClick={() => ir(k)}><Ic n={i} /><span>{t}</span>{k === 'pedidos' && nuevos > 0 && <b className="nb">{nuevos}</b>}</button>;
  const salir = async () => { await A('logout'); setLog(false); };
  return (<div className="adshell">
    <aside className="adside tema-oscuro">
      <a href="/" target="_blank" rel="noopener" className="adlogo"><Logo alto={44} /></a>
      <div className="adgrupo">Día a día</div>{SECCIONES.slice(0, 4).map(item)}
      <div className="adgrupo">Tienda</div>{SECCIONES.slice(4).map(item)}
      <div style={{ marginTop: 'auto' }}><a className="adi" href="/" target="_blank" rel="noopener"><Ic n="shop" /><span>Ver mi tienda ↗</span></a><button className="adi" onClick={salir}><Ic n="x" /><span>Salir</span></button></div>
    </aside>
    <div className="admain">
      <div className="adtop tema-oscuro"><Logo alto={30} /><a className="btn o" href="/" target="_blank" rel="noopener" style={{ marginLeft: 'auto', padding: '8px 12px', fontSize: 11 }}>Ver tienda ↗</a></div>
      <h1 className="adh1">{TITULOS[tab]}</h1>
      {tab === 'inicio' && <Inicio avisar={avisar} ir={ir} />}
      {tab === 'pedidos' && <Pedidos avisar={avisar} setNuevos={setNuevos} />}
      {tab === 'estadisticas' && <Estadisticas />}
      {tab === 'productos' && <Productos avisar={avisar} filtroInicial={extra} />}
      {tab === 'vendedores' && <Vendedores avisar={avisar} />}
      {tab === 'ruleta' && <Ruleta avisar={avisar} />}
      {tab === 'avisos' && <Avisos />}
      {tab === 'config' && <Config avisar={avisar} />}
    </div>
    <nav className="adbottom">{SECCIONES.slice(0, 4).map(item)}<button className={'adi' + (SECCIONES.slice(4).some((s) => s[0] === tab) ? ' on' : '')} onClick={() => setMas(true)}><Ic n="grid" /><span>Más</span></button></nav>
    {mas && <><div className="velo on" onClick={() => setMas(false)} /><div className="hoja on" style={{ zIndex: 90 }}><div className="asa" /><h3>Más opciones<button className="x" onClick={() => setMas(false)}><Ic n="x" cl="s" /></button></h3>
      <div className="admas">{SECCIONES.slice(4).map(item)}<a className="adi" href="/" target="_blank" rel="noopener"><Ic n="shop" /><span>Ver mi tienda ↗</span></a><button className="adi" onClick={salir}><Ic n="x" /><span>Salir</span></button></div></div></>}
    {toast && <div className={'toast on' + (toast.mal ? ' bad' : '')}>{toast.t}</div>}
  </div>);
}

function sonar() { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.value = .15; o.start(); setTimeout(() => { o.frequency.value = 1320; }, 150); setTimeout(() => { o.stop(); a.close(); }, 320); } catch {} }

/* ------------------------------------------------------------------ inicio */
const SIGUIENTE = { Nuevo: ['Preparando', '✅ Aceptar y preparar'], Preparando: ['Listo', '📦 Marcar como listo'], Listo: [null, ''], 'En camino': ['Entregado', '🏁 Marcar entregado'] };
function siguiente(p) {
  if (p.estado === 'Listo') return p.entrega === 'Envío' ? ['En camino', '🛵 Salió a entregar'] : ['Entregado', '🏁 Lo retiró: entregado'];
  return SIGUIENTE[p.estado] || [null, ''];
}
function Inicio({ avisar, ir }) {
  const [d, setD] = useState(null), [v, setV] = useState(null), [prod, setProd] = useState(null), [cfg, setCfg] = useState(null);
  const cargar = useCallback(async () => {
    const [a, b, c, e] = await Promise.all([A('pedidos'), A('vendedores'), A('productos', { filtro: 'sinFoto' }), A('config')]);
    if (a.ok) setD(a); if (b.ok) setV(b); if (c.ok) setProd(c); if (e.ok) setCfg(e.config);
  }, []);
  useEffect(() => { cargar(); const t = setInterval(cargar, 30000); return () => clearInterval(t); }, [cargar]);
  if (!d) return <div className="sk" style={{ height: 300 }} />;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const sem = Date.now() - 7 * 86400000;
  const validos = d.pedidos.filter((p) => p.estado !== 'Cancelado');
  const vHoy = validos.filter((p) => p.fecha >= hoy.getTime()), vSem = validos.filter((p) => p.fecha >= sem);
  const activos = d.pedidos.filter((p) => p.estado !== 'Entregado' && p.estado !== 'Cancelado');
  const aPagar = v ? v.vendedores.reduce((a, x) => a + x.pendiente, 0) : 0;
  const h = new Date().getHours(), saludo = h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
  const avanzar = async (p) => { const [e] = siguiente(p); if (!e) return; const r = await A('estado', { nro: p.nro, estado: e }); avisar(r.msg, !r.ok); if (r.ok) { setD(r); if (confirm('¿Le avisás a ' + p.cliente + ' por WhatsApp?')) wa(p.tel, msgEstado(p, e)); } };
  const abierta = cfg ? cfg.abierta : true;
  return (<>
    <div className="saludo"><b>{saludo} 👋</b><span>{activos.length ? 'Tenés ' + activos.length + ' pedido' + (activos.length > 1 ? 's' : '') + ' para atender.' : 'No hay pedidos pendientes. ¡Todo al día!'}</span></div>
    {cfg && <div className={'abierta' + (abierta ? ' si' : '')} onClick={async () => { const r = await A('guardarConfig', { config: { abierta: !abierta } }); avisar(r.ok ? (abierta ? 'Tienda cerrada: no entran pedidos.' : 'Tienda abierta: ya entran pedidos.') : r.msg, !r.ok); if (r.ok) setCfg(r.config); }}>
      <i /><div><b>{abierta ? 'La tienda está ABIERTA' : 'La tienda está CERRADA'}</b><span>{abierta ? 'Están entrando pedidos. Tocá para cerrarla.' : 'No entran pedidos. Tocá para abrirla.'}</span></div><em>{abierta ? 'Cerrar' : 'Abrir'}</em></div>}
    <div className="kps" style={{ marginTop: 12 }}>
      <div className="kp hero"><div className="l">Vendido hoy</div><div className="v">{plata(vHoy.reduce((a, p) => a + p.total, 0))}</div><div className="s">{vHoy.length} pedido{vHoy.length === 1 ? '' : 's'}</div></div>
      <div className="kp"><div className="l">Últimos 7 días</div><div className="v">{plata(vSem.reduce((a, p) => a + p.total, 0))}</div><div className="s">{vSem.length} pedidos · ticket {plata(vSem.length ? vSem.reduce((a, p) => a + p.total, 0) / vSem.length : 0)}</div></div>
      <div className="kp" style={{ cursor: 'pointer' }} onClick={() => ir('pedidos')}><div className="l">Para atender</div><div className="v" style={{ color: activos.length ? 'var(--red)' : 'var(--ok)' }}>{activos.length}</div><div className="s">ver pedidos →</div></div>
      <div className="kp" style={{ cursor: 'pointer' }} onClick={() => ir('vendedores')}><div className="l">A pagar a revendedores</div><div className="v">{plata(aPagar)}</div><div className="s">ver revendedores →</div></div>
    </div>

    <div className="sec" style={{ marginTop: 22 }}><h3>Para atender ahora</h3>{activos.length > 0 && <a onClick={() => ir('pedidos')}>Ver todos →</a>}</div>
    {!activos.length && <div className="pcard muted" style={{ textAlign: 'center' }}>🎉 Nada pendiente. Cuando entre un pedido va a sonar y aparecer acá.</div>}
    {activos.slice(0, 5).map((p) => { const [e, t] = siguiente(p); return (
      <div className="pcard mini" key={p.nro}>
        <div style={{ flex: 1, minWidth: 0 }}><b>{p.nro} · {p.cliente}</b><div className="muted">{hora(p.fecha)} · {p.entrega === 'Envío' ? '🛵 Envío' : '🏪 Retira'} · {plata(p.total)}</div></div>
        <span className={'est e-' + p.estado.replace(' ', '')}>{p.estado}</span>
        {e && <button className="btn r" style={{ padding: '10px 12px', fontSize: 12 }} onClick={() => avanzar(p)}>{t}</button>}
      </div>); })}

    <div className="sec" style={{ marginTop: 22 }}><h3>Para vender más</h3></div>
    <div className="tareas">
      {prod && prod.sinFoto > 0 && <button className="tarea" onClick={() => ir('productos', 'sinFoto')}><b>📷 {prod.sinFoto} productos sin foto</b><span>Con foto se venden más. Completalos de a uno con “Guardar y siguiente”.</span></button>}
      <button className="tarea" onClick={() => ir('productos', 'destacados')}><b>⭐ Elegí tus destacados</b><span>Los que marcás como destacados salen primero en el inicio de la tienda.</span></button>
      <button className="tarea" onClick={() => ir('vendedores')}><b>🤝 Sumá revendedores</b><span>Cada uno vende con su link y gana el {v ? v.pct : 30}% de la ganancia.</span></button>
      <button className="tarea" onClick={async () => { const u = window.location.origin; try { await navigator.clipboard.writeText(u); avisar('Link de la tienda copiado: pegalo en tus estados.'); } catch { avisar(u); } }}><b>🔗 Copiar link de la tienda</b><span>Para tus estados de WhatsApp, Instagram y grupos del barrio.</span></button>
    </div>
  </>);
}

function Login({ onOk }) {
  const [c, setC] = useState(''), [msg, setMsg] = useState(''), [env, setEnv] = useState(false);
  return (<div className="panel" style={{ maxWidth: 380, margin: '60px auto' }}><Logo alto={38} /><h1 className="h" style={{ fontSize: 22, margin: '18px 0 6px' }}>Panel del dueño</h1>
    <form onSubmit={async (e) => { e.preventDefault(); setEnv(true); const r = await A('login', { clave: c }); setEnv(false); if (r.ok) onOk(); else setMsg(r.msg); }}>
      <label className="campo">Contraseña</label><input className="inp" type="password" autoComplete="current-password" value={c} onChange={(e) => setC(e.target.value)} autoFocus />
      {msg && <div className="aviso">{msg}</div>}<button className="btn r blk" style={{ marginTop: 14 }} disabled={env}>Entrar</button></form></div>);
}

/* ------------------------------------------------------------------ pedidos */
const FILTROS = ['Activos', 'Nuevo', 'Preparando', 'Listo', 'En camino', 'Entregado', 'Cancelado', 'Todos'];
function msgEstado(p, e, negocio) {
  const nom = (p.cliente || '').split(' ')[0], tot = plata(p.total);
  return ({ Nuevo: `¡Hola ${nom}! Recibimos tu pedido ${p.nro}. En breve lo preparamos 🙌`, Preparando: `¡Hola ${nom}! Ya estamos preparando tu pedido ${p.nro} 🛒 Total: ${tot}.`,
    Listo: p.entrega === 'Envío' ? `¡Hola ${nom}! Tu pedido ${p.nro} está listo y sale en un ratito 🛵 Total: ${tot}.` : `¡Hola ${nom}! Tu pedido ${p.nro} ya está listo para retirar 🎉 Total: ${tot}.`,
    'En camino': `¡Hola ${nom}! Tu pedido ${p.nro} ya está en camino 🛵 Total a pagar: ${tot}.`, Entregado: `¡Gracias por tu compra, ${nom}! 🧡`,
    Cancelado: `Hola ${nom}, te escribimos por tu pedido ${p.nro}: lamentablemente no lo pudimos completar. ¿Te ofrecemos otra opción?` })[e];
}
function Pedidos({ avisar, setNuevos }) {
  const [d, setD] = useState(null), [f, setF] = useState('Activos');
  const ult = useRef(-1);
  const cargar = useCallback(async () => {
    const r = await A('pedidos'); if (!r.ok) return;
    if (ult.current >= 0 && r.nuevos > ult.current) { avisar('🛒 ¡Entró un pedido nuevo!'); try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; o.connect(g); g.connect(a.destination); g.gain.value = .15; o.start(); setTimeout(() => { o.frequency.value = 1320; }, 150); setTimeout(() => { o.stop(); a.close(); }, 320); } catch {} }
    ult.current = r.nuevos; setNuevos(r.nuevos); setD(r);
  }, [avisar, setNuevos]);
  useEffect(() => { cargar(); const t = setInterval(cargar, 30000); return () => clearInterval(t); }, [cargar]);
  if (!d) return <div className="sk" style={{ height: 200 }} />;
  const act = (p) => p.estado !== 'Entregado' && p.estado !== 'Cancelado';
  const L = d.pedidos.filter((p) => f === 'Todos' || (f === 'Activos' ? act(p) : p.estado === f));
  const [aviso, setAviso] = useState({}), [q, setQ] = useState('');
  const cambiar = async (p, e) => { const r = await A('estado', { nro: p.nro, estado: e }); if (!r.ok) return avisar(r.msg, true); setD(r); setNuevos(r.nuevos); ult.current = r.nuevos;
    avisar('Pedido ' + p.nro + ': ' + e); if (e !== 'Nuevo') setAviso((a) => ({ ...a, [p.nro]: e })); };
  const qq = q.trim().toLowerCase().replace(/^p-?/, '');
  const L2 = qq ? L.filter((p) => (p.nro + ' ' + p.cliente + ' ' + p.tel).toLowerCase().includes(qq)) : L;
  return (<>
    <input className="inp" placeholder="Buscar por cliente, número o teléfono…" value={q} onChange={(e) => setQ(e.target.value)} />
    <div className="chips" style={{ marginTop: 10 }}>{FILTROS.map((x) => { const n = d.pedidos.filter((p) => x === 'Todos' || (x === 'Activos' ? act(p) : p.estado === x)).length; return <button key={x} className={'chip' + (f === x ? ' on' : '')} onClick={() => setF(x)}>{x}{n ? ' · ' + n : ''}</button>; })}</div>
    {!d.pedidos.length && <div className="pcard" style={{ textAlign: 'center' }}><div className="muted">Todavía no llegaron pedidos. Compartí el link de la tienda 😉</div></div>}
    {d.pedidos.length > 0 && !L2.length && <div className="pcard muted" style={{ textAlign: 'center' }}>No hay pedidos en “{f}”{qq ? ' con esa búsqueda' : ''}.</div>}
    {L2.map((p) => { const [sig, sigT] = siguiente(p); const pasos = p.entrega === 'Envío' ? ['Nuevo', 'Preparando', 'Listo', 'En camino', 'Entregado'] : ['Nuevo', 'Preparando', 'Listo', 'Entregado']; const ip = pasos.indexOf(p.estado);
      return (<div className={'pcard ped e-' + p.estado.replace(' ', '')} key={p.nro}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><div><b className="pnom">{p.nro} · {p.cliente}</b><div className="muted">{hora(p.fecha)} · 💳 {p.pago}</div></div>
        <div style={{ textAlign: 'right' }}><b className="ptot">{plata(p.total)}</b><div><span className={'est e-' + p.estado.replace(' ', '')}>{p.estado}</span></div></div></div>
      {p.estado !== 'Cancelado' && <div className="pasos">{pasos.map((x, i) => <div key={x} className={'paso' + (i <= ip ? ' ok' : '')}><i>{i < ip || p.estado === 'Entregado' ? '✓' : i + 1}</i>{x}</div>)}</div>}
      <div className="pdato">{p.entrega === 'Envío' ? <>🛵 <b>Envío</b> a {p.dir}</> : <>🏪 <b>Retira</b> en el local</>}</div>
      <div className="pdet">{p.detalle}</div>
      {(p.descuento > 0 || p.envio > 0) && <div className="muted">Subtotal {plata(p.subtotal)}{p.descPremio ? ' · premio −' + plata(p.descPremio) : ''}{p.descPago ? ' · desc. pago −' + plata(p.descPago) : ''}{p.envio ? ' · envío ' + plata(p.envio) : ''}</div>}
      {p.vendedor && <div className="muted">🤝 Revendedor <b style={{ color: 'var(--txt)' }}>{p.vendedor}</b> · comisión {plata(p.comision)}{p.estado === 'Entregado' ? (p.comisionPagada ? ' · ✅ pagada' : ' · a pagar') : ' · se cobra al entregar'}</div>}
      {p.premio && <div className="muted">🎁 {p.premio}</div>}{p.nota && <div className="aviso y">📝 {p.nota}</div>}{p.ticket && <div className="muted">Cobrado en la caja · ticket {p.ticket}</div>}
      {aviso[p.nro] && <button className="btn w blk" style={{ marginTop: 10 }} onClick={() => { wa(p.tel, msgEstado(p, aviso[p.nro])); setAviso((a) => { const n = { ...a }; delete n[p.nro]; return n; }); }}><Ic n="wa" cl="s" /> Avisarle a {p.cliente.split(' ')[0]} que está “{aviso[p.nro]}”</button>}
      {sig && <button className="btn r blk" style={{ marginTop: 10 }} onClick={() => cambiar(p, sig)}>{sigT}</button>}
      <div className="pacc">
        <button className="btn o" onClick={() => wa(p.tel, msgEstado(p, p.estado))}><Ic n="wa" cl="s" /> WhatsApp</button>
        <a className="btn o" href={'tel:+' + telWA(p.tel)}>📞 Llamar</a>
        {p.entrega === 'Envío' && p.dir && <a className="btn o" href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.dir + ', Paraná, Entre Ríos')} target="_blank" rel="noopener">🗺️ Mapa</a>}
        <details className="otros"><summary className="btn o">Cambiar estado ▾</summary>
          <div className="chips" style={{ margin: '8px 0 0', flexWrap: 'wrap' }}>{d.estados.filter((e) => e !== 'En camino' || p.entrega === 'Envío').map((e) => <button key={e} className={'chip' + (p.estado === e ? ' on' : '')} onClick={() => { if (e === 'Cancelado' && !confirm('¿Cancelar el pedido ' + p.nro + '?')) return; cambiar(p, e); }}>{e}</button>)}</div></details>
      </div>
    </div>); })}
  </>);
}

/* ------------------------------------------------------------------ estadísticas */
function Kpi({ t, v, sub, ant, din, hero }) {
  const pct = ant ? Math.round((v - ant) / ant * 100) : null;
  return <div className={'kp' + (hero ? ' hero' : '')}><div className="l">{t}</div><div className="v">{din ? plata(v) : String(v).replace('.', ',')}</div>
    {ant !== undefined && <div className="s" style={{ color: pct === null ? 'var(--mute)' : pct >= 0 ? 'var(--ok)' : 'var(--red2)' }}>{pct === null ? '' : (pct >= 0 ? '↗ +' : '↘ ') + pct + '% vs. período anterior'}</div>}
    {sub && <div className="s">{sub}</div>}</div>;
}
function Estadisticas() {
  const [dias, setDias] = useState(30), [e, setE] = useState(null);
  useEffect(() => { setE(null); A('estadisticas', { dias }).then((r) => r.ok && setE(r)); const t = setInterval(() => A('estadisticas', { dias }).then((r) => r.ok && setE(r)), 60000); return () => clearInterval(t); }, [dias]);
  return (<>
    <div className="chips">{[7, 30, 90].map((d) => <button key={d} className={'chip' + (d === dias ? ' on' : '')} onClick={() => setDias(d)}>{d} días</button>)}</div>
    {!e ? <div className="sk" style={{ height: 300 }} /> : <>
      <div className="kps">
        <Kpi t="Visitantes" v={e.visitantes} ant={e.ant.visitantes} sub={e.nuevos + ' nuevos · ' + e.volvieron + ' volvieron'} />
        <Kpi t="Visitas" v={e.visitas} ant={e.ant.visitas} sub={e.porPagina + ' páginas por visita'} />
        <Kpi t="Páginas vistas" v={e.paginas} ant={e.ant.paginas} sub={e.busquedas + ' búsquedas'} />
        <Kpi t="Agregados al carrito" v={e.carrito} ant={e.ant.carrito} />
        <Kpi t="Pedidos" v={e.pedidos} ant={e.ant.pedidos} sub={plata(e.monto) + ' · ticket prom. ' + plata(e.ticketProm)} />
        <Kpi t="Conversión" v={e.conversion + '%'} sub="visitas que terminaron en pedido" />
        <Kpi t="Consultas por WhatsApp" v={e.whatsapp} ant={e.ant.whatsapp} sub="clics en botones de WhatsApp" />
        <Kpi hero t="● En este momento" v={e.ahora} sub="personas en la tienda (últimos 5 min)" />
      </div>
      <div className="panel" style={{ marginTop: 12 }}><b className="muted">Visitantes únicos por día</b>
        <div className="barras">{e.porDia.map((x) => { const m = Math.max(1, ...e.porDia.map((y) => y.n)); return <div key={x.d} title={x.d + ': ' + x.n} style={{ height: Math.max(2, x.n / m * 100) + '%', background: x.n ? 'linear-gradient(#ff4a50,#b5141a)' : 'var(--line)' }} />; })}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }} className="muted"><span>{e.porDia[0]?.d}</span><span>{e.porDia[e.porDia.length - 1]?.d}</span></div></div>
      <div className="g2">{[['Lo más buscado', e.topBusquedas], ['Productos más vistos', e.topVistos], ['Más agregados al carrito', e.topCarrito], ['Ahora están en…', e.ahoraPag]].map(([t, L]) => (
        <div className="panel" key={t}><b className="muted">{t}</b>{L.length ? L.map((x) => <div key={x.k} className="fx"><span>{x.k}</span><b>{x.n}</b></div>) : <div className="muted">—</div>}</div>))}</div>
      <div className="panel" style={{ marginTop: 12 }}><b className="muted">Última actividad</b>{e.ultimos.length ? e.ultimos.map((x, i) => <div key={i} style={{ fontSize: 13, padding: '3px 0' }}><span className="muted">{x.h}</span> {x.t}</div>) : <div className="muted">Sin actividad todavía.</div>}</div>
    </>}
  </>);
}

/* ------------------------------------------------------------------ productos */
const ETIQUETAS = ['NUEVO', 'MÁS VENDIDO', 'PROMO', 'LIQUIDACIÓN', 'SIN TACC', 'SIN AZÚCAR', 'VEGANO', 'IMPERDIBLE', 'ÚLTIMOS'];
const FILTROS_PROD = [['', 'Todos'], ['sinFoto', '📷 Sin foto'], ['sinDesc', '📝 Sin descripción'], ['destacados', '⭐ Destacados'], ['etiqueta', '🏷️ Con etiqueta'], ['ocultos', '🙈 Ocultos']];

// Si pegás un link de Google Imágenes, saca la foto real (igual lo hace el servidor al guardar).
function linkFoto(u) {
  let s = String(u || '').trim();
  try { const x = new URL(s); const r = x.searchParams.get('imgurl') || x.searchParams.get('mediaurl'); if (r) s = r; } catch {}
  return s;
}
// Descripción base para arrancar (después se edita a mano).
function plantillaDesc(p) {
  const kg = p.unidad === 'kg';
  return `${p.nombre}${kg ? ', suelto por peso: llevás la cantidad exacta que necesitás (100 g, 250 g, 1 kg o lo que quieras)' : ''}.\n\n` +
    `✔ Producto ${String(p.categoria || '').toLowerCase()} de calidad, siempre fresco en Américas Drugstore.\n` +
    `✔ Pedilo online en 2 minutos y retiralo en el local o recibilo en tu casa en Paraná.\n` +
    `✔ 10% OFF pagando en efectivo o transferencia.\n\n` +
    `¿Dudas? Escribinos por WhatsApp y te asesoramos.`;
}

function Productos({ avisar, filtroInicial }) {
  const [q, setQ] = useState(''), [filtro, setFiltro] = useState(filtroInicial || ''), [d, setD] = useState(null), [ed, setEd] = useState(null), [fotoMal, setFotoMal] = useState(false), [guardando, setGuardando] = useState(false);
  const cargar = useCallback(async (qq, ff) => { const r = await A('productos', { q: qq, filtro: ff }); if (r.ok) setD(r); }, []);
  useEffect(() => { const t = setTimeout(() => cargar(q, filtro), 300); return () => clearTimeout(t); }, [q, filtro, cargar]);
  const abrir = (p) => { setFotoMal(false); setEd({ ...p, img_web: p.img_web || '', descripcion: p.descripcion || '', etiqueta: p.etiqueta || '' }); };
  const foto = ed ? (linkFoto(ed.img_web) || ed.img) : '';
  async function guardar(siguiente) {
    setGuardando(true);
    const r = await A('producto', { ...ed, img_web: linkFoto(ed.img_web) });
    setGuardando(false); avisar(r.msg, !r.ok);
    if (!r.ok) return;
    const L = d?.productos || [], i = L.findIndex((x) => x.id === ed.id);
    await cargar(q, filtro);
    if (siguiente && L[i + 1]) abrir(L[i + 1]); else setEd(null);
  }
  async function pegar() {
    try { const t = await navigator.clipboard.readText(); if (t) { setFotoMal(false); setEd((e) => ({ ...e, img_web: linkFoto(t) })); } } catch { avisar('Tocá el campo y pegá con Ctrl+V.', true); }
  }
  return (<>
    <div className="aviso ok" style={{ marginTop: 0 }}>Precios, ofertas y stock vienen de tu <b>caja</b> (se actualizan solos cada hora). Acá le das a cada producto lo que lo hace vender: <b>foto, descripción, etiqueta y lugar destacado</b>.</div>
    {d && <div className="kps" style={{ margin: '12px 0' }}>
      <div className="kp"><div className="l">En la web</div><div className="v">{d.total}</div></div>
      <div className="kp" style={{ cursor: 'pointer' }} onClick={() => setFiltro('sinFoto')}><div className="l">Sin foto</div><div className="v" style={{ color: d.sinFoto ? 'var(--gold)' : 'var(--ok)' }}>{d.sinFoto}</div><div className="s">tocá para verlos</div></div>
      <div className="kp"><div className="l">Con foto</div><div className="v" style={{ color: 'var(--ok)' }}>{d.total - d.sinFoto}</div><div className="s">{d.total ? Math.round((d.total - d.sinFoto) / d.total * 100) : 0}% del catálogo</div></div>
      <div className="kp"><div className="l">Mostrando</div><div className="v">{d.productos.length}</div></div>
    </div>}
    <input className="inp" placeholder="Buscar por nombre, código o categoría…" value={q} onChange={(e) => setQ(e.target.value)} />
    <div className="chips" style={{ marginTop: 10 }}>{FILTROS_PROD.map(([k, t]) => <button key={k} className={'chip' + (filtro === k ? ' on' : '')} onClick={() => setFiltro(k)}>{t}</button>)}</div>
    {d?.productos.map((p) => (<div className="pcard" key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10, opacity: p.oculto ? .5 : 1, cursor: 'pointer' }} onClick={() => abrir(p)}>
      <div className="lin" style={{ border: 0, padding: 0 }}>{p.img_web || p.img ? <div className="th"><img src={p.img_web || p.img} alt="" referrerPolicy="no-referrer" /></div> : <div className="th nofoto">📷</div>}</div>
      <div style={{ flex: 1, minWidth: 0 }}><b>{p.nombre}</b>{p.etiqueta && <span className="etq" style={{ position: 'static', marginLeft: 6, padding: '3px 7px', fontSize: 9 }}>{p.etiqueta}</span>}
        <div className="muted">{p.categoria} · {plata(p.oferta || p.precio)}{p.unidad === 'kg' ? '/kg' : ''} · stock {p.stock === null ? '—' : Math.round(p.stock * 100) / 100}{p.oculto ? ' · OCULTO' : ''}{p.destacado ? ' · ⭐' : ''}{!p.descripcion ? ' · sin descripción' : ''}</div></div>
      <span className="btn o" style={{ padding: '9px 12px' }}>Editar</span></div>))}

    {ed && <div className="modal on" style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,.7)' }}><div className="box" style={{ textAlign: 'left', maxWidth: 560 }}>
      <button className="x" onClick={() => setEd(null)}><Ic n="x" cl="s" /></button>
      <h3 style={{ fontSize: 18, paddingRight: 40 }}>{ed.nombre}</h3>
      <div className="muted">{ed.categoria} · {plata(ed.oferta || ed.precio)}{ed.unidad === 'kg' ? '/kg' : ''} · código {ed.id}</div>

      <div className="vprev">
        <div className="ph">{foto && !fotoMal ? <img src={foto} alt="" referrerPolicy="no-referrer" onError={() => setFotoMal(true)} onLoad={() => setFotoMal(false)} /> : <span>{fotoMal ? '⚠️ Ese link no es una imagen' : '📷 Sin foto'}</span>}
          {ed.etiqueta && <span className="etq">{ed.etiqueta}</span>}</div>
        <div className="muted" style={{ fontSize: 12 }}>Así se ve en la tienda</div>
      </div>

      <label className="campo">Foto (pegá el link de la imagen)</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="inp" placeholder="https://…jpg" value={ed.img_web} onChange={(e) => { setFotoMal(false); setEd({ ...ed, img_web: linkFoto(e.target.value) }); }} onPaste={(e) => { const t = e.clipboardData.getData('text'); if (t) { e.preventDefault(); setFotoMal(false); setEd({ ...ed, img_web: linkFoto(t) }); } }} />
        <button className="btn o" style={{ padding: '0 14px' }} onClick={pegar} title="Pegar lo que copiaste">📋</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        <a className="btn o" style={{ padding: '9px 12px', fontSize: 11.5 }} href={'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(ed.nombre + ' producto')} target="_blank" rel="noopener">🔎 Buscar foto en Google</a>
        {ed.img_web && <button className="btn o" style={{ padding: '9px 12px', fontSize: 11.5 }} onClick={() => setEd({ ...ed, img_web: '' })}>Quitar foto</button>}
      </div>
      <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>En Google: abrí la imagen → clic derecho → <b>“Copiar dirección de imagen”</b> → pegala acá.</div>

      <label className="campo">Etiqueta sobre la foto</label>
      <div className="chips" style={{ margin: 0, flexWrap: 'wrap' }}>
        <button className={'chip' + (!ed.etiqueta ? ' on' : '')} onClick={() => setEd({ ...ed, etiqueta: '' })}>Ninguna</button>
        {ETIQUETAS.map((t) => <button key={t} className={'chip' + (ed.etiqueta === t ? ' on' : '')} onClick={() => setEd({ ...ed, etiqueta: t })}>{t}</button>)}
      </div>
      <input className="inp" style={{ marginTop: 8 }} placeholder="…o escribí la tuya (máx. 22 letras)" maxLength={22} value={ETIQUETAS.includes(ed.etiqueta) ? '' : ed.etiqueta} onChange={(e) => setEd({ ...ed, etiqueta: e.target.value.toUpperCase() })} />

      <label className="campo" style={{ display: 'flex', justifyContent: 'space-between' }}><span>Descripción (vende y ayuda a aparecer en Google)</span><span>{(ed.descripcion || '').length}/1500</span></label>
      <textarea className="inp" rows={6} maxLength={1500} value={ed.descripcion} onChange={(e) => setEd({ ...ed, descripcion: e.target.value })} placeholder="Contá para qué sirve, por qué está bueno, cómo se usa…" />
      {!ed.descripcion && <button className="btn o" style={{ padding: '9px 12px', fontSize: 11.5, marginTop: 8 }} onClick={() => setEd({ ...ed, descripcion: plantillaDesc(ed) })}>✨ Usar texto base</button>}

      <label className="chk"><input type="checkbox" checked={!!ed.destacado} onChange={(e) => setEd({ ...ed, destacado: e.target.checked })} /> ⭐ Destacarlo en “Los más elegidos” del inicio</label>
      <label className="chk"><input type="checkbox" checked={!!ed.oculto} onChange={(e) => setEd({ ...ed, oculto: e.target.checked })} /> 🙈 Ocultarlo de la web</label>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button className="btn r" style={{ flex: 1 }} disabled={guardando} onClick={() => guardar(false)}>{guardando ? 'Guardando…' : 'Guardar'}</button>
        <button className="btn o" style={{ flex: 1 }} disabled={guardando} onClick={() => guardar(true)}>Guardar y siguiente →</button>
      </div>
      <a className="linkito" href={'/producto/' + ed.slug} target="_blank" rel="noopener">Ver en la tienda ↗</a>
    </div></div>}
  </>);
}

/* ------------------------------------------------------------------ revendedores */
function Vendedores({ avisar }) {
  const [d, setD] = useState(null), [nuevo, setNuevo] = useState({ nombre: '', telefono: '' }), [ver, setVer] = useState(null), [peds, setPeds] = useState([]);
  const cargar = useCallback(async () => { const r = await A('vendedores'); if (r.ok) setD(r); }, []);
  useEffect(() => { cargar(); }, [cargar]);
  const sitio = typeof window !== 'undefined' ? window.location.origin : '';
  const link = (v) => sitio + '/?ref=' + v.codigo;
  const copiar = async (t) => { try { await navigator.clipboard.writeText(t); avisar('Link copiado.'); } catch { avisar('No pude copiar: mantené apretado el link.', true); } };
  const bienvenida = (v) => `¡Hola ${v.nombre.split(' ')[0]}! 🙌 Ya sos revendedor de Américas Drugstore.\n\nTu link para compartir:\n${link(v)}\n\n` +
    `Cada pedido que hagan desde tu link y se entregue, te llevás el ${d.pct}% de la ganancia. Te pagamos todas las semanas.\n\n` +
    `Tip: mandalo a tus grupos y estados de WhatsApp con las ofertas de la semana 🔥`;
  const resumen = (v) => `¡Hola ${v.nombre.split(' ')[0]}! 📊 Tu resumen en Américas Drugstore:\n\n` +
    `• Pedidos: ${v.pedidos}\n• Ventas entregadas: ${plata(v.vendido)}\n• Comisión a cobrar: ${plata(v.pendiente)}\n• En camino (se suma al entregar): ${plata(v.enCurso)}\n• Ya cobraste: ${plata(v.pagado)}\n\n¡Seguí así! Tu link: ${link(v)}`;
  if (!d) return <div className="vacio">Cargando…</div>;
  const tot = d.vendedores.reduce((a, v) => ({ pend: a.pend + v.pendiente, sem: a.sem + v.semana, vend: a.vend + v.vendido }), { pend: 0, sem: 0, vend: 0 });
  return (<>
    <div className="aviso ok" style={{ marginTop: 0 }}>Cada revendedor tiene <b>su link</b>. Quien entra por ahí y compra queda asociado a él durante 30 días. Gana el <b>{d.pct}% de la ganancia</b> de cada pedido <b>entregado</b> (el % se cambia en Ajustes). Les pagás <b>una vez por semana</b>.</div>
    <div className="kps" style={{ margin: '12px 0' }}>
      <div className="kp hero"><div className="l">A pagar ahora</div><div className="v">{plata(tot.pend)}</div><div className="s">pedidos entregados</div></div>
      <div className="kp"><div className="l">Comisiones últimos 7 días</div><div className="v">{plata(tot.sem)}</div></div>
      <div className="kp"><div className="l">Vendido por revendedores</div><div className="v">{plata(tot.vend)}</div></div>
      <div className="kp"><div className="l">Revendedores</div><div className="v">{d.vendedores.filter((v) => v.activo).length}</div></div>
    </div>

    <div className="pcard"><b>➕ Sumar revendedor</b>
      <div className="g2" style={{ marginTop: 4 }}>
        <div><label className="campo">Nombre</label><input className="inp" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} placeholder="Ej. Pedro Gómez" /></div>
        <div><label className="campo">WhatsApp</label><input className="inp" type="tel" value={nuevo.telefono} onChange={(e) => setNuevo({ ...nuevo, telefono: e.target.value })} placeholder="343 4123456" /></div>
      </div>
      <button className="btn r blk" style={{ marginTop: 12 }} onClick={async () => { const r = await A('guardarVendedor', nuevo); avisar(r.msg, !r.ok); if (r.ok) { setD(r); setNuevo({ nombre: '', telefono: '' }); } }}>Crear y generar su link</button>
    </div>

    {d.vendedores.map((v) => (<div className="pcard" key={v.codigo} style={{ opacity: v.activo ? 1 : .55 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div><b style={{ font: '900 17px/1.1 var(--hf)' }}>{v.nombre}</b><div className="muted">código <b>{v.codigo}</b>{v.telefono ? ' · +' + v.telefono : ''}{!v.activo ? ' · PAUSADO' : ''}</div></div>
        <div style={{ textAlign: 'right' }}><div className="muted">a pagar</div><b style={{ font: '900 20px/1 var(--hf)', color: v.pendiente ? 'var(--gold)' : 'var(--txt)' }}>{plata(v.pendiente)}</b></div>
      </div>
      <div className="g4" style={{ marginTop: 10 }}>
        <div className="kp"><div className="l">Pedidos</div><div className="v" style={{ fontSize: 20 }}>{v.pedidos}</div></div>
        <div className="kp"><div className="l">Vendido (entregado)</div><div className="v" style={{ fontSize: 20 }}>{plata(v.vendido)}</div></div>
        <div className="kp"><div className="l">En curso</div><div className="v" style={{ fontSize: 20 }}>{plata(v.enCurso)}</div></div>
        <div className="kp"><div className="l">Ya cobrado</div><div className="v" style={{ fontSize: 20 }}>{plata(v.pagado)}</div></div>
      </div>
      {v.sinCosto > 0 && <div className="aviso y">⚠️ {v.sinCosto} producto(s) vendidos no tienen <b>costo</b> cargado en la caja (columna J): no suman comisión. Cargalo en la caja y la próxima venta se calcula bien.</div>}
      <div className="inp" style={{ marginTop: 10, fontSize: 13, wordBreak: 'break-all', cursor: 'pointer' }} onClick={() => copiar(link(v))}>🔗 {link(v)}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button className="btn o" style={{ padding: '9px 12px', fontSize: 11.5 }} onClick={() => copiar(link(v))}>Copiar link</button>
        {v.telefono && <button className="btn w" style={{ padding: '9px 12px', fontSize: 11.5 }} onClick={() => wa(v.telefono, bienvenida(v))}>Mandarle su link</button>}
        {v.telefono && <button className="btn o" style={{ padding: '9px 12px', fontSize: 11.5 }} onClick={() => wa(v.telefono, resumen(v))}>Mandar resumen</button>}
        {v.pendiente > 0 && <button className="btn r" style={{ padding: '9px 12px', fontSize: 11.5 }} onClick={async () => { if (!window.confirm('¿Ya le pagaste ' + plata(v.pendiente) + ' a ' + v.nombre + '? Se marca como pagado.')) return; const r = await A('pagarVendedor', { codigo: v.codigo }); avisar(r.msg, !r.ok); if (r.ok) setD(r); }}>✅ Marcar pagado {plata(v.pendiente)}</button>}
        <button className="btn o" style={{ padding: '9px 12px', fontSize: 11.5 }} onClick={async () => { if (ver === v.codigo) { setVer(null); return; } const r = await A('pedidosVendedor', { codigo: v.codigo }); setPeds(r.pedidos || []); setVer(v.codigo); }}>{ver === v.codigo ? 'Ocultar pedidos' : 'Ver pedidos'}</button>
        <button className="btn o" style={{ padding: '9px 12px', fontSize: 11.5 }} onClick={async () => { const r = await A('guardarVendedor', { ...v, activo: !v.activo }); avisar(r.msg, !r.ok); if (r.ok) setD(r); }}>{v.activo ? 'Pausar' : 'Reactivar'}</button>
      </div>
      {ver === v.codigo && <div style={{ marginTop: 10 }}>{!peds.length ? <div className="muted">Todavía no tiene pedidos.</div> : peds.map((p) => (
        <div className="fx" key={p.nro}><span>{p.nro} · {hora(p.fecha)} · {p.cliente} · {p.estado}</span><span>{plata(p.total)} → <b>{plata(p.comision)}</b>{p.comisionPagada ? ' ✅' : ''}</span></div>))}</div>}
    </div>))}
  </>);
}

/* ------------------------------------------------------------------ ruleta */
function Ruleta({ avisar }) {
  const [d, setD] = useState(null), [cats, setCats] = useState([]);
  useEffect(() => { A('premios').then((r) => r.ok && setD(r)); }, []);
  useEffect(() => { (async () => { const r = await A('categorias'); if (r.ok) setCats(r.categorias); })(); }, []);
  if (!d) return <div className="sk" style={{ height: 300 }} />;
  const P = d.premios, tot = P.reduce((a, x) => a + (x.activo ? Number(x.peso) || 0 : 0), 0);
  const set = (i, k, v) => { const L = [...P]; L[i] = { ...L[i], [k]: v }; setD({ ...d, premios: L }); };
  return (<>
    <div className="kps"><Kpi t="Giros (30 días)" v={d.giros} /><Kpi t="Premios usados" v={d.usados} /></div>
    <div className="muted" style={{ margin: '12px 0' }}>Tipos: <b>Descuento %</b> (valor = %), <b>Descuento $</b>, <b>Envío gratis</b>, <b>Regalo</b>, <b>Otra vez</b> (gira de nuevo) y <b>Sin premio</b>. “Chance”: más alto, más seguido sale. Si elegís una categoría, el descuento es solo para esos productos.</div>
    {P.map((x, i) => (<div className="pcard" key={i} style={{ opacity: x.activo ? 1 : .55 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input className="inp" style={{ fontWeight: 800 }} maxLength={24} value={x.texto} onChange={(e) => set(i, 'texto', e.target.value)} placeholder="Texto en la ruleta" />
        <span className="estado si" style={{ margin: 0, flex: 'none' }}>{x.activo && tot ? Math.round((Number(x.peso) || 0) / tot * 100) + '%' : 'pausa'}</span>
        <input type="checkbox" checked={x.activo} onChange={(e) => set(i, 'activo', e.target.checked)} title="Activo" />
        <button className="x" style={{ margin: 0 }} onClick={() => setD({ ...d, premios: P.filter((_, j) => j !== i) })}><Ic n="x" cl="s" /></button></div>
      <div className="g4">
        <div><label className="campo">Tipo</label><select className="inp" value={x.tipo} onChange={(e) => set(i, 'tipo', e.target.value)}>{d.tipos.map((t) => <option key={t}>{t}</option>)}</select></div>
        <div><label className="campo">Valor</label><input className="inp" type="number" value={x.valor} onChange={(e) => set(i, 'valor', e.target.value)} /></div>
        <div><label className="campo">Chance</label><input className="inp" type="number" value={x.peso} onChange={(e) => set(i, 'peso', e.target.value)} /></div>
        <div><label className="campo">Compra mín. $</label><input className="inp" type="number" value={x.minimo} onChange={(e) => set(i, 'minimo', e.target.value)} /></div>
      </div>
      {/Descuento/.test(x.tipo) && <><label className="campo">Solo en la categoría</label><select className="inp" value={x.categoria} onChange={(e) => set(i, 'categoria', e.target.value)}><option value="">Toda la tienda</option>{cats.map((c) => <option key={c}>{c}</option>)}</select></>}
    </div>))}
    <button className="btn o" onClick={() => setD({ ...d, premios: [...P, { texto: '', tipo: 'Descuento %', valor: 5, peso: 10, minimo: 0, categoria: '', activo: true }] })}>+ Agregar premio</button>
    <button className="btn r blk" style={{ marginTop: 14 }} onClick={async () => { const r = await A('guardarPremios', { premios: P }); avisar(r.msg, !r.ok); if (r.ok) setD(r); }}>Guardar ruleta</button>
  </>);
}

/* ------------------------------------------------------------------ avisos */
function Avisos() {
  const [L, setL] = useState(null), [link, setLink] = useState('');
  useEffect(() => { A('avisos').then((r) => r.ok && setL(r.avisos)); setLink(location.origin); }, []);
  if (!L) return <div className="sk" style={{ height: 200 }} />;
  if (!L.length) return <div className="pcard muted">Todavía nadie pidió avisos. En la tienda, los productos sin stock tienen el botón “Avisame cuando ingrese”.</div>;
  return L.map((a) => (<div className="pcard" key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'center', opacity: a.estado === 'Avisado' ? .5 : 1 }}>
    <div style={{ flex: 1 }}><b>{a.producto}</b><div className="muted">{a.cliente || 'Cliente'} · +{a.tel} · {hora(a.fecha)}{a.estado === 'Avisado' ? ' · avisado ✔' : ''}</div></div>
    <button className="btn w" style={{ padding: '10px 13px' }} onClick={async () => { wa(a.tel, `¡Hola${a.cliente ? ' ' + a.cliente.split(' ')[0] : ''}! Te aviso que ya ingresó ${a.producto} 🙌 Lo podés pedir acá: ${link}`); const r = await A('aviso', { id: a.id, estado: 'Avisado' }); if (r.ok) setL(r.avisos); }}><Ic n="wa" cl="s" /></button></div>));
}

/* ------------------------------------------------------------------ configuración */
const CAMPOS = [
  ['Negocio', [['negocio', 'Nombre del negocio'], ['direccion', 'Dirección'], ['ciudad', 'Ciudad'], ['whatsapp', 'WhatsApp del negocio (con característica)'], ['horario', 'Horario'], ['instagram', 'Instagram'], ['mapaLat', 'Latitud en el mapa (opcional)'], ['mapaLng', 'Longitud en el mapa (opcional)']]],
  ['Pedidos', [['abierta', 'Tienda abierta (tomando pedidos)', 'b'], ['msgCerrada', 'Mensaje cuando está cerrada'], ['minimo', 'Pedido mínimo ($)', 'n'], ['pagos', 'Medios de pago (separados por coma)'], ['descPago', 'Descuento por medio de pago (ej.: Efectivo 10%, Transferencia 10%)'], ['alias', 'Alias / CBU para transferencias'], ['sinStock', 'Productos sin stock', 's']]],
  ['Envíos', [['envio', 'Hacemos envíos', 'b'], ['costoEnvio', 'Costo del envío ($)', 'n'], ['envioGratisDesde', 'Envío gratis desde ($, 0 = nunca)', 'n'], ['zona', 'Zona de envío']]],
  ['Textos de la página', [['destacado', 'Título grande de la portada'], ['bajada', 'Texto debajo del título', 't'], ['servicios', 'Servicios en el local (separados por coma)'], ['nosotros', 'Sobre nosotros', 't']]],
  ['Revendedores', [['comisionPct', 'Comisión: % de la ganancia de cada pedido entregado', 'n']]],
  ['Ruleta', [['ruleta', 'Ruleta activa', 'b'], ['ruletaAlEntrar', 'Mostrarla sola al entrar (una vez cada 3 días)', 'b'], ['diasGiro', 'Un giro cada (días)', 'n'], ['validez', 'El premio vale (días)', 'n']]],
  ['Avisos', [['callmebot', 'Aviso automático a tu WhatsApp: apikey de CallMeBot (opcional)']]]
];
function Config({ avisar }) {
  const [c, setC] = useState(null);
  useEffect(() => { A('config').then((r) => r.ok && setC(r.config)); }, []);
  if (!c) return <div className="sk" style={{ height: 300 }} />;
  const set = (k, v) => setC({ ...c, [k]: v });
  return (<>
    {CAMPOS.map(([t, L]) => (<div className="panel" key={t} style={{ marginBottom: 12 }}><h2 className="h" style={{ fontSize: 16, margin: 0 }}>{t}</h2>
      {L.map(([k, lab, tipo]) => tipo === 'b' ? <label key={k} className="chk"><input type="checkbox" checked={!!c[k]} onChange={(e) => set(k, e.target.checked)} /> {lab}</label>
        : tipo === 's' ? <div key={k}><label className="campo">{lab}</label><select className="inp" value={c[k]} onChange={(e) => set(k, e.target.value)}><option value="encargar">Se muestran “A pedido” y se pueden encargar</option><option value="ocultar">No se muestran</option><option value="ignorar">Se venden igual (si tu stock no está al día)</option></select></div>
          : tipo === 't' ? <div key={k}><label className="campo">{lab}</label><textarea className="inp" rows={3} value={c[k]} onChange={(e) => set(k, e.target.value)} /></div>
            : <div key={k}><label className="campo">{lab}</label><input className="inp" type={tipo === 'n' ? 'number' : 'text'} value={c[k] ?? ''} onChange={(e) => set(k, e.target.value)} /></div>)}
      {t === 'Avisos' && <div className="muted" style={{ marginTop: 6 }}>Agendá el +34 644 71 81 99, mandale “I allow callmebot to send me messages” y te responde con tu apikey. Pegala acá: cada pedido te llega solo a tu WhatsApp. Además, este panel suena cuando entra un pedido si lo tenés abierto.</div>}
    </div>))}
    <button className="btn r blk" onClick={async () => { const r = await A('guardarConfig', { config: c }); avisar(r.msg, !r.ok); if (r.ok) setC(r.config); }}>Guardar</button>
  </>);
}
