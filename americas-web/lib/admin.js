// Panel del dueño y conexión con la caja.
import crypto from 'crypto';
import { db } from './db';
import { CONFIG_DEF, getConfig, olvidar } from './datos';
import { slugify, parseEscalones } from './precios';

/* ------------------------------------------------------------------ acceso */
function firma(txt) { return crypto.createHmac('sha256', String(process.env.ADMIN_PASSWORD || '') + '|ad').update(txt).digest('hex'); }
export function tokenAdmin() { return firma('admin-v1'); }
export function esAdmin(req) {
  if (!process.env.ADMIN_PASSWORD) return false;
  const c = req.cookies.get('ad_admin')?.value || '';
  const t = tokenAdmin();
  return c.length === t.length && crypto.timingSafeEqual(Buffer.from(c), Buffer.from(t));
}
export function claveOk(pass) {
  const a = Buffer.from(String(pass || '')), b = Buffer.from(String(process.env.ADMIN_PASSWORD || ''));
  return !!process.env.ADMIN_PASSWORD && a.length === b.length && crypto.timingSafeEqual(a, b);
}
export function esCaja(req) {
  const k = process.env.CAJA_KEY || '';
  const h = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return k.length >= 16 && h.length === k.length && crypto.timingSafeEqual(Buffer.from(h), Buffer.from(k));
}

/* ------------------------------------------------------------------ sincronizar productos desde la caja */
export async function sincronizar(body) {
  const s = await db();
  const lista = Array.isArray(body?.productos) ? body.productos : [];
  if (!lista.length) return { ok: false, msg: 'No llegaron productos.' };
  const existentes = await s`SELECT id, slug FROM productos`;
  const slugDe = {}, usados = new Set();
  existentes.forEach((r) => { slugDe[r.id] = r.slug; usados.add(r.slug); });
  const ids = new Set(), filas = [];
  for (const x of lista.slice(0, 5000)) {
    const id = String(x.id || '').trim().slice(0, 60), nombre = String(x.nombre || '').replace(/\s+/g, ' ').trim().slice(0, 140);
    if (!id || !nombre || ids.has(id)) continue;
    ids.add(id);
    let slug = slugDe[id];
    if (!slug) { const base = slugify(nombre); slug = base; let k = 2; while (usados.has(slug)) slug = base + '-' + k++; usados.add(slug); }
    const esc = Array.isArray(x.escalones) ? x.escalones.filter((e) => e && e.min > 0 && e.pct > 0).map((e) => ({ min: Number(e.min), pct: Number(e.pct) })) : parseEscalones(x.escalones);
    const precio = Number(x.precio) || 0, of = Number(x.oferta) || 0;
    filas.push({ id, slug, nombre, marca: String(x.marca || '').slice(0, 80), categoria: String(x.categoria || '').trim().slice(0, 60) || 'Otros',
      unidad: x.unidad === 'kg' ? 'kg' : 'un', precio, oferta: of > 0 && of < precio ? of : null, escalones: JSON.stringify(esc),
      img: /^https?:\/\//.test(String(x.img || '')) ? String(x.img).slice(0, 500) : '', stock: x.stock === '' || x.stock === null || x.stock === undefined || isNaN(Number(x.stock)) ? null : Number(x.stock),
      pop: Math.max(0, Math.round(Number(x.pop) || 0)), activo: x.tienda !== false });
  }
  for (let i = 0; i < filas.length; i += 300) {
    const t = filas.slice(i, i + 300);
    await s`INSERT INTO productos ${s(t, 'id', 'slug', 'nombre', 'marca', 'categoria', 'unidad', 'precio', 'oferta', 'escalones', 'img', 'stock', 'pop', 'activo')}
      ON CONFLICT (id) DO UPDATE SET nombre = excluded.nombre, marca = excluded.marca, categoria = excluded.categoria, unidad = excluded.unidad, precio = excluded.precio,
      oferta = excluded.oferta, escalones = excluded.escalones::jsonb, img = excluded.img, stock = excluded.stock, pop = excluded.pop, activo = excluded.activo, actualizado = now()`;
  }
  // los que ya no están en la caja dejan de mostrarse (no se borran)
  const [{ n: bajas }] = await s`WITH b AS (UPDATE productos SET activo = false, actualizado = now() WHERE activo AND NOT (id = ANY(${[...ids]})) RETURNING 1) SELECT count(*)::int AS n FROM b`;
  // datos del negocio que vienen de la caja: solo si en la web todavía no los cargaste
  const neg = body.negocio || {};
  for (const k of ['negocio', 'direccion', 'whatsapp']) if (neg[k]) await s`INSERT INTO config (clave, valor) VALUES (${k}, ${s.json(String(neg[k]))}) ON CONFLICT (clave) DO NOTHING`;
  olvidar();
  return { ok: true, msg: 'Web actualizada: ' + filas.length + ' productos' + (bajas ? ', ' + bajas + ' dados de baja' : '') + '.', productos: filas.length, bajas };
}

