import { NextResponse } from 'next/server';
import { crearPedido, girar, seguimiento, avisame, registrarEventos } from '@/lib/tienda';
import { registrarCliente, entrarCliente, miClub, clienteDe, tokenCliente } from '@/lib/club';

export const dynamic = 'force-dynamic';

const conSesion = (r, tel) => {
  const res = NextResponse.json(r);
  res.cookies.set('ad_cli', tokenCliente(tel), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 });
  return res;
};

export async function POST(req, { params }) {
  const { accion } = await params;
  let b = {};
  try { b = await req.json(); } catch {}
  try {
    let r;
    if (accion === 'pedido') r = await crearPedido(b, clienteDe(req));   // el premio del Club solo con la sesión del socio
    else if (accion === 'girar') r = await girar(b.dispositivo);
    else if (accion === 'seguimiento') r = await seguimiento(b.lista);
    else if (accion === 'avisame') r = await avisame(b);
    else if (accion === 'miClub') { const tel = clienteDe(req); r = tel ? await miClub(tel) : { ok: false, login: true }; }
    else if (accion === 'unirme') { r = await registrarCliente(b); if (r.ok) return conSesion(r, r.tel); }
    else if (accion === 'entrarClub') { r = await entrarCliente(b); if (r.ok) return conSesion(r, r.tel); }
    else if (accion === 'salirClub') { const res = NextResponse.json({ ok: true }); res.cookies.delete('ad_cli'); return res; }
    else if (accion === 'eventos') { await registrarEventos(b.v, b.s, b.ev); r = { ok: true }; }
    else return NextResponse.json({ ok: false, msg: 'Acción desconocida.' }, { status: 404 });
    return NextResponse.json(r);
  } catch (e) {
    console.error(accion, e);
    return NextResponse.json({ ok: false, msg: 'Hubo un problema. Probá de nuevo en un ratito.' }, { status: 500 });
  }
}
