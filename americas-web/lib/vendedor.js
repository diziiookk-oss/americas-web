// Cuentas de revendedores: se anotan solos (quedan "pendiente"), el dueño los aprueba y entran a su panel
// con su WhatsApp y una contraseña. La contraseña se guarda con scrypt (nunca en texto).
import crypto from 'crypto';
import { db } from './db';
import { getConfig } from './datos';
import { codigoDe } from './admin';

const ult10 = (t) => String(t || '').replace(/\D/g, '').slice(-10);
function hash(clave, sal) { sal = sal || crypto.randomBytes(16).toString('hex'); return sal + ':' + crypto.scryptSync(String(clave), sal, 32).toString('hex'); }
function claveVale(clave, guardado) {
  const [sal, h] = String(guardado || '').split(':'); if (!sal || !h) return false;
  const a = Buffer.from(crypto.scryptSync(String(clave), sal, 32).toString('hex')), b = Buffer.from(h);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function firma(txt) { return crypto.createHmac('sha256', String(process.env.ADMIN_PASSWORD || '') + '|vend').update(txt).digest('hex'); }
export function tokenVendedor(codigo) { return codigo + '.' + firma('v1:' + codigo); }
export function vendedorDe(req) {
  const t = req.cookies.get('ad_vend')?.value || '';
  const i = t.indexOf('.'); if (i < 1) return '';
  const c = t.slice(0, i), ok = tokenVendedor(c);
  return t.length === ok.length && crypto.timingSafeEqual(Buffer.from(t), Buffer.from(ok)) ? c : '';
}

async function buscarPorTel(s, tel) {
  const rows = await s`SELECT * FROM vendedores WHERE right(regexp_replace(telefono, '\\D', '', 'g'), 10) = ${ult10(tel)} LIMIT 1`;
  return rows[0] || null;
}

export async function registrar({ nombre, telefono, clave, alias, nota }) {
  const n = String(nombre || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const tel = String(telefono || '').replace(/\D/g, '').slice(0, 15);
  if (n.length < 3) return { ok: false, msg: 'Escribí tu nombre y apellido.' };
  if (ult10(tel).length < 10) return { ok: false, msg: 'Escribí tu WhatsApp con característica (ej. 343 4123456).' };
  if (String(clave || '').length < 6) return { ok: false, msg: 'La contraseña tiene que tener al menos 6 letras o números.' };
  const s = await db();
  const ya = await buscarPorTel(s, tel);
  if (ya && ya.clave) return { ok: false, msg: 'Ese WhatsApp ya tiene cuenta. Entrá con tu contraseña.' };
  if (ya) {   // el dueño ya lo había cargado a mano: se le crea el acceso y conserva su estado
    await s`UPDATE vendedores SET clave = ${hash(clave)}, alias = ${String(alias || '').slice(0, 60)}, nota = ${String(nota || '').slice(0, 300)} WHERE codigo = ${ya.codigo}`;
    return { ok: true, estado: ya.estado || 'activo', msg: ya.activo ? '¡Listo! Ya podés entrar.' : 'Cuenta creada. Te avisamos cuando esté aprobada.' };
  }
  const base = codigoDe(n.split(' ')[0]) || 'rev';
  let c = base, k = 2;
  while ((await s`SELECT 1 FROM vendedores WHERE codigo = ${c}`).length) c = base + k++;
  await s`INSERT INTO vendedores (codigo, nombre, telefono, activo, estado, clave, alias, nota) VALUES (${c}, ${n}, ${tel}, false, 'pendiente', ${hash(clave)}, ${String(alias || '').slice(0, 60)}, ${String(nota || '').slice(0, 300)})`;
  return { ok: true, estado: 'pendiente', msg: '¡Listo! Tu cuenta quedó pendiente de aprobación. Te avisamos por WhatsApp.' };
}

export async function login({ telefono, clave }) {
  const s = await db();
  const v = await buscarPorTel(s, telefono);
  if (!v || !v.clave || !claveVale(clave, v.clave)) { await new Promise((r) => setTimeout(r, 700)); return { ok: false, msg: 'WhatsApp o contraseña incorrectos.' }; }
  if (v.estado === 'pendiente') return { ok: false, msg: 'Tu cuenta todavía está esperando aprobación. Te avisamos por WhatsApp.' };
  if (v.estado === 'rechazado') return { ok: false, msg: 'Tu solicitud no fue aprobada. Escribinos por WhatsApp si querés más info.' };
  return { ok: true, codigo: v.codigo };
}

// Lo que ve el revendedor en su panel (sin datos privados de los clientes: solo el nombre de pila).
export async function miPanel(codigo) {
  const s = await db();
  const [v] = await s`SELECT codigo, nombre, telefono, activo, estado, alias FROM vendedores WHERE codigo = ${codigo}`;
  if (!v) return { ok: false, msg: 'No encontré tu cuenta.', login: true };
  const peds = await s`SELECT nro, fecha, cliente, estado, total, comision, comision_pagada FROM pedidos WHERE vendedor = ${codigo} AND nro IS NOT NULL ORDER BY num DESC LIMIT 80`;
  const cfg = await getConfig();
  const sum = (f) => peds.filter(f).reduce((a, p) => a + Number(p.comision || 0), 0);
  return {
    ok: true, cfg: { pct: Number(cfg.comisionPct) || 0, negocio: cfg.negocio, whatsapp: cfg.whatsappWA },
    yo: { codigo: v.codigo, nombre: v.nombre, activo: v.activo, alias: v.alias },
    resumen: {
      pedidos: peds.filter((p) => p.estado !== 'Cancelado').length,
      vendido: peds.filter((p) => p.estado === 'Entregado').reduce((a, p) => a + Number(p.total), 0),
      aCobrar: sum((p) => p.estado === 'Entregado' && !p.comision_pagada),
      enCurso: sum((p) => p.estado !== 'Entregado' && p.estado !== 'Cancelado'),
      cobrado: sum((p) => !!p.comision_pagada)
    },
    ventas: peds.map((p) => ({ nro: p.nro, fecha: new Date(p.fecha).getTime(), cliente: String(p.cliente || '').split(' ')[0], estado: p.estado, total: Number(p.total), comision: Number(p.comision || 0), pagada: !!p.comision_pagada }))
  };
}

export async function cambiarAlias(codigo, alias) {
  const s = await db();
  await s`UPDATE vendedores SET alias = ${String(alias || '').slice(0, 60)} WHERE codigo = ${codigo}`;
  return { ok: true, msg: 'Guardado: te pagamos a ese alias.' };
}
