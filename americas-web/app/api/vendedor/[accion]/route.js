// Cuenta del revendedor: registro, entrar/salir y su panel.
import { NextResponse } from 'next/server';
import * as V from '@/lib/vendedor';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const { accion } = await params;
  let b = {};
  try { b = await req.json(); } catch {}
  try {
    if (accion === 'registro') return NextResponse.json(await V.registrar(b));
    if (accion === 'login') {
      const r = await V.login(b);
      if (!r.ok) return NextResponse.json(r);
      const res = NextResponse.json({ ok: true });
      res.cookies.set('ad_vend', V.tokenVendedor(r.codigo), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 120 });
      return res;
    }
    if (accion === 'salir') { const res = NextResponse.json({ ok: true }); res.cookies.delete('ad_vend'); return res; }
    const codigo = V.vendedorDe(req);
    if (!codigo) return NextResponse.json({ ok: false, login: true, msg: 'Entrá con tu cuenta.' });
    if (accion === 'yo') return NextResponse.json(await V.miPanel(codigo));
    if (accion === 'alias') return NextResponse.json(await V.cambiarAlias(codigo, b.alias));
    return NextResponse.json({ ok: false, msg: 'Acción desconocida.' }, { status: 404 });
  } catch (e) { console.error(accion, e); return NextResponse.json({ ok: false, msg: 'Hubo un error. Probá de nuevo.' }, { status: 500 }); }
}
