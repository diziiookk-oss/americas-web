import { getConfig } from '@/lib/datos';
import { Ic } from '@/components/Icono';

export async function generateMetadata() {
  const c = await getConfig();
  return { title: 'Nosotros · Dónde estamos', description: `${c.negocio} está en ${c.direccion}. ${c.horario}. ${c.serviciosLista.join(', ')}.`, alternates: { canonical: '/nosotros' } };
}

export default async function Nosotros() {
  const c = await getConfig();
  const mapa = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.negocio + ' ' + c.direccion);
  const emb = 'https://maps.google.com/maps?q=' + encodeURIComponent(c.mapaLat && c.mapaLng ? c.mapaLat + ',' + c.mapaLng : c.direccion) + '&z=16&output=embed';
  return (<div className="about">
    <div className="panel" style={{ background: 'radial-gradient(500px 300px at 100% 0%, rgba(227,36,43,.2), transparent 70%), var(--card)' }}>
      <span className="kicker">★ Sobre nosotros</span>
      <h1 className="h" style={{ fontSize: 32, lineHeight: 1.05, margin: '16px 0 10px' }}>{c.negocio}</h1>
      <p style={{ color: 'var(--txt2)', fontSize: 16 }}>{c.nosotros}</p>
      {c.serviciosLista.length > 0 && <><b style={{ font: '800 12px/1 var(--hf)', letterSpacing: 1, color: 'var(--mute)' }}>Servicios en el local</b>
        <div className="serv">{c.serviciosLista.map((s) => <span key={s}>{s}</span>)}</div></>}
      {c.direccion && <iframe title="Mapa" src={emb} loading="lazy" style={{ width: '100%', height: 240, border: 0, borderRadius: 16, marginTop: 18, filter: 'grayscale(.3) invert(.92) hue-rotate(180deg)' }} />}
    </div>
    <div className="panel"><h2 className="h" style={{ fontSize: 18, margin: '0 0 10px' }}>Dónde estamos</h2>
      {c.direccion && <div className="dato"><div className="ic"><Ic n="pin" /></div><div><small>Dirección</small>{c.direccion}</div></div>}
      {c.horario && <div className="dato"><div className="ic"><Ic n="clock" /></div><div><small>Horario</small>{c.horario}</div></div>}
      {c.whatsappWA && <div className="dato"><div className="ic"><Ic n="wa" /></div><div><small>WhatsApp</small>+{c.whatsappWA}</div></div>}
      {c.instagram && <div className="dato"><div className="ic"><Ic n="ig" /></div><div><small>Instagram</small>@{String(c.instagram).replace(/^@/, '')}</div></div>}
      <div className="btns" style={{ marginTop: 14 }}><a className="btn r" href={mapa} target="_blank" rel="noopener"><Ic n="pin" cl="s" /> Cómo llegar</a>{c.whatsappWA && <a className="btn w" href={'https://wa.me/' + c.whatsappWA} target="_blank" rel="noopener"><Ic n="wa" cl="s" /> Escribinos</a>}</div>
    </div>
  </div>);
}
