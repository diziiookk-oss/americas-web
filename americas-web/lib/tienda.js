// Lógica del servidor: pedidos, ruleta, seguimiento, avisos y estadísticas.
import { db } from './db';
import { getConfig, getProductos, olvidar } from './datos';
import { cuentas, cantTxt, plata, telWA } from './precios';

const corto = (s, n = 100) => String(s ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, n);
const soloNum = (t) => String(t || '').replace(/\D/g, '').replace(/^0+/, '');
const ult10 = (t) => soloNum(t).slice(-10);
const finDia = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 0); return x; };

/* ------------------------------------------------------------------ ruleta */
function codigo() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = 'R-'; for (let i = 0; i < 5; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }

export async function girar(dispositivo) {
  const dev = corto(dispositivo, 40).replace(/[^\w-]/g, '');
  if (dev.length < 8) return { ok: false, msg: 'Actualizá la página y probá de nuevo.' };
  const cfg = await getConfig();
  if (!cfg.ruleta) return { ok: false, msg: 'La ruleta no está activa en este momento.' };
  const s = await db();
  const premios = await s`SELECT * FROM premios WHERE activo ORDER BY orden, id`;
  if (premios.length < 2) return { ok: false, msg: 'La ruleta no tiene premios cargados.' };
  const dias = Number(cfg.diasGiro) || 7;
  const [prev] = await s`SELECT * FROM giros WHERE dispositivo = ${dev} AND tipo <> 'Otra vez' AND fecha > now() - make_interval(days => ${dias}::int) ORDER BY fecha DESC LIMIT 1`;
  if (prev) {
    const idx = premios.findIndex((x) => x.texto === prev.premio);
    const px = premios[idx] || { texto: prev.premio, tipo: prev.tipo, valor: 0, minimo: 0, categoria: '' };
    const vencido = prev.vence && new Date() > finDia(prev.vence);
    const vuelve = new Date(new Date(prev.fecha).getTime() + dias * 86400000);
    return { ok: true, repetido: true, idx, premio: pub(px), codigo: prev.usado_en || vencido ? '' : prev.codigo || '', usado: prev.usado_en, vence: prev.vence ? new Date(prev.vence).getTime() : '',
      msg: 'Ya giraste esta semana' + (prev.usado_en ? ' y usaste tu premio' : vencido ? ' y tu premio venció' : '') + '. Volvé a girar desde el ' + vuelve.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + '.' };
  }
  const total = premios.reduce((a, x) => a + Math.max(Number(x.peso), 0), 0);
  let k = 0, r = Math.random() * total;
  if (total <= 0) k = Math.floor(Math.random() * premios.length);
  else for (let i = 0; i < premios.length; i++) { r -= Math.max(Number(premios[i].peso), 0); if (r < 0) { k = i; break; } }
  const pr = premios[k], conCod = pr.tipo !== 'Sin premio' && pr.tipo !== 'Otra vez';
  const cod = conCod ? codigo() : null;
  const vence = conCod ? new Date(Date.now() + Math.max(Number(cfg.validez) || 0, 0) * 86400000) : null;
  await s`INSERT INTO giros (dispositivo, premio, tipo, codigo, vence) VALUES (${dev}, ${pr.texto}, ${pr.tipo}, ${cod}, ${vence})`;
  return { ok: true, idx: k, premio: pub(pr), codigo: cod || '', vence: vence ? vence.getTime() : '' };
}
function pub(x) { return { texto: x.texto, tipo: x.tipo, valor: Number(x.valor) || 0, minimo: Number(x.minimo) || 0, categoria: x.categoria || '' }; }

