import { NextResponse } from 'next/server';
import { crearPedido, girar, seguimiento, avisame, registrarEventos } from '@/lib/tienda';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const { accion } = await params;
  let b = {};
  try { b = await req.json(); } catch {}
  try {
    let r;
    if (accion === 'pedido') r = await crearPedido(b);
    else if (accion === 'girar') r = await girar(b.dispositivo);
    else if (accion === 'seguimiento') r = await seguimiento(b.lista);
    else if (accion === 'avisame') r = await avisame(b);
    else if (accion === 'eventos') { await registrarEventos(b.v, b.s, b.ev); r = { ok: true }; }
    else return NextResponse.json({ ok: false, msg: 'Acción desconocida.' }, { status: 404 });
    return NextResponse.json(r);
  } catch (e) {
    console.error(accion, e);
    return NextResponse.json({ ok: false, msg: 'Hubo un problema. Probá de nuevo en un ratito.' }, { status: 500 });
  }
}
