// Imagen que aparece al compartir el link (WhatsApp, Instagram, Facebook, anuncios).
// Se arma sola con los datos de Ajustes: si cambiás el descuento o el envío gratis, se actualiza.
import { ImageResponse } from 'next/og';
import { getConfig } from '@/lib/datos';
import { pagoMax, plata } from '@/lib/precios';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Américas Drugstore · Pedí online';
export const dynamic = 'force-dynamic';

const ESTRELLA = 'M24 2l6.6 15.2 16.5 1.4-12.5 10.9 3.8 16.2L24 37.1 9.6 45.7l3.8-16.2L.9 18.6l16.5-1.4z';

// Montserrat (la letra de la web). Google entrega TTF cuando no se pide woff2.
async function fuente(peso) {
  try {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Montserrat:wght@${peso}`)).text();
    const url = css.match(/src: url\(([^)]+)\) format\('(truetype|opentype)'\)/)?.[1];
    if (!url) return null;
    return { name: 'Montserrat', data: await (await fetch(url)).arrayBuffer(), weight: peso, style: 'normal' };
  } catch { return null; }
}

export default async function Imagen() {
  let c = { ciudad: 'Paraná', descPagoMap: {}, envio: true, envioGratisDesde: 0 };
  try { c = await getConfig(); } catch {}
  const fonts = (await Promise.all([fuente(700), fuente(900)])).filter(Boolean);
  const mp = pagoMax(c.descPagoMap || {});
  const chips = [];
  if (mp.pct) chips.push(mp.pct + '% OFF en ' + mp.txt);
  if (c.envio && Number(c.envioGratisDesde) > 0) chips.push('Envío gratis desde ' + plata(Number(c.envioGratisDesde)));
  chips.push('Retiro en el local');
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: 'linear-gradient(135deg, #1a0d0e 0%, #0d0d0f 60%, #0a0a0b 100%)', color: '#fff', fontFamily: fonts.length ? 'Montserrat' : 'sans-serif', position: 'relative' }}>
        <div style={{ position: 'absolute', right: -60, top: 40, width: 620, height: 620, borderRadius: 310, background: 'radial-gradient(circle, rgba(227,36,43,.45) 0%, rgba(227,36,43,0) 65%)', display: 'flex' }} />
        <svg width="420" height="420" viewBox="0 0 48 48" style={{ position: 'absolute', right: 70, top: 105 }}>
          <path d={ESTRELLA} fill="#e3242b" />
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 70px', width: 760 }}>
          <div style={{ display: 'flex', fontSize: 26, fontWeight: 800, letterSpacing: 6, color: '#ff6d72', textTransform: 'uppercase' }}>Tu drugstore en {c.ciudad || 'Paraná'}</div>
          <div style={{ display: 'flex', fontSize: 104, fontWeight: 900, letterSpacing: -3, lineHeight: 1, marginTop: 18 }}>AMÉRICAS</div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800, letterSpacing: 16, marginTop: 6 }}>DRUGSTORE</div>
          <div style={{ display: 'flex', fontSize: 46, fontWeight: 800, marginTop: 34 }}>Pedí online <span style={{ color: '#ff3d43', marginLeft: 14 }}>en 2 minutos</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 26 }}>
            {chips.map((t, i) => (
              <div key={i} style={{ display: 'flex', fontSize: 26, fontWeight: 700, padding: '12px 22px', borderRadius: 40, marginRight: 14, marginBottom: 12, background: i === 0 ? '#e3242b' : 'rgba(255,255,255,.08)', border: i === 0 ? '0' : '2px solid rgba(255,255,255,.18)' }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}
