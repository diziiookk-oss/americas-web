// Club Américas: registro opcional (nombre + WhatsApp). Cuentan las compras ENTREGADAS de ese WhatsApp;
// la compra número N (5ª, 10ª, 15ª…) tiene el % de descuento. Así nadie suma compras con pedidos falsos.
import { db } from './db';
import { getConfig } from './datos';

export const ult10 = (t) => String(t || '').replace(/\D/g, '').slice(-10);

export async function estadoClub(tel, s) {
  s = s || await db();
  const cfg = await getConfig();
  const t = ult10(tel);
  const cada = Math.max(2, Number(cfg.clubCada) || 5), pct = Number(cfg.clubPct) || 0;
  const base = { activo: !!cfg.club && pct > 0, cada, pct, registrado: false, entregados: 0, progreso: 0, faltan: cada - 1, toca: false, nombre: '' };
  if (t.length < 10 || !base.activo) return base;
  const [c] = await s`SELECT nombre FROM clientes WHERE tel = ${t}`;
  const [{ n, pend }] = await s`SELECT count(*) FILTER (WHERE estado = 'Entregado')::int AS n,
      count(*) FILTER (WHERE estado NOT IN ('Entregado', 'Cancelado') AND desc_club > 0)::int AS pend
    FROM pedidos WHERE nro IS NOT NULL AND right(regexp_replace(telefono, '\\D', '', 'g'), 10) = ${t}`;
  const progreso = n % cada;
  return { ...base, registrado: !!c, nombre: c ? c.nombre.split(' ')[0] : '', entregados: n, progreso,
    faltan: cada - 1 - progreso, toca: !!c && progreso === cada - 1 && pend === 0 };
}

export async function registrarCliente({ nombre, tel, cumple, acepta }) {
  const n = String(nombre || '').trim().replace(/\s+/g, ' ').slice(0, 60);
  const t = ult10(tel);
  if (n.length < 2) return { ok: false, msg: 'Escribí tu nombre.' };
  if (t.length < 10) return { ok: false, msg: 'Escribí tu WhatsApp con característica (ej. 343 4123456).' };
  const cu = /^\d{1,2}\/\d{1,2}$/.test(String(cumple || '').trim()) ? String(cumple).trim() : '';
  const s = await db();
  await s`INSERT INTO clientes (tel, nombre, cumple, acepta) VALUES (${t}, ${n}, ${cu}, ${acepta !== false})
    ON CONFLICT (tel) DO UPDATE SET nombre = excluded.nombre, cumple = CASE WHEN excluded.cumple <> '' THEN excluded.cumple ELSE clientes.cumple END, acepta = excluded.acepta`;
  return { ok: true, msg: '¡Bienvenido al Club Américas, ' + n.split(' ')[0] + '! 🎉', estado: await estadoClub(t, s) };
}

// Para el panel: todos los que compraron (registrados o no) + los registrados sin compras.
export async function listarClientes(filtro) {
  const s = await db();
  const rows = await s`
    WITH p AS (
      SELECT right(regexp_replace(telefono, '\\D', '', 'g'), 10) AS tel, max(cliente) AS nombre_pedido,
        count(*) FILTER (WHERE estado = 'Entregado')::int AS compras, coalesce(sum(total) FILTER (WHERE estado = 'Entregado'), 0) AS gastado,
        count(*) FILTER (WHERE estado <> 'Cancelado')::int AS pedidos, max(fecha) AS ultima
      FROM pedidos WHERE nro IS NOT NULL GROUP BY 1)
    SELECT coalesce(c.tel, p.tel) AS tel, coalesce(c.nombre, p.nombre_pedido) AS nombre, c.cumple, c.acepta, c.creado, (c.tel IS NOT NULL) AS club,
      coalesce(p.compras, 0) AS compras, coalesce(p.gastado, 0) AS gastado, coalesce(p.pedidos, 0) AS pedidos, p.ultima
    FROM clientes c FULL OUTER JOIN p ON p.tel = c.tel
    ORDER BY p.ultima DESC NULLS LAST, c.creado DESC LIMIT 1000`;
  const cfg = await getConfig();
  let L = rows.map((r) => ({ tel: r.tel, nombre: r.nombre || '—', cumple: r.cumple || '', acepta: r.acepta !== false, club: r.club, compras: r.compras, gastado: Number(r.gastado), pedidos: r.pedidos,
    ultima: r.ultima ? new Date(r.ultima).getTime() : null, creado: r.creado ? new Date(r.creado).getTime() : null }));
  const total = L.length, enClub = L.filter((x) => x.club).length;
  if (filtro === 'club') L = L.filter((x) => x.club);
  if (filtro === 'dormidos') L = L.filter((x) => x.ultima && Date.now() - x.ultima > 30 * 86400000);
  if (filtro === 'mejores') L = [...L].sort((a, b) => b.gastado - a.gastado).slice(0, 50);
  return { clientes: L, total, enClub, cada: Number(cfg.clubCada) || 5, pct: Number(cfg.clubPct) || 0 };
}
