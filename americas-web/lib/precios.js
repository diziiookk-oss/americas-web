// Cuentas de precios: las usan la página (para mostrar) y el servidor (para cobrar). Tienen que dar igual.

export function plata(n) { return '$ ' + Math.round(Number(n) || 0).toLocaleString('es-AR'); }

export function norm(s) {
  s = String(s ?? '').toLowerCase();
  if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return s.replace(/[^a-z0-9.]+/g, ' ').trim();
}

export function slugify(s) {
  return norm(s).replace(/\./g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'producto';
}

// "Efectivo 10%, Transferencia 10%" → { efectivo: 10, transferencia: 10 }
export function parseDescPago(txt) {
  const out = {};
  String(txt || '').split(',').forEach((t) => {
    const m = /^\s*(.+?)\s+(\d+(?:[.,]\d+)?)\s*%\s*$/.exec(t);
    if (m) out[norm(m[1])] = Math.min(parseFloat(m[2].replace(',', '.')), 50);
  });
  return out;
}
export function pctPago(descPago, pago) { return (descPago || {})[norm(pago)] || 0; }
export function pagoMax(descPago) {
  let m = 0, ks = [];
  Object.keys(descPago || {}).forEach((k) => { if (descPago[k] > m) { m = descPago[k]; ks = [k]; } else if (descPago[k] === m) ks.push(k); });
  return { pct: m, txt: ks.join(' o ') };
}

// "250 g 5% · 500 g 10% · 1 kg 15%" → [{ min: 0.25, pct: 5 }, ...]
export function parseEscalones(txt) {
  const out = [];
  String(txt || '').split('·').forEach((t) => {
    const m = /^\s*(\d+(?:[.,]\d+)?)\s*(\+|kg|g)\s*(\d+(?:[.,]\d+)?)\s*%\s*$/i.exec(t);
    if (!m) return;
    const n = parseFloat(m[1].replace(',', '.')), u = m[2].toLowerCase();
    out.push({ min: u === 'g' ? n / 1000 : n, pct: parseFloat(m[3].replace(',', '.')) });
  });
  return out.sort((a, b) => a.min - b.min);
}

export function precioUnit(p) { return p.oferta != null && p.oferta !== '' && Number(p.oferta) > 0 ? Number(p.oferta) : Number(p.precio); }
export function tieneOferta(p) { return p.oferta != null && p.oferta !== '' && Number(p.oferta) > 0 && Number(p.oferta) < Number(p.precio); }
export function pctOferta(p) { return tieneOferta(p) ? Math.round((1 - p.oferta / p.precio) * 100) : 0; }
export function maxEscalon(p) { return (p.escalones || []).reduce((m, x) => Math.max(m, x.pct), 0); }
export function esOferta(p) { return tieneOferta(p) || (p.escalones || []).length > 0; }
export function descDe(p) { return tieneOferta(p) ? pctOferta(p) : maxEscalon(p); }

// Precio de una línea: escalón online sobre el precio de lista, o el precio de oferta si es más barato.
export function precioLinea(p, cant) {
  const lista = Number(p.precio) * cant;
  let tier = null;
  (p.escalones || []).forEach((x) => { if (cant >= x.min - 1e-9) tier = x; });
  const conTier = tier ? lista * (1 - tier.pct / 100) : lista;
  const conOf = tieneOferta(p) ? Number(p.oferta) * cant : lista;
  return { total: Math.round(Math.min(conTier, conOf)), lista: Math.round(lista), tier: tier && conTier <= conOf ? tier : null, oferta: !(tier && conTier <= conOf) && tieneOferta(p) };
}

export function cantTxt(p, c) {
  if (p.unidad !== 'kg') return c + ' u.';
  return c >= 1 ? String(Math.round(c * 1000) / 1000).replace('.', ',') + ' kg' : Math.round(c * 1000) + ' g';
}
export function minTxt(p, x) { return p.unidad === 'kg' ? (x.min >= 1 ? String(x.min).replace('.', ',') + ' kg' : Math.round(x.min * 1000) + ' g') : x.min + '+ u.'; }

// Totales del pedido (mismo cálculo en el carrito y en el servidor).
// lineas: [{ p, c }]; premio: { tipo, valor, minimo, categoria } | null
export function cuentas({ lineas, premio, pago, entrega, cfg }) {
  let sub = 0, lista = 0;
  const porCat = {};
  lineas.forEach((l) => {
    const pr = precioLinea(l.p, l.c);
    l.pr = pr; sub += pr.total; lista += pr.lista;
    const k = norm(l.p.categoria); porCat[k] = (porCat[k] || 0) + pr.total;
  });
  let dPremio = 0, envioGratis = false, falta = 0, sinCat = false, regalo = '';
  if (premio) {
    const base = premio.categoria ? porCat[norm(premio.categoria)] || 0 : sub;
    if (premio.categoria && !base) sinCat = true;
    else if (premio.minimo > 0 && sub < premio.minimo) falta = premio.minimo - sub;
    else if (premio.tipo === 'Descuento %') dPremio = Math.round(base * Math.min(premio.valor, 100) / 100);
    else if (premio.tipo === 'Descuento $') dPremio = Math.min(Math.round(premio.valor), base);
    else if (premio.tipo === 'Envío gratis') envioGratis = true;
    else if (premio.tipo === 'Regalo') regalo = premio.texto;
  }
  const pp = pctPago(cfg.descPagoMap, pago);
  const dPago = Math.round((sub - dPremio) * pp / 100);
  let envio = 0;
  if (entrega === 'Envío') envio = envioGratis || (cfg.envioGratisDesde > 0 && sub >= cfg.envioGratisDesde) ? 0 : Number(cfg.costoEnvio) || 0;
  return { sub, ahorro: lista - sub, dPremio, pp, dPago, envio, total: sub - dPremio - dPago + envio, falta, sinCat, envioGratis, regalo };
}

export function telWA(tel) {
  let d = String(tel || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('549')) return d;
  if (d.startsWith('54')) return '549' + d.slice(2);
  d = d.replace(/^0/, '').replace(/^(\d{2,4})15/, '$1');
  return '549' + d;
}
