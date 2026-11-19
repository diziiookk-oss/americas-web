'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Ic, ESTRELLA } from './Icono';
import { useTienda } from './Tienda';

function Arte({ chips }) {
  const pos = [['8%', '-4%'], ['78%', '6%'], ['86%', '62%'], ['2%', '72%']];
  return (<div className="arte" aria-hidden="true"><div className="orb" /><div className="orb o2" />
    <svg className="estrella" viewBox="0 0 48 48"><defs><linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff4a50" /><stop offset="1" stopColor="#b3121a" /></linearGradient></defs><path d={ESTRELLA} fill="url(#ge)" /></svg>
    {(chips || []).slice(0, 4).map((c, i) => <span key={i} className="chipf" style={{ top: pos[i][0], left: pos[i][1], animationDelay: i * 0.7 + 's' }}><i />{c}</span>)}</div>);
}

// slides: [{ kicker, titulo, em, despues, texto, botones: [{t, href|accion, o}], chips }]
export default function Portada({ slides }) {
  const { abrirRuleta, ev } = useTienda();
  const [i, setI] = useState(0);
  const x0 = useRef(null), pausa = useRef(false);
  const n = slides.length;
  useEffect(() => { if (n < 2) return; const t = setInterval(() => { if (!pausa.current) setI((v) => (v + 1) % n); }, 6500); return () => clearInterval(t); }, [n]);
  const btn = (b, k) => b.accion === 'ruleta' ? <button key={k} className={'btn ' + (b.o ? 'o' : 'r')} onClick={abrirRuleta}>{b.t} <Ic n="wheel" cl="s" /></button>
    : /^https?:/.test(b.href) ? <a key={k} className={'btn ' + (b.o ? 'o' : 'r')} href={b.href} target="_blank" rel="noopener" onClick={() => ev('whatsapp', 'portada')}><Ic n="wa" cl="s" /> {b.t}</a>
      : <Link key={k} className={'btn ' + (b.o ? 'o' : 'r')} href={b.href}>{b.t}{!b.o && <Ic n="arrow" cl="s" />}</Link>;
  return (
    <section className="hero tema-oscuro" aria-label="Destacados">
      <div className="slides" style={{ transform: `translateX(${-100 * i}%)` }}
        onTouchStart={(e) => { x0.current = e.touches[0].clientX; pausa.current = true; }}
        onTouchEnd={(e) => { if (x0.current === null) return; const dx = e.changedTouches[0].clientX - x0.current; if (Math.abs(dx) > 40) setI((v) => (v + (dx < 0 ? 1 : -1) + n) % n); x0.current = null; }}>
        {slides.map((s, k) => (
          <div className="slide" key={k} aria-hidden={k !== i}>
            <div className="tx">
              <span className="kicker">★ {s.kicker}</span>
              {k === 0 ? <h1 className="h2s">{s.titulo} <em>{s.em}</em>{s.despues}</h1> : <h2>{s.titulo} <em>{s.em}</em>{s.despues}</h2>}
              <p>{s.texto}</p>
              <div className="btns">{s.botones.map(btn)}</div>
            </div>
            <Arte chips={s.chips} />
          </div>))}
      </div>
      {n > 1 && <div className="dots">{slides.map((s, k) => <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={'Destacado ' + (k + 1)} />)}</div>}
    </section>
  );
}

export function RuletaCTA() {
  const { abrirRuleta, premio, cfg, premios } = useTienda();
  if (premio || !cfg.ruleta || premios.length < 2) return null;
  return (<><div className="sec" /><div className="caja" style={{ cursor: 'pointer', borderColor: 'rgba(227,36,43,.45)', padding: 16 }} onClick={abrirRuleta}>
    <div className="ic" style={{ width: 48, height: 48 }}><Ic n="wheel" cl="l" /></div>
    <div style={{ flex: 1 }}><b style={{ font: '900 17px/1.1 var(--hf)', textTransform: 'uppercase' }}>Girá la ruleta</b><br /><span className="muted">Ganá descuentos para esta compra</span></div>
    <span className="btn r" style={{ padding: '12px 16px' }}>Girar</span></div></>);
}
