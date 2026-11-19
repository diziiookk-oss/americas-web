import { NextResponse } from 'next/server';
import * as A from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const { accion } = await params;
  let b = {};
  try { b = await req.json(); } catch {}
  if (accion === 'login') {
    if (!process.env.ADMIN_PASSWORD) return NextResponse.json({ ok: false, msg: 'Falta configurar ADMIN_PASSWORD en Vercel.' });
    if (!A.claveOk(b.clave)) { await new Promise((r) => setTimeout(r, 800)); return NextResponse.json({ ok: false, msg: 'Contraseña incorrecta.' }); }
    const res = NextResponse.json({ ok: true });
    res.cookies.set('ad_admin', A.tokenAdmin(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 60 });
    return res;
  }
  if (accion === 'logout') { const res = NextResponse.json({ ok: true }); res.cookies.delete('ad_admin'); return res; }
  if (!A.esAdmin(req)) return NextResponse.json({ ok: false, msg: 'Tenés que entrar de nuevo.', login: true }, { status: 401 });
  try {
    let r;
    switch (accion) {
      case 'pedidos': r = { ok: true, ...(await A.listarPedidos(200)) }; break;
      case 'estado': r = await A.cambiarEstado(b); break;
      case 'estadisticas': r = { ok: true, ...(await A.estadisticas(b.dias)) }; break;
      case 'config': r = { ok: true, config: await A.leerConfig() }; break;
      case 'guardarConfig': r = await A.guardarConfig(b.config || {}); break;
      case 'premios': r = { ok: true, ...(await A.leerPremios()) }; break;
      case 'guardarPremios': r = await A.guardarPremios(b.premios); break;
      case 'avisos': r = { ok: true, avisos: await A.leerAvisos() }; break;
      case 'aviso': r = await A.marcarAviso(b.id, b.estado); break;
      case 'productos': r = { ok: true, ...(await A.leerProductosAdmin(b.q, b.filtro)) }; break;
      case 'producto': r = await A.editarProducto(b); break;
      case 'categorias': r = { ok: true, categorias: await A.categorias() }; break;
      default: return NextResponse.json({ ok: false, msg: 'Acción desconocida.' }, { status: 404 });
    }
    return NextResponse.json(r);
  } catch (e) { console.error(accion, e); return NextResponse.json({ ok: false, msg: String(e.message || e) }, { status: 500 }); }
}
