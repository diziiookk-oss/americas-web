// Lectura de datos para las páginas (con una memoria corta para que todo abra rápido).
import { db } from './db';
import { parseDescPago, slugify, esOferta, descDe } from './precios';

export const CONFIG_DEF = {
  negocio: 'Américas Drugstore',
  direccion: 'Av. de las Américas 2410, Paraná, Entre Ríos',
  ciudad: 'Paraná',
  whatsapp: '',
  horario: 'Todos los días de 8 a 24 hs',
  abierta: true,
  msgCerrada: 'Ahora no estamos tomando pedidos. ¡Volvé más tarde!',
  envio: true,
  costoEnvio: 1500,
  envioGratisDesde: 30000,
  zona: 'Paraná',
  minimo: 0,
  comisionPct: 30,                 // revendedores: % de la ganancia de cada pedido entregado
  pagos: 'Efectivo, Transferencia, Mercado Pago',
  descPago: 'Efectivo 10%, Transferencia 10%',
  alias: '',
  sinStock: 'encargar',            // encargar | ocultar | ignorar
  destacado: 'Todo lo que buscás, a un mensaje.',
  bajada: 'Golosinas, bebidas, dietética, despensa y mucho más. Armá tu pedido y lo recibís en casa o lo retirás en el local.',
  servicios: 'Rapipago, Cargas virtuales (celular y SUBE), Envíos en Paraná',
  nosotros: 'Somos un drugstore de barrio en Paraná: kiosco, bebidas, dietética y despensa, abierto hasta tarde. Pedí por acá y te lo preparamos al toque.',
  instagram: '',
  ruleta: true,
  ruletaAlEntrar: true,
  diasGiro: 7,
  validez: 3,
  callmebot: '',
  mapaLat: '',
  mapaLng: ''
};

const MEM = globalThis.__mem || (globalThis.__mem = { t: {}, v: {} });
export function olvidar() { MEM.t = {}; MEM.v = {}; }
async function memo(k, seg, fn) {
  const ahora = Date.now();
  if (MEM.t[k] && ahora - MEM.t[k] < seg * 1000) return MEM.v[k];
  const v = await fn();
  MEM.t[k] = ahora; MEM.v[k] = v;
  return v;
}

export async function getConfig() {
  return memo('config', 30, async () => {
    const s = await db();
    const rows = await s`SELECT clave, valor FROM config`;
    const c = { ...CONFIG_DEF };
    rows.forEach((r) => { if (r.clave in CONFIG_DEF) c[r.clave] = r.valor; });
    c.pagosLista = String(c.pagos || '').split(',').map((x) => x.trim()).filter(Boolean);
    c.serviciosLista = String(c.servicios || '').split(',').map((x) => x.trim()).filter(Boolean);
    c.descPagoMap = parseDescPago(c.descPago);
    c.whatsappWA = String(c.whatsapp || '').replace(/\D/g, '');
    c.sitio = (process.env.SITE_URL || process.env.URL || '').replace(/\/$/, '');
    return c;
  });
}

function escalonesDe(e) {
  if (typeof e === 'string') { try { e = JSON.parse(e); } catch { e = []; } }
  return Array.isArray(e) ? e.filter((x) => x && x.min > 0 && x.pct > 0) : [];
}

function fila(r, cfg) {
  const ignorar = cfg.sinStock === 'ignorar';
  const stock = ignorar || r.stock === null ? null : Number(r.stock);
  return {
    id: r.id, slug: r.slug, nombre: r.nombre, marca: r.marca || '', categoria: r.categoria || 'Otros', unidad: r.unidad === 'kg' ? 'kg' : 'un',
    precio: Number(r.precio), oferta: r.oferta === null ? null : Number(r.oferta), escalones: escalonesDe(r.escalones),
    img: r.img_web || r.img || '', hay: stock === null || stock > 0, max: stock === null ? null : Math.max(0, stock),
    pop: r.pop || 0, descripcion: r.descripcion || '', destacado: !!r.destacado, etiqueta: r.etiqueta || ''
  };
}

// Productos que se ven en la tienda.
export async function getProductos() {
  return memo('productos', 30, async () => {
    const cfg = await getConfig();
    const s = await db();
    const rows = await s`SELECT * FROM productos WHERE activo AND NOT oculto AND precio > 0 ORDER BY pop DESC, nombre`;
    let L = rows.map((r) => fila(r, cfg));
    if (cfg.sinStock === 'ocultar') L = L.filter((p) => p.hay);
    return L;
  });
}

export function catSlug(c) { return slugify(c); }

export async function getCategorias() {
  const L = await getProductos();
  const m = {};
  L.forEach((p) => { m[p.categoria] = (m[p.categoria] || 0) + 1; });
  return Object.keys(m).sort((a, b) => m[b] - m[a]).map((c) => ({ nombre: c, slug: catSlug(c), n: m[c] }));
}

export async function getProducto(slug) {
  const L = await getProductos();
  return L.find((p) => p.slug === slug) || null;
}

export async function getPremiosPublicos() {
  return memo('premios', 30, async () => {
    const s = await db();
    const rows = await s`SELECT texto, tipo, valor, minimo, categoria FROM premios WHERE activo ORDER BY orden, id`;
    return rows.map((r) => ({ texto: r.texto, tipo: r.tipo, valor: Number(r.valor), minimo: Number(r.minimo), categoria: r.categoria || '' }));
  });
}

export { esOferta, descDe };

// Lo mínimo que necesita el carrito en el navegador.
export function paraCliente(p) {
  return { id: p.id, slug: p.slug, nombre: p.nombre, categoria: p.categoria, unidad: p.unidad, precio: p.precio, oferta: p.oferta, escalones: p.escalones, img: p.img, hay: p.hay, max: p.max, etiqueta: p.etiqueta || '' };
}

// Config que puede ver cualquiera (sin claves).
export function configPublica(c) {
  return {
    negocio: c.negocio, direccion: c.direccion, whatsapp: c.whatsappWA, horario: c.horario, abierta: !!c.abierta, msgCerrada: c.msgCerrada,
    envio: !!c.envio, costoEnvio: Number(c.costoEnvio) || 0, envioGratisDesde: Number(c.envioGratisDesde) || 0, zona: c.zona, minimo: Number(c.minimo) || 0,
    pagos: c.pagosLista, descPagoMap: c.descPagoMap, alias: c.alias, encargar: c.sinStock === 'encargar', ruleta: !!c.ruleta, ruletaAlEntrar: !!c.ruletaAlEntrar,
    diasGiro: Number(c.diasGiro) || 7, validez: Number(c.validez) || 0, servicios: c.serviciosLista, instagram: String(c.instagram || '').replace(/^@/, '')
  };
}
