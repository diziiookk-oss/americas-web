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

export default function Panel() {
  const [log, setLog] = useState(null), [tab, setTab] = useState('pedidos'), [toast, setToast] = useState(null), [nuevos, setNuevos] = useState(0);
  const avisar = useCallback((t, mal) => { setToast({ t, mal }); setTimeout(() => setToast(null), 2800); }, []);
  useEffect(() => { A('pedidos').then((r) => setLog(!!r.ok)); const h = () => setLog(false); window.addEventListener('ad-login', h); return () => window.removeEventListener('ad-login', h); }, []);
  if (log === null) return <div className="vacio">Cargando…</div>;
  if (!log) return <Login onOk={() => setLog(true)} />;
  const T = [['pedidos', 'receipt', 'Pedidos'], ['estadisticas', 'grid', 'Estadísticas'], ['productos', 'bag', 'Productos'], ['ruleta', 'wheel', 'Ruleta'], ['avisos', 'bell', 'Avisos'], ['config', 'shop', 'Ajustes']];
  return (<div className="adm">
    <div className="admtop"><a href="/" target="_blank" rel="noopener"><Logo alto={34} /></a><span className="kicker" style={{ marginLeft: 6 }}>Panel</span>
      <button className="btn o" style={{ marginLeft: 'auto', padding: '9px 13px' }} onClick={async () => { await A('logout'); setLog(false); }}>Salir</button></div>
    <nav className="tabs">{T.map(([k, i, t]) => <button key={k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)} style={{ position: 'relative' }}><Ic n={i} />{t}{k === 'pedidos' && nuevos > 0 && <b className="nb">{nuevos}</b>}</button>)}</nav>
    {tab === 'pedidos' && <Pedidos avisar={avisar} setNuevos={setNuevos} />}
    {tab === 'estadisticas' && <Estadisticas />}
    {tab === 'productos' && <Productos avisar={avisar} />}
    {tab === 'ruleta' && <Ruleta avisar={avisar} />}
    {tab === 'avisos' && <Avisos />}
    {tab === 'config' && <Config avisar={avisar} />}
    {toast && <div className={'toast on' + (toast.mal ? ' bad' : '')}>{toast.t}</div>}
  </div>);
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
  const cambiar = async (p, e) => { const r = await A('estado', { nro: p.nro, estado: e }); if (!r.ok) return avisar(r.msg, true); setD(r); setNuevos(r.nuevos); ult.current = r.nuevos;
    if (e !== 'Nuevo' && confirm('¿Le avisás a ' + p.cliente + ' por WhatsApp?\n\n' + msgEstado(p, e))) wa(p.tel, msgEstado(p, e)); };
  return (<>
    <div className="chips">{FILTROS.map((x) => { const n = d.pedidos.filter((p) => x === 'Todos' || (x === 'Activos' ? act(p) : p.estado === x)).length; return <button key={x} className={'chip' + (f === x ? ' on' : '')} onClick={() => setF(x)}>{x}{n ? ' · ' + n : ''}</button>; })}</div>
    {!d.pedidos.length && <div className="pcard" style={{ textAlign: 'center' }}><div className="muted">Todavía no llegaron pedidos. Compartí el link de la tienda 😉</div></div>}
    {L.map((p) => (<div className="pcard" key={p.nro} style={{ borderLeft: '4px solid ' + ({ Nuevo: 'var(--red)', Preparando: 'var(--gold)', Listo: '#4da3ff', 'En camino': '#4da3ff', Entregado: 'var(--ok)', Cancelado: '#555' }[p.estado]) }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><div><b style={{ font: '900 17px/1.1 var(--hf)' }}>{p.nro} · {p.cliente}</b><div className="muted">{hora(p.fecha)} · {p.pago} · +{p.tel}</div></div>
        <div style={{ textAlign: 'right' }}><b style={{ font: '900 19px/1 var(--hf)' }}>{plata(p.total)}</b><div><span className={'estado ' + (p.estado === 'Nuevo' ? 'no' : 'si')} style={{ margin: '6px 0 0' }}><i />{p.estado}</span></div></div></div>
      <div style={{ marginTop: 6 }}>{p.entrega === 'Envío' ? <>🛵 <b>Envío</b> a {p.dir}</> : <>🏪 <b>Retira</b> en el local</>}</div>
      <div style={{ whiteSpace: 'pre-line', fontSize: 13.5, background: '#111114', borderRadius: 12, padding: '9px 11px', margin: '8px 0', color: 'var(--txt2)' }}>{p.detalle}</div>
      {(p.descuento > 0 || p.envio > 0) && <div className="muted">Subtotal {plata(p.subtotal)}{p.descPremio ? ' · premio −' + plata(p.descPremio) : ''}{p.descPago ? ' · desc. pago −' + plata(p.descPago) : ''}{p.envio ? ' · envío ' + plata(p.envio) : ''}</div>}
      {p.premio && <div className="muted">🎁 {p.premio}</div>}{p.nota && <div className="aviso y">📝 {p.nota}</div>}{p.ticket && <div className="muted">Cobrado en la caja · ticket {p.ticket}</div>}
      <div className="chips" style={{ margin: '10px 0 0' }}>{d.estados.filter((e) => e !== 'En camino' || p.entrega === 'Envío').map((e) => <button key={e} className={'chip' + (p.estado === e ? ' on' : '')} onClick={() => cambiar(p, e)}>{e}</button>)}</div>
      <button className="btn w" style={{ marginTop: 10, padding: '10px 14px' }} onClick={() => wa(p.tel, msgEstado(p, p.estado))}><Ic n="wa" cl="s" /> Escribirle</button>
    </div>))}
  </>);
}