/* ------------------------------------------------------------------ pedidos */
export const ESTADOS = ['Nuevo', 'Preparando', 'Listo', 'En camino', 'Entregado', 'Cancelado'];
function pedidoJSON(r) {
  return { nro: r.nro, fecha: new Date(r.fecha).getTime(), cliente: r.cliente, tel: r.telefono, entrega: r.entrega, dir: r.direccion, pago: r.pago, items: r.items || [],
    detalle: r.detalle, subtotal: Number(r.subtotal), descPremio: Number(r.desc_premio), descPago: Number(r.desc_pago), descuento: Number(r.desc_premio) + Number(r.desc_pago),
    envio: Number(r.envio), total: Number(r.total), premio: r.premio, estado: r.estado, nota: r.nota, ticket: r.ticket, cobrado: r.cobrado_en_caja };
}
export async function listarPedidos(lim = 150) {
  const s = await db();
  const rows = await s`SELECT * FROM pedidos WHERE nro IS NOT NULL ORDER BY num DESC LIMIT ${lim}`;
  const [{ n }] = await s`SELECT count(*)::int AS n FROM pedidos WHERE estado = 'Nuevo' AND nro IS NOT NULL`;
  return { pedidos: rows.map(pedidoJSON), nuevos: n, estados: ESTADOS };
}
export async function cambiarEstado({ nro, estado, ticket }) {
  if (!ESTADOS.includes(estado)) return { ok: false, msg: 'Estado inválido.' };
  const s = await db();
  const r = ticket !== undefined && ticket !== ''
    ? await s`UPDATE pedidos SET estado = ${estado}, ticket = ${String(ticket).slice(0, 20)}, cobrado_en_caja = true, actualizado = now() WHERE nro = ${nro} RETURNING nro`
    : await s`UPDATE pedidos SET estado = ${estado}, actualizado = now() WHERE nro = ${nro} RETURNING nro`;
  if (!r.length) return { ok: false, msg: 'No encontré el pedido ' + nro + '.' };
  return { ok: true, msg: 'Pedido ' + nro + ': ' + estado + '.', ...(await listarPedidos()) };
}

