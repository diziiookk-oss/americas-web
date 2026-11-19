'use client';
// Todo lo interactivo de la tienda: carrito, ruleta, premio, avisos, estadísticas anónimas.
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Ic, iniciales, ESTRELLA } from './Icono';
import { plata, precioLinea, precioUnit, cantTxt, cuentas, pctPago, norm } from '@/lib/precios';

const Ctx = createContext(null);
export const useTienda = () => useContext(Ctx);

const K = { carrito: 'ad_carrito_v3', premio: 'ad_premio_v3', yo: 'ad_cliente_v1', dev: 'ad_dev', vis: 'ad_vis', mis: 'ad_mis_pedidos', ruleta: 'ad_ruleta_vista', ref: 'ad_ref' };
const REF_DIAS = 30;   // el cliente queda asociado al revendedor durante 30 días desde que entró por su link
const refActual = () => { const r = leer(K.ref, null); return r && r.c && Date.now() - r.t < REF_DIAS * 86400000 ? r.c : ''; };
const leer = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const azar = (n) => { const a = 'abcdefghijkmnpqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)]; return s; };
export const fechaCorta = (ms) => { const d = new Date(ms); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); };
const vibrar = (p) => { try { navigator.vibrate && navigator.vibrate(p || 15); } catch {} };