/* ------------------------------------------------------------------ pedidos */
export async function crearPedido(ped) {
  const cfg = await getConfig();
  if (!cfg.abierta) return { ok: false, msg: cfg.msgCerrada };
  const nombre = corto(ped?.nombre, 60).replace(/\s+/g, ' ');
  const tel = soloNum(ped?.tel);
  if (nombre.length < 2) return { ok: false, msg: 'Escribí tu nombre.' };
  if (tel.length < 8 || tel.length > 15) return { ok: false, msg: 'Escribí tu WhatsApp con característica (ej. 343 4123456).' };
  const s = await db();
  const [{ n: recientes }] = await s`SELECT count(*)::int AS n FROM pedidos WHERE telefono = ${tel} AND fecha > now() - interval '1 hour'`;
  if (recientes >= 5) return { ok: false, msg: 'Ya mandaste varios pedidos seguidos. Escribinos por WhatsApp.' };
  const envio = ped.entrega === 'Envío';
  if (envio && !cfg.envio) return { ok: false, msg: 'Por ahora no hacemos envíos: elegí retirar en el local.' };
  const dir = corto(ped.direccion, 150);
  if (envio && dir.length < 4) return { ok: false, msg: 'Escribí la dirección para el envío.' };
  const pago = cfg.pagosLista.includes(ped.pago) ? ped.pago : cfg.pagosLista[0] || 'Efectivo';

  const prods = {}; (await getProductos()).forEach((p) => { prods[p.id] = p; });
  const lineas = [];
  (ped.items || []).slice(0, 60).forEach((it) => {
    const p = prods[it.id]; if (!p) return;
    let c = Number(it.cant); if (!(c > 0)) return;
    c = p.unidad === 'kg' ? Math.round(c * 1000) / 1000 : Math.round(c);
    if (!(c > 0) || c > 999) return;
    const enc = !p.hay || (p.max !== null && c > p.max);
    if (enc && cfg.sinStock !== 'encargar') return;
    lineas.push({ p, c, enc });
  });
  if (!lineas.length) return { ok: false, msg: 'Tu carrito quedó vacío: algunos productos ya no están disponibles. Actualizá la página.' };

  // premio de la ruleta
  let premio = null, giro = null;
  if (ped.codigoPremio) {
    const cod = corto(ped.codigoPremio, 12).toUpperCase();
    [giro] = await s`SELECT * FROM giros WHERE codigo = ${cod}`;
    if (!giro) return { ok: false, msg: 'Ese código de premio no existe.' };
    if (giro.usado_en) return { ok: false, msg: 'Ese premio ya se usó en el pedido ' + giro.usado_en + '.' };
    if (giro.vence && new Date() > finDia(giro.vence)) return { ok: false, msg: 'Tu premio venció. ¡Volvé a girar la ruleta la semana que viene!' };
    const dias = Number(cfg.diasGiro) || 7;
    const usados = await s`SELECT telefono FROM giros WHERE usado_en <> '' AND fecha > now() - make_interval(days => ${dias}::int)`;
    if (usados.some((u) => ult10(u.telefono) === ult10(tel))) return { ok: false, msg: 'Ese WhatsApp ya usó un premio de la ruleta en los últimos ' + dias + ' días. Sacá el premio para mandar el pedido.' };
    const [pz] = await s`SELECT * FROM premios WHERE texto = ${giro.premio} ORDER BY activo DESC LIMIT 1`;
    if (pz) premio = { texto: pz.texto, tipo: pz.tipo, valor: Number(pz.valor), minimo: Number(pz.minimo), categoria: pz.categoria || '' };
  }
  const C = cuentas({ lineas, premio, pago, entrega: envio ? 'Envío' : 'Retiro', cfg });
  if (cfg.minimo > 0 && C.sub < cfg.minimo) return { ok: false, msg: 'El pedido mínimo es ' + plata(cfg.minimo) + '.' };
  if (premio && C.sinCat) return { ok: false, msg: 'Tu premio "' + premio.texto + '" es para productos de ' + premio.categoria + '. Agregá alguno o sacá el premio.' };
  if (premio && C.falta) return { ok: false, msg: 'Para usar el premio "' + premio.texto + '" la compra mínima es ' + plata(premio.minimo) + '.' };

  const items = lineas.map((l) => ({ id: l.p.id, n: l.p.nombre, u: l.p.unidad, cant: l.c, total: l.pr.total, lista: l.pr.lista, on: l.pr.tier ? l.pr.tier.pct + '%' : '', of: l.pr.oferta, enc: l.enc, cat: l.p.categoria }));
  const detalle = lineas.map((l) => '• ' + cantTxt(l.p, l.c) + ' ' + l.p.nombre + ' — ' + plata(l.pr.total) + (l.pr.tier ? ' (online ' + l.pr.tier.pct + '% off)' : l.pr.oferta ? ' (oferta)' : '') + (l.enc ? ' ⏳ ENCARGO' : '')).join('\n') + (C.regalo ? '\n🎁 ' + C.regalo : '');
  const nota = corto(ped.nota, 300);
  const premioTxt = premio ? premio.texto + (premio.categoria ? ' en ' + premio.categoria : '') + ' (' + giro.codigo + ')' : '';

  // Revendedor: si el cliente llegó con ?ref=codigo, el pedido es suyo. Comisión = % de la GANANCIA (precio cobrado − costo),
  // descontando los descuentos que se le hicieron al cliente. Productos sin costo cargado no suman ganancia (se avisa en el panel).
  let vendedor = '', ganancia = 0, comision = 0, sinCosto = 0;
  const ref = String(ped.ref || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);
  if (ref) {
    const [v] = await s`SELECT codigo FROM vendedores WHERE codigo = ${ref} AND activo`;
    if (v) {
      vendedor = v.codigo;
      const costos = {}; (await s`SELECT id, costo FROM productos WHERE id = ANY(${lineas.map((l) => l.p.id)})`).forEach((r) => { costos[r.id] = r.costo === null ? null : Number(r.costo); });
      lineas.forEach((l) => { const co = costos[l.p.id]; if (!(co > 0)) { sinCosto++; return; } ganancia += l.pr.total - co * l.c; });
      ganancia = Math.max(0, Math.round(ganancia - C.dPremio - C.dPago));
      comision = Math.round(ganancia * (Number(cfg.comisionPct) || 0) / 100);
    }
  }

  const [row] = await s`INSERT INTO pedidos (cliente, telefono, entrega, direccion, pago, items, detalle, subtotal, desc_premio, desc_pago, envio, total, premio, nota, vendedor, ganancia, comision, sin_costo)
    VALUES (${nombre}, ${tel}, ${envio ? 'Envío' : 'Retiro'}, ${envio ? dir : ''}, ${pago}, ${s.json(items)}, ${detalle}, ${C.sub}, ${C.dPremio}, ${C.dPago}, ${C.envio}, ${C.total}, ${premioTxt}, ${nota}, ${vendedor}, ${ganancia}, ${comision}, ${sinCosto})
    RETURNING num`;
  const nro = 'P-' + String(row.num).padStart(4, '0');
  await s`UPDATE pedidos SET nro = ${nro} WHERE num = ${row.num}`;
  if (giro) await s`UPDATE giros SET usado_en = ${nro}, telefono = ${tel} WHERE id = ${giro.id}`;
  await registrarEventos(ped.visitante, ped.sesion, [['pedido', nro + ' · ' + plata(C.total)]]);

  const encargos = lineas.filter((l) => l.enc).length;
  const msg = '🛒 *Pedido ' + nro + '* — ' + cfg.negocio + '\n\n' + detalle + '\n\n' +
    'Subtotal: ' + plata(C.sub) + (C.ahorro > 0 ? ' (ahorrás ' + plata(C.ahorro) + ')' : '') + '\n' +
    (C.dPremio ? 'Premio ruleta (' + premio.texto + '): −' + plata(C.dPremio) + '\n' : '') +
    (C.dPago ? C.pp + '% OFF pagando con ' + pago.toLowerCase() + ': −' + plata(C.dPago) + '\n' : '') +
    (envio ? 'Envío: ' + (C.envio ? plata(C.envio) : 'GRATIS') + '\n' : '') +
    '*Total: ' + plata(C.total) + '*\n\n' +
    '👤 ' + nombre + '\n' + (envio ? '🛵 Envío a: ' + dir : '🏪 Retiro en el local') + '\n💳 Pago: ' + pago + (nota ? '\n📝 ' + nota : '') +
    (encargos ? '\n⏳ Tiene ' + encargos + ' producto(s) para encargar' : '');
  avisarDueno(cfg, vendedor ? msg + '\n🤝 Revendedor: ' + vendedor + ' · comisión ' + plata(comision) : msg).catch(() => {});
  return { ok: true, nro, total: C.total, wa: cfg.whatsappWA ? 'https://wa.me/' + telWA(cfg.whatsappWA) + '?text=' + encodeURIComponent(msg) : '', alias: /transf|mercado/i.test(pago) ? cfg.alias : '' };
}

