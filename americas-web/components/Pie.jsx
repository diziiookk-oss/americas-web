'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './Icono';
import { useTienda } from './Tienda';

export default function Pie({ c }) {
  const pathname = usePathname();
  const { abrirRuleta, cfg } = useTienda();
  if (pathname.startsWith('/admin')) return null;
  const wa = cfg.whatsapp ? 'https://wa.me/' + cfg.whatsapp : '';
  return (
    <footer className="tema-oscuro">
      <div className="wrap">
        <div><Logo alto={40} /><p style={{ maxWidth: 380 }}>{c.nosotros}</p></div>
        <div><b>Tienda</b><Link href="/productos">Productos</Link><Link href="/ofertas">Ofertas</Link><Link href="/mis-pedidos">Mis pedidos</Link>{cfg.ruleta && <a onClick={abrirRuleta}>Ruleta de premios</a>}<Link href="/nosotros">Nosotros</Link><Link href="/club">⭐ Club Américas</Link><Link href="/vendedor">💰 Vendé con nosotros</Link></div>
        <div><b>Contacto</b>{c.direccion && <a href={'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(c.negocio + ' ' + c.direccion)} target="_blank" rel="noopener">{c.direccion}</a>}
          {c.horario && <a>{c.horario}</a>}{wa && <a href={wa} target="_blank" rel="noopener">WhatsApp</a>}{cfg.instagram && <a href={'https://instagram.com/' + cfg.instagram} target="_blank" rel="noopener">@{cfg.instagram}</a>}</div>
        <div style={{ gridColumn: '1/-1', fontSize: 11.5, borderTop: '1px solid var(--line)', paddingTop: 14 }}>Precios en pesos argentinos, con IVA incluido. Pueden cambiar sin aviso. Fotos ilustrativas. © {new Date().getFullYear()} {c.negocio}</div>
      </div>
    </footer>
  );
}