export async function api(accion, body) {
  const r = await fetch('/api/tienda/' + accion, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  try { return await r.json(); } catch { return { ok: false, msg: 'Sin conexión.' }; }
}

function confeti(n) {
  const c = ['#e3242b', '#ffc94a', '#ffffff', '#ff5a5f', '#25d366'];
  for (let i = 0; i < n; i++) {
    const d = document.createElement('div'); d.className = 'confeti';
    d.style.left = Math.random() * 100 + 'vw'; d.style.background = c[i % c.length];
    d.style.animationDuration = (1.7 + Math.random() * 1.8) + 's'; d.style.animationDelay = Math.random() * 0.4 + 's';
    document.body.appendChild(d); setTimeout(() => d.remove(), 4300);
  }
}

const NOMBRE_VISTA = { '/': 'inicio', '/productos': 'productos', '/ofertas': 'ofertas', '/mis-pedidos': 'pedidos', '/nosotros': 'nosotros' };

export function TiendaProvider({ cfg, premios, sugeridos = [], children }) {
  const [carrito, setCarrito] = useState({});
  const [premio, setPremio] = useState(null);
  const [hoja, setHoja] = useState(null);
  const [modal, setModal] = useState(null);
  const [toastS, setToastS] = useState(null);
  const [cargado, setCargado] = useState(false);
  const cola = useRef([]), ids = useRef({});
  const pathname = usePathname();

  const toast = useCallback((t, mal) => { setToastS({ t, mal, k: Date.now() }); }, []);
  useEffect(() => { if (!toastS) return; const x = setTimeout(() => setToastS(null), 2800); return () => clearTimeout(x); }, [toastS]);

  // arranque: lo guardado en el celular
  useEffect(() => {
    setCarrito(leer(K.carrito, {}) || {});
    try { const r = new URLSearchParams(window.location.search).get('ref'); if (r) { const c = r.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16); if (c) { guardar(K.ref, { c, t: Date.now() }); cola.current.push(['revendedor', c]); } } } catch {}
    let pz = leer(K.premio, null);
    if (pz && pz.vence && Date.now() > pz.vence + 86400000) { pz = null; guardar(K.premio, null); }
    setPremio(pz);
    ids.current.vis = leer(K.vis, null) || (() => { const v = azar(12); guardar(K.vis, v); return v; })();
    ids.current.dev = leer(K.dev, null) || (() => { const v = 'd-' + azar(14); guardar(K.dev, v); return v; })();
    try { let s = sessionStorage.getItem('ad_ses'); if (!s) { s = azar(10); sessionStorage.setItem('ad_ses', s); cola.current.push(['visita', document.referrer ? String(document.referrer).slice(0, 80) : '']); } ids.current.ses = s; } catch { ids.current.ses = azar(10); }
    setCargado(true);
  }, []);
  useEffect(() => { if (cargado) guardar(K.carrito, carrito); }, [carrito, cargado]);
  useEffect(() => { const h = () => setCarrito({}); window.addEventListener('ad-vaciar', h); return () => window.removeEventListener('ad-vaciar', h); }, []);

  // estadísticas anónimas
  const mandar = useCallback(() => {
    if (!cola.current.length) return;
    const lote = { v: ids.current.vis, s: ids.current.ses, ev: cola.current.splice(0, 40) };
    const body = JSON.stringify(lote);
    try { if (navigator.sendBeacon) { navigator.sendBeacon('/api/tienda/eventos', new Blob([body], { type: 'application/json' })); return; } } catch {}
    fetch('/api/tienda/eventos', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
  }, []);
  const ev = useCallback((t, d) => { cola.current.push([t, String(d || '').slice(0, 100)]); if (cola.current.length >= 25) mandar(); }, [mandar]);
  useEffect(() => {
    const t = setInterval(mandar, 15000);
    const h = () => { if (document.visibilityState === 'hidden') mandar(); };
    document.addEventListener('visibilitychange', h);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', h); };
  }, [mandar]);
  useEffect(() => {
    if (!cargado) return;
    if (NOMBRE_VISTA[pathname]) ev('vista', NOMBRE_VISTA[pathname]);
    else if (pathname.startsWith('/categoria/')) ev('categoria', decodeURIComponent(pathname.split('/')[2] || ''));
  }, [pathname, cargado, ev]);

  // la ruleta aparece sola la primera vez
  useEffect(() => {
    if (!cargado || !cfg.ruleta || !cfg.ruletaAlEntrar || premios.length < 2 || pathname.startsWith('/admin')) return;
    const t = setTimeout(() => {
      if (leer(K.premio, null)) return;
      const visto = leer(K.ruleta, 0); if (visto && Date.now() - visto < 3 * 86400000) return;
      guardar(K.ruleta, Date.now()); setModal((m) => m || 'ruleta'); ev('ruleta', 'abrir (sola)');
    }, 3500);
    return () => clearTimeout(t);
  }, [cargado]); // eslint-disable-line

  const fijarCant = useCallback((p, c, aviso) => {
    setCarrito((C) => {
      const n = { ...C };
      if (!(c > 0)) delete n[p.id]; else { if (!C[p.id]) ev('carrito', p.nombre); n[p.id] = { p, c }; }
      return n;
    });
    if (c > 0) { vibrar(); const b = document.getElementById('cartBtn'); if (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); } }
    if (aviso) toast(aviso);
  }, [ev, toast]);
  const sumar = useCallback((p, d) => {
    const c = (carrito[p.id]?.c || 0) + d;
    if (p.hay && p.max !== null && c > p.max && !cfg.encargar && d > 0) { toast('Tenemos ' + p.max + ' disponibles.', true); return; }
    fijarCant(p, c, p.hay && p.max !== null && c > p.max && d > 0 ? 'Hay ' + p.max + ' en stock: el resto queda como encargo.' : '');
  }, [carrito, cfg.encargar, fijarCant, toast]);
  const fijarPremio = (pz) => { setPremio(pz); guardar(K.premio, pz); };

  const valor = { cfg, premios, sugeridos, carrito, premio, sumar, fijarCant, fijarPremio, ev, toast, abrirCarrito: () => setHoja({ tipo: 'carrito' }), abrirRuleta: () => { ev('ruleta', 'abrir'); setModal('ruleta'); },
    abrirAvisame: (p) => setHoja({ tipo: 'avisame', p }), cerrar: () => { setHoja(null); setModal(null); }, dispositivo: () => ids.current.dev, cargado };

  const lineas = Object.values(carrito);
  const n = lineas.length, sub = lineas.reduce((a, l) => a + precioLinea(l.p, l.c).total, 0), lista = lineas.reduce((a, l) => a + precioLinea(l.p, l.c).lista, 0);
  const abierto = !!hoja || !!modal;
  const barra = n > 0 && !abierto;

  return (
    <Ctx.Provider value={valor}>
      {children}
      <div className={'barra' + (barra ? ' on' : '')} onClick={() => setHoja({ tipo: 'carrito' })}><div className="t"><small>{n} {n === 1 ? 'producto' : 'productos'}{lista - sub > 0 ? ' · ahorrás ' + plata(lista - sub) : ''}{cfg.envio && cfg.envioGratisDesde > 0 ? (sub >= cfg.envioGratisDesde ? ' · 🛵 envío gratis' : ' · faltan ' + plata(cfg.envioGratisDesde - sub) + ' p/ envío gratis') : ''}</small><b>{plata(sub)}</b></div><div className="v">Ver pedido →</div></div>
      {cfg.whatsapp && <a className={'waf' + (barra ? ' up' : '')} href={'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent('¡Hola! Tengo una consulta 😊')} target="_blank" rel="noopener" aria-label="WhatsApp" onClick={() => ev('whatsapp', 'flotante')}><WaLogo /></a>}
      {premio?.codigo && <div className={'ppill' + (barra ? ' up' : '')} onClick={() => setModal('premio')}><div className="ic"><Ic n="gift" cl="s" /></div><span>Tu premio: <b>{premio.texto}</b>{premio.categoria ? ' en ' + premio.categoria : ''}{premio.vence ? ' · hasta el ' + fechaCorta(premio.vence) : ''}</span></div>}
      <div className={'velo' + (abierto ? ' on' : '')} onClick={() => { setHoja(null); setModal(null); }} />
      <div className={'hoja' + (hoja ? ' on' : '')}>{hoja && <><div className="asa" />
        {hoja.tipo === 'carrito' && <Carrito onListo={(r) => setHoja({ tipo: 'listo', r })} />}
        {hoja.tipo === 'avisame' && <Avisame p={hoja.p} />}
        {hoja.tipo === 'listo' && <PedidoListo r={hoja.r} />}</>}</div>
      <div className={'modal' + (modal ? ' on' : '')}><div className="box tema-oscuro">{modal === 'ruleta' && <Ruleta />}{modal === 'premio' && <VerPremio />}</div></div>
      {toastS && <div key={toastS.k} className={'toast on' + (toastS.mal ? ' bad' : '')}>{toastS.t}</div>}
    </Ctx.Provider>
  );
}

export function WaLogo({ size = 30 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="#fff" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.2z" /></svg>;
}

/* ------------------------------------------------------------------ carrito */
function Carrito({ onListo }) {
  const { cfg, carrito, premio, sumar, fijarPremio, cerrar, toast, abrirRuleta, premios, sugeridos, ev } = useTienda();
  const router = useRouter();
  const [fx, setFx] = useState(() => ({ nombre: '', tel: '', entrega: 'Retiro', direccion: '', pago: '', nota: '', ...(leer(K.yo, {}) || {}) }));
  const [enviando, setEnviando] = useState(false);
  // Club Américas: con el WhatsApp escrito, vemos cuántas compras lleva y si esta tiene premio
  const [club, setClub] = useState(null), [uniendo, setUniendo] = useState(false);
  const telClub = String(fx.tel || '').replace(/\D/g, '').slice(-10);
  useEffect(() => {
    if (telClub.length < 10) { setClub(null); return; }
    const t = setTimeout(() => api('club', { tel: telClub }).then((r) => setClub(r && r.ok && r.activo ? r : null)), 400);
    return () => clearTimeout(t);
  }, [telClub]);
  const pagos = cfg.pagos.length ? cfg.pagos : ['Efectivo'];
  const f = { ...fx, pago: pagos.includes(fx.pago) ? fx.pago : pagos[0], entrega: fx.entrega === 'Envío' && cfg.envio ? 'Envío' : 'Retiro' };
  const set = (k, v) => setFx((x) => ({ ...x, [k]: v }));
  const lineas = Object.values(carrito).map((l) => ({ ...l, enc: !l.p.hay || (l.p.max !== null && l.c > l.p.max) }));
  if (!lineas.length) return <><h3>Tu pedido<button className="x" onClick={cerrar}><Ic n="x" cl="s" /></button></h3><div className="vacio" style={{ padding: '30px 0' }}>Todavía no agregaste productos.<br /><br /><button className="btn r" onClick={() => { cerrar(); router.push('/productos'); }}>Ver productos</button></div></>;
  const C = cuentas({ lineas, premio: premio?.codigo ? premio : null, pago: f.pago, entrega: f.entrega, cfg, clubPct: club?.toca ? club.pct : 0 });
  const unirme = async () => {
    if (f.nombre.trim().length < 2) return toast('Escribí tu nombre arriba para sumarte.', true);
    setUniendo(true); const r = await api('unirme', { nombre: f.nombre, tel: f.tel }); setUniendo(false);
    toast(r.msg, !r.ok); if (r.ok) { const e = await api('club', { tel: telClub }); setClub(e && e.ok ? e : null); ev('club', 'unirme carrito'); }
  };
  const usar = premio?.codigo && !C.falta && !C.sinCat && !(C.envioGratis && f.entrega !== 'Envío');

  async function enviar() {
    if (f.nombre.trim().length < 2) return toast('Escribí tu nombre.', true);
    if (f.tel.replace(/\D/g, '').length < 8) return toast('Escribí tu WhatsApp con característica.', true);
    if (f.entrega === 'Envío' && f.direccion.trim().length < 4) return toast('Escribí la dirección.', true);
    guardar(K.yo, { nombre: f.nombre.trim(), tel: f.tel.trim(), entrega: f.entrega, direccion: f.direccion.trim(), pago: f.pago });
    setEnviando(true);
    const t = useTiendaIds();
    const r = await api('pedido', { nombre: f.nombre, tel: f.tel, entrega: f.entrega, direccion: f.direccion, pago: f.pago, nota: f.nota, visitante: t.vis, sesion: t.ses,
      items: lineas.map((l) => ({ id: l.p.id, cant: l.c })), codigoPremio: usar ? premio.codigo : '', ref: refActual() });
    setEnviando(false);
    if (!r || !r.ok) return toast(r?.msg || 'No se pudo enviar.', true);
    if (usar) fijarPremio(null);
    const mis = leer(K.mis, []) || []; mis.unshift({ nro: r.nro, tel: f.tel, t: Date.now() }); guardar(K.mis, mis.slice(0, 12));
    window.dispatchEvent(new Event('ad-vaciar'));
    onListo(r); confeti(80);
  }

  const meta = cfg.envio ? Number(cfg.envioGratisDesde) || 0 : 0;
  const sumables = (sugeridos || []).filter((p) => !carrito[p.id]).slice(0, 8);
  return (<>
    <h3>Tu pedido<button className="x" onClick={cerrar}><Ic n="x" cl="s" /></button></h3>
    {meta > 0 && <div className="meta">
      <div className="mt">{C.sub >= meta ? <>🎉 <b>¡Tenés envío gratis!</b></> : <>🛵 Te faltan <b>{plata(meta - C.sub)}</b> para el <b>envío gratis</b></>}</div>
      <div className="bar"><i style={{ width: Math.min(100, Math.round(C.sub / meta * 100)) + '%' }} /></div>
    </div>}
    {lineas.map((l) => (
      <div className="lin" key={l.p.id}>
        {l.p.img ? <div className="th"><img src={l.p.img} alt="" referrerPolicy="no-referrer" /></div> : <div className="th nofoto">{iniciales(l.p.nombre)}</div>}
        <div className="in"><b>{l.p.nombre}</b><small>{l.pr.tier && <span className="ok">−{l.pr.tier.pct}% online · </span>}{l.enc && <span className="y">⏳ encargo · </span>}{plata(precioUnit(l.p))}{l.p.unidad === 'kg' ? '/kg' : ' c/u'}</small></div>
        {l.p.unidad === 'kg'
          ? <div className="st"><span style={{ padding: '0 10px', cursor: 'pointer', minWidth: 64 }} onClick={() => { cerrar(); router.push('/producto/' + l.p.slug); }}>{cantTxt(l.p, l.c)} ✎</span></div>
          : <div className="st"><button onClick={() => sumar(l.p, -1)}>−</button><span>{l.c}</span><button onClick={() => sumar(l.p, 1)}>+</button></div>}
        <div className="tot">{plata(l.pr.total)}</div>
      </div>))}
    {sumables.length > 0 && <>
      <label className="campo" style={{ marginTop: 14 }}>⚡ Sumá a tu pedido <span style={{ color: 'var(--mute)', fontWeight: 500 }}>· lo que más se lleva junto</span></label>
      <div className="sumar">{sumables.map((p) => {
        const of = p.oferta != null && Number(p.oferta) > 0 && Number(p.oferta) < Number(p.precio);
        return (<button key={p.id} className="sm" onClick={() => { sumar(p, 1); ev('bump', p.nombre); }}>
          <div className="th"><img src={p.img} alt="" referrerPolicy="no-referrer" loading="lazy" /></div>
          <span className="nm">{p.nombre}</span>
          <span className="pz">{plata(precioUnit(p))}{of && <s>{plata(p.precio)}</s>}</span>
          <span className="mas">+ Sumar</span>
        </button>);
      })}</div>
    </>}
    <label className="campo">¿Cómo lo querés?</label>
    <div className="seg"><button className={f.entrega === 'Retiro' ? 'on' : ''} onClick={() => set('entrega', 'Retiro')}>🏪 Retiro en el local</button>{cfg.envio && <button className={f.entrega === 'Envío' ? 'on' : ''} onClick={() => set('entrega', 'Envío')}>🛵 Envío{cfg.zona ? ' (' + cfg.zona + ')' : ''}</button>}</div>
    <label className="campo">¿Cómo pagás?</label>
    <div className="seg">{pagos.map((m) => { const pc = pctPago(cfg.descPagoMap, m); return <button key={m} className={f.pago === m ? 'on' : ''} onClick={() => set('pago', m)}>{m}{pc ? <small>{pc}% OFF</small> : null}</button>; })}</div>
    <div className="tots">
      <div><span>Subtotal</span><b>{plata(C.sub)}</b></div>
      {C.ahorro > 0 && <div className="ok"><span>Ahorrás con ofertas online</span><span>{plata(C.ahorro)}</span></div>}
      {C.dPremio > 0 && <div className="ok"><span>🎁 {premio.texto}</span><span>−{plata(C.dPremio)}</span></div>}
      {C.dClub > 0 && <div className="ok"><span>⭐ Club Américas {club.pct}% OFF</span><span>−{plata(C.dClub)}</span></div>}
      {C.dPago > 0 && <div className="ok"><span>{C.pp}% OFF pagando con {f.pago.toLowerCase()}</span><span>−{plata(C.dPago)}</span></div>}
      {f.entrega === 'Envío' && <div><span>Envío</span><span>{C.envio ? plata(C.envio) : <b style={{ color: 'var(--ok)' }}>GRATIS</b>}</span></div>}
      <div className="T"><span>Total</span><span>{plata(C.total)}</span></div>
    </div>
    {premio?.codigo ? <>
      {C.sinCat && <div className="aviso y">🎁 Tu premio <b>{premio.texto}</b> es para productos de {premio.categoria}.</div>}
      {!C.sinCat && C.falta > 0 && <div className="aviso y">🎁 Tu premio <b>{premio.texto}</b> se activa sumando {plata(C.falta)} más.</div>}
      {C.regalo && <div className="aviso ok">🎁 ¡Con este pedido te llevás: <b>{C.regalo}</b>!</div>}
      {C.envioGratis && f.entrega !== 'Envío' && <div className="aviso y">🎁 Tu premio es envío gratis: elegí “Envío” para usarlo.</div>}
      <div className="muted" style={{ marginTop: 8 }}>Premio {premio.codigo} · <a style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => fijarPremio(null)}>no usarlo ahora</a></div>
    </> : cfg.ruleta && premios.length > 1 && <div className="aviso" style={{ cursor: 'pointer' }} onClick={abrirRuleta}>🎡 ¿Todavía no giraste la ruleta? <b>Tocá acá</b> y probá suerte antes de mandar el pedido.</div>}
    {lineas.some((l) => l.enc) && <div className="aviso y">⏳ Algunos productos son por encargo: te confirmamos por WhatsApp cuándo los tenemos.</div>}
    {cfg.minimo > 0 && C.sub < cfg.minimo && <div className="aviso">El pedido mínimo es {plata(cfg.minimo)}.</div>}
    <label className="campo">Tu nombre</label><input className="inp" autoComplete="name" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Nombre y apellido" />
    <label className="campo">Tu WhatsApp</label><input className="inp" type="tel" inputMode="tel" autoComplete="tel" value={f.tel} onChange={(e) => set('tel', e.target.value)} placeholder="Ej. 343 4123456" />
    {club && <div className={'clubc' + (club.toca ? ' toca' : '')}>
      {club.toca ? <><b>🎉 ¡Esta es tu compra con premio del Club!</b><span>Tenés <b>{club.pct}% OFF</b> en este pedido. Ya está descontado.</span></>
        : club.registrado ? <><b>⭐ Club Américas</b><span>Llevás {club.progreso} de {club.cada - 1} compras. {club.faltan > 0 ? 'Te faltan ' + club.faltan + ' para tu ' + club.pct + '% OFF.' : '¡La próxima tiene ' + club.pct + '% OFF!'}</span></>
        : <><b>⭐ Sumate gratis al Club Américas</b><span>Cada {club.cada} compras tenés <b>{club.pct}% OFF</b>. Solo con tu nombre y WhatsApp.</span></>}
      <div className="sellos">{Array.from({ length: club.cada }).map((_, i) => <i key={i} className={i < club.progreso ? 'on' : i === club.cada - 1 ? 'pz' : ''}>{i === club.cada - 1 ? '%' : i < club.progreso ? '✓' : ''}</i>)}</div>
      {!club.registrado && <button className="btn r" style={{ marginTop: 8, padding: '10px 14px', fontSize: 13 }} disabled={uniendo} onClick={unirme}>{uniendo ? 'Un momento…' : 'Sumarme al Club'}</button>}
    </div>}
    {f.entrega === 'Envío' && <><label className="campo">Dirección de entrega</label><input className="inp" autoComplete="street-address" value={f.direccion} onChange={(e) => set('direccion', e.target.value)} placeholder="Calle, número, piso / referencia" /></>}
    <label className="campo">¿Algo más? (opcional)</label><textarea className="inp" rows={2} value={f.nota} onChange={(e) => set('nota', e.target.value)} placeholder="Ej. que la banana no esté muy madura" />
    <button className="btn w blk" style={{ marginTop: 16 }} onClick={enviar} disabled={enviando || !cfg.abierta || (cfg.minimo > 0 && C.sub < cfg.minimo)}>
      {enviando ? <><div className="spin" /> Enviando…</> : <><Ic n="wa" cl="s" />{cfg.abierta ? 'Enviar pedido por WhatsApp' : 'Ahora no tomamos pedidos'}</>}
    </button>
    <div className="muted" style={{ textAlign: 'center', marginTop: 10 }}>Te confirmamos por WhatsApp. En productos por peso el total puede variar unos pesos.</div>
  </>);
}
function useTiendaIds() { return { vis: leer(K.vis, ''), ses: (() => { try { return sessionStorage.getItem('ad_ses') || ''; } catch { return ''; } })() }; }

function PedidoListo({ r }) {
  const { cerrar, ev, toast } = useTienda();
  const router = useRouter();
  const copiar = (t) => { try { navigator.clipboard.writeText(t).then(() => toast('Copiado')); } catch { toast('No se pudo copiar', true); } };
  return (<div className="listo">
    <div className="ck"><Ic n="check" cl="l" /></div><h3 style={{ justifyContent: 'center', marginBottom: 6 }}>¡Pedido {r.nro}!</h3>
    <div className="muted">Total {plata(r.total)}</div>
    {r.wa ? <><p style={{ margin: '16px 0 8px', color: 'var(--txt2)' }}>Último paso: <b style={{ color: '#fff' }}>tocá el botón verde</b> para mandarnos el pedido por WhatsApp.</p>
      <a className="btn w blk" href={r.wa} target="_blank" rel="noopener" onClick={() => { vibrar(25); ev('whatsapp', 'pedido ' + r.nro); }}><Ic n="wa" cl="s" /> Enviar por WhatsApp</a></> : <p>Ya lo recibimos. Te escribimos por WhatsApp.</p>}
    {r.alias && <div className="aviso ok" style={{ textAlign: 'left' }}>💳 Para transferir: <b>{r.alias}</b> <button className="btn o" style={{ padding: '7px 10px', fontSize: 11, marginLeft: 6 }} onClick={() => copiar(r.alias)}><Ic n="copy" cl="s" />Copiar</button><br /><small>Mandanos el comprobante por WhatsApp.</small></div>}
    <button className="btn o blk" style={{ marginTop: 10 }} onClick={() => { cerrar(); router.push('/mis-pedidos'); }}>Seguir mi pedido</button>
  </div>);
}

function Avisame({ p }) {
  const { cerrar, toast } = useTienda();
  const yo = leer(K.yo, {}) || {};
  const [n, setN] = useState(yo.nombre || ''), [t, setT] = useState(yo.tel || ''), [env, setEnv] = useState(false);
  async function ok() {
    if (t.replace(/\D/g, '').length < 8) return toast('Escribí tu WhatsApp con característica.', true);
    guardar(K.yo, { ...yo, nombre: n || yo.nombre, tel: t });
    setEnv(true); const r = await api('avisame', { producto: p.nombre, nombre: n, tel: t }); setEnv(false);
    if (!r.ok) return toast(r.msg || 'No se pudo.', true);
    cerrar(); toast(r.msg);
  }
  return (<>
    <h3><Ic n="bell" /> Avisame<button className="x" onClick={cerrar}><Ic n="x" cl="s" /></button></h3>
    <div className="muted">Te escribimos por WhatsApp cuando vuelva a ingresar <b style={{ color: '#fff' }}>{p.nombre}</b>.</div>
    <label className="campo">Tu nombre</label><input className="inp" value={n} onChange={(e) => setN(e.target.value)} />
    <label className="campo">Tu WhatsApp</label><input className="inp" type="tel" inputMode="tel" placeholder="Ej. 343 4123456" value={t} onChange={(e) => setT(e.target.value)} />
    <button className="btn r blk" style={{ marginTop: 16 }} disabled={env} onClick={ok}>Avisame</button>
  </>);
}

/* ------------------------------------------------------------------ ruleta */
function ruedaSVG(premios, R) {
  const n = premios.length, cx = R, cy = R, seg = 360 / n, SEG = ['#e3242b', '#141417', '#b5141a', '#232328'];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let s = '';
  for (let i = 0; i < n; i++) {
    const a0 = (i * seg - 90) * Math.PI / 180, a1 = ((i + 1) * seg - 90) * Math.PI / 180;
    let bg = SEG[i % 2 === 0 ? (i % 4 === 0 ? 0 : 2) : (i % 4 === 1 ? 1 : 3)]; if (n % 2 === 1 && i === n - 1) bg = '#3a3a42';
    s += `<path d="M${cx},${cy} L${(cx + R * Math.cos(a0)).toFixed(2)},${(cy + R * Math.sin(a0)).toFixed(2)} A${R},${R} 0 ${seg > 180 ? 1 : 0},1 ${(cx + R * Math.cos(a1)).toFixed(2)},${(cy + R * Math.sin(a1)).toFixed(2)} Z" fill="${bg}" stroke="#0a0a0b" stroke-width="2"/>`;
    const t = premios[i];
    let l1 = t.texto, l2 = t.categoria ? t.categoria : (/Descuento/.test(t.tipo) ? 'toda la tienda' : '');
    const pal = String(l1).split(' ');
    if (String(l1).length > 12 && pal.length > 1 && !l2) { l1 = pal.slice(0, Math.ceil(pal.length / 2)).join(' '); l2 = pal.slice(Math.ceil(pal.length / 2)).join(' '); }
    const fs = R * (n > 8 ? 0.085 : 0.11);
    s += `<g transform="rotate(${i * seg + seg / 2} ${cx} ${cy})"><text x="${cx}" y="${cy - R * 0.68}" text-anchor="middle" font-family="Montserrat, Arial Black, Arial, sans-serif" font-weight="900" font-size="${fs.toFixed(1)}" fill="#fff"><tspan x="${cx}" dy="0">${esc(String(l1).toUpperCase())}</tspan>${l2 ? `<tspan x="${cx}" dy="${(fs * 0.95).toFixed(1)}" font-size="${(fs * 0.55).toFixed(1)}" font-weight="700" fill="#ffd2d3">${esc(String(l2).toUpperCase().slice(0, 18))}</tspan>` : ''}</text></g>`;
  }
  let luces = ''; for (let k = 0; k < 24; k++) { const a = k * 15 * Math.PI / 180; luces += `<circle cx="${(cx + (R + 8) * Math.cos(a)).toFixed(1)}" cy="${(cy + (R + 8) * Math.sin(a)).toFixed(1)}" r="2.6" fill="${k % 2 ? '#fff' : '#ff5a5f'}"/>`; }
  return `<circle cx="${cx}" cy="${cy}" r="${R + 15}" fill="#e3242b"/><circle cx="${cx}" cy="${cy}" r="${R + 12}" fill="#0a0a0b"/>` + luces + s;
}

const rot = { v: 0 };
function Ruleta() {
  const { premios, cfg, cerrar, fijarPremio, ev, toast, dispositivo, carrito, abrirCarrito } = useTienda();
  const router = useRouter();
  const w = useRef(null);
  const [estado, setEstado] = useState('listo'); // listo | girando | resultado
  const [res, setRes] = useState(null);
  async function girar() {
    if (estado === 'girando') return;
    setEstado('girando'); ev('ruleta', 'girar');
    const el = w.current;
    el.style.transition = 'transform 1.2s cubic-bezier(.5,0,1,1)'; rot.v += 540; el.style.transform = `rotate(${rot.v}deg)`;
    const t0 = Date.now();
    const r = await api('girar', { dispositivo: dispositivo() });
    if (!r || !r.ok) { setEstado('listo'); toast(r?.msg || 'No se pudo girar.', true); return; }
    setTimeout(() => {
      const n = premios.length, seg = 360 / n, idx = r.idx >= 0 ? r.idx : 0;
      const obj = 360 - (idx * seg + seg / 2) + (Math.random() - 0.5) * seg * 0.6;
      rot.v = rot.v - (rot.v % 360) + 360 * 5 + ((obj % 360) + 360) % 360;
      el.style.transition = r.repetido ? 'transform 1.4s cubic-bezier(.12,.72,.08,1)' : 'transform 5.4s cubic-bezier(.12,.72,.08,1)';
      el.style.transform = `rotate(${rot.v}deg)`;
      setTimeout(() => {
        const pz = r.premio, gano = pz.tipo !== 'Sin premio' && pz.tipo !== 'Otra vez' && r.codigo;
        if (gano) { fijarPremio({ ...pz, codigo: r.codigo, vence: r.vence || '' }); confeti(100); vibrar([30, 40, 70]); ev('ruleta', 'ganó ' + pz.texto); }
        setRes(r); setEstado(pz.tipo === 'Otra vez' && !r.repetido ? 'otra' : 'resultado');
      }, r.repetido ? 1500 : 5500);
    }, Math.max(0, 1150 - (Date.now() - t0)));
  }
  const pz = res?.premio, gano = pz && pz.tipo !== 'Sin premio' && pz.tipo !== 'Otra vez' && res.codigo;
  const hayCarrito = Object.keys(carrito).length > 0;
  return (<>
    <button className="x" onClick={() => estado !== 'girando' && cerrar()}><Ic n="x" cl="s" /></button>
    <h3>¡Girá la ruleta<br />y ganá!</h3><div className="muted">Descuentos exclusivos para tu compra online</div>
    <div className="rueda">
      <svg className="flecha" viewBox="0 0 34 44"><path d="M17 44L2 12A15 15 0 1 1 32 12z" fill="#fff" stroke="#e3242b" strokeWidth="3" /><circle cx="17" cy="15" r="5" fill="#e3242b" /></svg>
      <svg className="w" ref={w} viewBox="-17 -17 334 334" style={{ transform: `rotate(${rot.v}deg)` }} dangerouslySetInnerHTML={{ __html: ruedaSVG(premios, 150) }} />
      <div className="centro"><svg viewBox="0 0 48 48" width="62%"><path d={ESTRELLA} fill="#e3242b" /></svg></div>
    </div>
    {(estado === 'listo' || estado === 'girando') && <><button className="btn r blk" disabled={estado === 'girando'} onClick={girar}>{estado === 'girando' ? <><div className="spin" /> Girando…</> : '¡Girar!'}</button>
      <div className="muted" style={{ marginTop: 10 }}>Un giro por semana. Los premios se usan en un pedido online{cfg.validez ? ' dentro de ' + cfg.validez + ' días' : ''}.</div></>}
    {estado === 'otra' && <div className="premio"><div className="gr">¡Otra vez!</div><div className="muted">Tenés un giro más 🎉</div><button className="btn r blk" style={{ marginTop: 12 }} onClick={() => { setEstado('listo'); setTimeout(girar, 50); }}>¡Girar de nuevo!</button></div>}
    {estado === 'resultado' && <div className="premio">
      {res.repetido && <div className="aviso y" style={{ margin: '0 0 10px' }}>{res.msg}</div>}
      {gano ? <><div className="muted">¡Felicitaciones! Ganaste</div><div className="gr">{pz.texto}{pz.categoria ? <><br /><span style={{ fontSize: 16 }}>en {pz.categoria}</span></> : /Descuento/.test(pz.tipo) ? <><br /><span style={{ fontSize: 16 }}>en toda la tienda</span></> : null}</div>
        <div className="codigo">{res.codigo}</div><div className="muted">{pz.minimo > 0 ? 'Compra mínima ' + plata(pz.minimo) + '. ' : ''}{res.vence ? 'Válido hasta el ' + fechaCorta(res.vence) + '. ' : ''}Se descuenta solo en tu carrito.</div>
        <button className="btn r blk" style={{ marginTop: 14 }} onClick={() => { cerrar(); if (hayCarrito) setTimeout(abrirCarrito, 50); else router.push(pz.categoria ? '/productos' : '/ofertas'); }}>¡A comprar!</button></>
        : <><div className="gr" style={{ color: '#fff' }}>{pz.texto}</div><div className="muted" style={{ marginTop: 6 }}>{res.usado ? 'Tu premio ya se usó en el pedido ' + res.usado + '.' : '¡La próxima seguro sale! Igual tenés las ofertas online.'}</div>
          <button className="btn o blk" style={{ marginTop: 14 }} onClick={() => { cerrar(); router.push('/ofertas'); }}>Ver ofertas</button></>}
    </div>}
  </>);
}

function VerPremio() {
  const { premio, cerrar, carrito, abrirCarrito } = useTienda();
  const router = useRouter();
  if (!premio) return null;
  return (<>
    <button className="x" onClick={cerrar}><Ic n="x" cl="s" /></button>
    <div className="premio"><span className="kicker">★ Tu premio</span><div className="gr" style={{ marginTop: 14 }}>{premio.texto}</div>
      {premio.categoria && <div className="muted">En productos de {premio.categoria}</div>}
      <div className="codigo">{premio.codigo}</div>
      <div className="muted">{premio.minimo > 0 ? 'Compra mínima ' + plata(premio.minimo) + '. ' : ''}{premio.vence ? 'Válido hasta el ' + fechaCorta(premio.vence) + '. ' : ''}Se descuenta solo en tu carrito.</div>
      <button className="btn r blk" style={{ marginTop: 16 }} onClick={() => { cerrar(); if (Object.keys(carrito).length) setTimeout(abrirCarrito, 50); else router.push('/productos'); }}>¡A comprar!</button></div>
  </>);
}

export { leer, guardar, K, norm };