async function avisarDueno(cfg, msg) {
  if (!cfg.callmebot || !cfg.whatsappWA) return;
  const u = 'https://api.callmebot.com/whatsapp.php?phone=' + telWA(cfg.whatsappWA) + '&text=' + encodeURIComponent(msg) + '&apikey=' + encodeURIComponent(cfg.callmebot);
  await fetch(u, { signal: AbortSignal.timeout(6000) });
}

export async function seguimiento(lista) {
  const pares = (lista || []).slice(0, 15).map((x) => ({ nro: corto(x?.nro, 12).toUpperCase(), tel: ult10(x?.tel) })).filter((x) => x.nro && x.tel.length >= 8);
  if (!pares.length) return { ok: true, pedidos: [] };
  const s = await db();
  const rows = await s`SELECT nro, fecha, entrega, detalle, total, estado, telefono FROM pedidos WHERE nro IN ${s(pares.map((p) => p.nro))}`;
  const out = rows.filter((r) => pares.some((p) => p.nro === r.nro && p.tel === ult10(r.telefono)))
    .map((r) => ({ nro: r.nro, fecha: new Date(r.fecha).getTime(), entrega: r.entrega, detalle: r.detalle, total: Number(r.total), estado: r.estado }));
  return { ok: true, pedidos: out.sort((a, b) => b.fecha - a.fecha) };
}