/* ------------------------------------------------------------------ configuración, ruleta, avisos y productos */
export async function leerConfig() {
  const cfg = await getConfig();
  const out = {}; Object.keys(CONFIG_DEF).forEach((k) => { out[k] = cfg[k]; });
  return out;
}
export async function guardarConfig(c) {
  const s = await db();
  for (const k of Object.keys(CONFIG_DEF)) {
    if (c[k] === undefined) continue;
    const def = CONFIG_DEF[k];
    let v = c[k];
    if (typeof def === 'boolean') v = !!v; else if (typeof def === 'number') v = Number(v) || 0; else v = String(v).slice(0, 1000);
    await s`INSERT INTO config (clave, valor) VALUES (${k}, ${s.json(v)}) ON CONFLICT (clave) DO UPDATE SET valor = excluded.valor`;
  }
  olvidar();
  return { ok: true, msg: 'Guardado. La página ya muestra los cambios.', config: await leerConfig() };
}
export const TIPOS = ['Descuento %', 'Descuento $', 'Envío gratis', 'Regalo', 'Otra vez', 'Sin premio'];
export async function leerPremios() {
  const s = await db();
  const rows = await s`SELECT * FROM premios ORDER BY orden, id`;
  const [{ giros, usados }] = await s`SELECT count(*)::int AS giros, count(*) FILTER (WHERE usado_en <> '')::int AS usados FROM giros WHERE fecha > now() - interval '30 days'`;
  return { premios: rows.map((r) => ({ texto: r.texto, tipo: r.tipo, valor: Number(r.valor), peso: Number(r.peso), minimo: Number(r.minimo), categoria: r.categoria || '', activo: r.activo })), tipos: TIPOS, giros, usados };
}
export async function guardarPremios(lista) {
  const L = (lista || []).filter((x) => String(x.texto || '').trim()).slice(0, 12);
  if (L.filter((x) => x.activo !== false).length < 2) return { ok: false, msg: 'La ruleta necesita al menos 2 premios activos.' };
  const s = await db();
  await s.begin(async (t) => {
    await t`DELETE FROM premios`;
    for (let i = 0; i < L.length; i++) {
      const x = L[i];
      await t`INSERT INTO premios (orden, texto, tipo, valor, peso, minimo, categoria, activo) VALUES (${i}, ${String(x.texto).trim().slice(0, 24)}, ${TIPOS.includes(x.tipo) ? x.tipo : 'Sin premio'},
        ${Number(x.valor) || 0}, ${Math.max(Number(x.peso) || 0, 0)}, ${Number(x.minimo) || 0}, ${String(x.categoria || '').slice(0, 60)}, ${x.activo !== false})`;
    }
  });
  olvidar();
  return { ok: true, msg: 'Ruleta guardada.', ...(await leerPremios()) };
}
export async function leerAvisos() {
  const s = await db();
  const rows = await s`SELECT * FROM avisos ORDER BY id DESC LIMIT 200`;
  return rows.map((r) => ({ id: r.id, fecha: new Date(r.fecha).getTime(), producto: r.producto, cliente: r.cliente, tel: r.telefono, estado: r.estado }));
}
export async function marcarAviso(id, estado) {
  const s = await db();
  await s`UPDATE avisos SET estado = ${estado === 'Avisado' ? 'Avisado' : 'Pendiente'} WHERE id = ${Number(id) || 0}`;
  return { ok: true, avisos: await leerAvisos() };
}
// filtro: '' | 'sinFoto' | 'sinDesc' | 'destacados' | 'ocultos' | 'etiqueta'
export async function leerProductosAdmin(q, filtro) {
  const s = await db();
  const like = '%' + String(q || '').trim() + '%';
  const f = String(filtro || '');
  const rows = await s`SELECT id, slug, nombre, categoria, unidad, precio, oferta, img, img_web, stock, activo, oculto, destacado, descripcion, etiqueta FROM productos
    WHERE activo AND (${!q} OR nombre ILIKE ${like} OR id ILIKE ${like} OR categoria ILIKE ${like})
      AND (${f !== 'sinFoto'} OR (img = '' AND img_web = ''))
      AND (${f !== 'sinDesc'} OR coalesce(descripcion, '') = '')
      AND (${f !== 'destacados'} OR destacado)
      AND (${f !== 'ocultos'} OR oculto)
      AND (${f !== 'etiqueta'} OR coalesce(etiqueta, '') <> '')
    ORDER BY pop DESC, nombre LIMIT 200`;
  const [{ total, sinFoto }] = await s`SELECT count(*)::int AS total, count(*) FILTER (WHERE img = '' AND img_web = '')::int AS "sinFoto" FROM productos WHERE activo`;
  return { productos: rows.map((r) => ({ ...r, precio: Number(r.precio), oferta: r.oferta === null ? null : Number(r.oferta), stock: r.stock === null ? null : Number(r.stock) })), total, sinFoto };
}
// Acepta links de Google Imágenes (…imgurl=…) y saca la foto real.
function limpiarLinkFoto(u) {
  let img = String(u || '').trim();
  try { const x = new URL(img); const real = x.searchParams.get('imgurl') || x.searchParams.get('mediaurl') || x.searchParams.get('url'); if (real && /^https?:\/\//.test(real) && /google\.|bing\./.test(x.hostname)) img = real; } catch {}
  return img;
}
export async function editarProducto({ id, oculto, img_web, descripcion, destacado, etiqueta }) {
  const s = await db();
  const img = limpiarLinkFoto(img_web);
  if (img && !/^https?:\/\//.test(img)) return { ok: false, msg: 'El link de la foto tiene que empezar con https://' };
  await s`UPDATE productos SET oculto = ${!!oculto}, img_web = ${img.slice(0, 500)}, descripcion = ${String(descripcion || '').slice(0, 1500)}, destacado = ${!!destacado},
    etiqueta = ${String(etiqueta || '').trim().toUpperCase().slice(0, 22)} WHERE id = ${id}`;
  olvidar();
  return { ok: true, msg: 'Producto guardado.' };
}

/* ------------------------------------------------------------------ estadísticas */
export async function estadisticas(dias) {
  dias = Math.min(Math.max(Number(dias) || 30, 1), 180);
  const s = await db();
  const per = async (desde, hasta) => {
    const [r] = await s`SELECT count(DISTINCT visitante)::int AS visitantes, count(DISTINCT sesion)::int AS visitas,
      count(*) FILTER (WHERE tipo IN ('vista','producto','categoria'))::int AS paginas, count(*) FILTER (WHERE tipo = 'carrito')::int AS carrito,
      count(*) FILTER (WHERE tipo = 'whatsapp')::int AS whatsapp, count(*) FILTER (WHERE tipo = 'buscar')::int AS busquedas,
      count(DISTINCT sesion) FILTER (WHERE tipo = 'pedido')::int AS "sesPed"
      FROM eventos WHERE fecha >= now() - make_interval(days => ${desde}::int) AND fecha < now() - make_interval(days => ${hasta}::int)`;
    const [p] = await s`SELECT count(*)::int AS pedidos, coalesce(sum(total),0)::float AS monto FROM pedidos
      WHERE nro IS NOT NULL AND estado <> 'Cancelado' AND fecha >= now() - make_interval(days => ${desde}::int) AND fecha < now() - make_interval(days => ${hasta}::int)`;
    return { ...r, ...p, conversion: r.visitas ? Math.round(r.sesPed / r.visitas * 1000) / 10 : 0, porPagina: r.visitas ? Math.round(r.paginas / r.visitas * 10) / 10 : 0,
      ticketProm: p.pedidos ? Math.round(p.monto / p.pedidos) : 0 };
  };
  const act = await per(dias, 0), ant = await per(dias * 2, dias);
  const [nv] = await s`SELECT count(*)::int AS nuevos FROM (SELECT visitante, min(fecha) AS f FROM eventos GROUP BY visitante) x WHERE f >= now() - make_interval(days => ${dias}::int)`;
  const porDia = await s`SELECT to_char(g, 'DD/MM') AS d, coalesce(n, 0)::int AS n FROM generate_series((now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date - (${dias - 1})::int, (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date, '1 day') g
    LEFT JOIN (SELECT (fecha AT TIME ZONE 'America/Argentina/Buenos_Aires')::date AS dia, count(DISTINCT visitante) AS n FROM eventos WHERE fecha >= now() - make_interval(days => ${dias + 1}::int) GROUP BY 1) e ON e.dia = g::date ORDER BY g`;
  const top = async (tipo) => (await s`SELECT lower(detalle) AS k, count(*)::int AS n FROM eventos WHERE tipo = ${tipo} AND detalle <> '' AND fecha >= now() - make_interval(days => ${dias}::int) GROUP BY 1 ORDER BY 2 DESC LIMIT 8`);
  const ahora = await s`SELECT DISTINCT ON (visitante) visitante, tipo, detalle FROM eventos WHERE fecha >= now() - interval '5 minutes' ORDER BY visitante, fecha DESC`;
  const pag = {}; ahora.forEach((r) => { const k = r.tipo === 'producto' ? 'Producto: ' + r.detalle : r.tipo === 'vista' ? ({ inicio: 'Inicio', productos: 'Productos', ofertas: 'Ofertas', pedidos: 'Mis pedidos', nosotros: 'Nosotros', carrito: 'Carrito' }[r.detalle] || r.detalle) : 'Inicio'; pag[k] = (pag[k] || 0) + 1; });
  const NOM = { visita: 'Entró a la tienda', vista: 'Vio', producto: 'Vio', categoria: 'Vio la categoría', buscar: 'Buscó', carrito: 'Agregó al carrito:', whatsapp: 'Tocó WhatsApp', pedido: 'Hizo el pedido', ruleta: 'Ruleta:' };
  const ult = await s`SELECT to_char(fecha AT TIME ZONE 'America/Argentina/Buenos_Aires', 'HH24:MI') AS h, tipo, detalle FROM eventos ORDER BY id DESC LIMIT 30`;
  return { dias, ...act, nuevos: nv.nuevos, volvieron: Math.max(0, act.visitantes - nv.nuevos), ant, porDia,
    topBusquedas: await top('buscar'), topVistos: (await s`SELECT detalle AS k, count(*)::int AS n FROM eventos WHERE tipo = 'producto' AND fecha >= now() - make_interval(days => ${dias}::int) GROUP BY 1 ORDER BY 2 DESC LIMIT 8`),
    topCarrito: (await s`SELECT detalle AS k, count(*)::int AS n FROM eventos WHERE tipo = 'carrito' AND fecha >= now() - make_interval(days => ${dias}::int) GROUP BY 1 ORDER BY 2 DESC LIMIT 8`),
    ahora: ahora.length, ahoraPag: Object.keys(pag).map((k) => ({ k, n: pag[k] })).sort((a, b) => b.n - a.n),
    ultimos: ult.map((r) => ({ h: r.h, t: (NOM[r.tipo] || r.tipo) + (r.detalle ? ' ' + r.detalle : '') })) };
}

export async function categorias() {
  const s = await db();
  return (await s`SELECT DISTINCT categoria FROM productos WHERE activo ORDER BY 1`).map((r) => r.categoria);
}