/* ------------------------------------------------------------------ estadísticas */
function Kpi({ t, v, sub, ant, din, hero }) {
  const pct = ant ? Math.round((v - ant) / ant * 100) : null;
  return <div className={'kp' + (hero ? ' hero' : '')}><div className="l">{t}</div><div className="v">{din ? plata(v) : String(v).replace('.', ',')}</div>
    {ant !== undefined && <div className="s" style={{ color: pct === null ? 'var(--mute)' : pct >= 0 ? 'var(--ok)' : 'var(--red2)' }}>{pct === null ? (v ? 'nuevo' : '') : (pct >= 0 ? '↗ +' : '↘ ') + pct + '% vs. período anterior'}</div>}
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
function Productos({ avisar }) {
  const [q, setQ] = useState(''), [d, setD] = useState(null), [ed, setEd] = useState(null);
  const cargar = useCallback(async (qq) => { const r = await A('productos', { q: qq }); if (r.ok) setD(r); }, []);
  useEffect(() => { const t = setTimeout(() => cargar(q), 300); return () => clearTimeout(t); }, [q, cargar]);
  return (<>
    <div className="aviso ok" style={{ marginTop: 0 }}>Los productos, precios, ofertas, fotos y stock vienen de tu <b>caja</b> (se actualizan solos cada hora o con el botón “Actualizar web” de la caja). Acá podés ocultar alguno, ponerle otra foto, una descripción o destacarlo.</div>
    {d && <div className="muted" style={{ margin: '10px 0' }}>{d.total} productos en la web · {d.sinFoto} sin foto</div>}
    <input className="inp" placeholder="Buscar producto…" value={q} onChange={(e) => setQ(e.target.value)} />
    {d?.productos.map((p) => (<div className="pcard" key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10, opacity: p.oculto ? .5 : 1 }}>
      <div className="lin" style={{ border: 0, padding: 0 }}>{p.img_web || p.img ? <div className="th"><img src={p.img_web || p.img} alt="" referrerPolicy="no-referrer" /></div> : <div className="th nofoto">—</div>}</div>
      <div style={{ flex: 1, minWidth: 0 }}><b>{p.nombre}</b><div className="muted">{p.categoria} · {plata(p.oferta || p.precio)}{p.unidad === 'kg' ? '/kg' : ''} · stock {p.stock === null ? '—' : p.stock}{p.oculto ? ' · OCULTO' : ''}{p.destacado ? ' · ⭐ destacado' : ''}</div></div>
      <button className="btn o" style={{ padding: '9px 12px' }} onClick={() => setEd({ ...p })}>Editar</button></div>))}
    {ed && <div className="modal on" style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,.6)' }}><div className="box" style={{ textAlign: 'left' }}>
      <button className="x" onClick={() => setEd(null)}><Ic n="x" cl="s" /></button><h3 style={{ fontSize: 18 }}>{ed.nombre}</h3>
      <label className="campo">Foto solo para la web (link https://…; vacío = la de la caja)</label><input className="inp" value={ed.img_web} onChange={(e) => setEd({ ...ed, img_web: e.target.value })} />
      <label className="campo">Descripción (opcional, ayuda a aparecer en Google)</label><textarea className="inp" rows={4} value={ed.descripcion} onChange={(e) => setEd({ ...ed, descripcion: e.target.value })} />
      <label className="chk"><input type="checkbox" checked={ed.destacado} onChange={(e) => setEd({ ...ed, destacado: e.target.checked })} /> Destacarlo en “Los más elegidos”</label>
      <label className="chk"><input type="checkbox" checked={ed.oculto} onChange={(e) => setEd({ ...ed, oculto: e.target.checked })} /> Ocultarlo de la web</label>
      <button className="btn r blk" style={{ marginTop: 14 }} onClick={async () => { const r = await A('producto', ed); avisar(r.msg, !r.ok); if (r.ok) { setEd(null); cargar(q); } }}>Guardar</button></div></div>}
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
