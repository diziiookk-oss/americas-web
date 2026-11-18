// La caja (Google Sheets) habla con la web por acá, con la clave CAJA_KEY.
import { NextResponse } from 'next/server';
import { esCaja, sincronizar, listarPedidos, cambiarEstado } from '@/lib/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const no = () => NextResponse.json({ ok: false, msg: 'Clave de la caja incorrecta.' }, { status: 401 });

export async function GET(req, { params }) {
  const { accion } = await params;
  if (!esCaja(req)) return no();
  try {
    if (accion === 'ping') return NextResponse.json({ ok: true, msg: 'Conectado con la web.' });
    if (accion === 'pedidos') return NextResponse.json({ ok: true, ...(await listarPedidos(150)) });
    return NextResponse.json({ ok: false, msg: 'Acción desconocida.' }, { status: 404 });
  } catch (e) { console.error(e); return NextResponse.json({ ok: false, msg: String(e.message || e) }, { status: 500 }); }
}

export async function POST(req, { params }) {
  const { accion } = await params;
  if (!esCaja(req)) return no();
  let b = {};
  try { b = await req.json(); } catch {}
  try {
    if (accion === 'sync') return NextResponse.json(await sincronizar(b));
    if (accion === 'estado') return NextResponse.json(await cambiarEstado(b));
    return NextResponse.json({ ok: false, msg: 'Acción desconocida.' }, { status: 404 });
  } catch (e) { console.error(e); return NextResponse.json({ ok: false, msg: String(e.message || e) }, { status: 500 }); }
}