export async function avisame(a) {
  const tel = soloNum(a?.tel), nom = corto(a?.nombre, 60), prod = corto(a?.producto, 120);
  if (tel.length < 8) return { ok: false, msg: 'Escribí tu WhatsApp con característica.' };
  if (!prod) return { ok: false, msg: 'Falta el producto.' };
  const s = await db();
  const [{ n }] = await s`SELECT count(*)::int AS n FROM avisos WHERE telefono = ${tel} AND fecha > now() - interval '6 hours'`;
  if (n >= 10) return { ok: false, msg: 'Ya anotaste muchos avisos. ¡Te escribimos cuando entren!' };
  await s`INSERT INTO avisos (producto, cliente, telefono) VALUES (${prod}, ${nom}, ${tel})`;
  return { ok: true, msg: '¡Listo! Te avisamos por WhatsApp cuando ingrese.' };
}

const EVENTOS_OK = ['visita', 'vista', 'producto', 'buscar', 'carrito', 'whatsapp', 'pedido', 'ruleta', 'categoria'];
export async function registrarEventos(v, ses, ev) {
  const filas = (ev || []).slice(0, 40).filter((e) => e && EVENTOS_OK.includes(e[0])).map((e) => ({ visitante: corto(v, 24), sesion: corto(ses, 24), tipo: e[0], detalle: corto(e[1], 120) }));
  if (!filas.length) return;
  const s = await db();
  await s`INSERT INTO eventos ${s(filas, 'visitante', 'sesion', 'tipo', 'detalle')}`;
  if (Math.random() < 0.01) await s`DELETE FROM eventos WHERE fecha < now() - interval '180 days'`;
}

export { olvidar };
