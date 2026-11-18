import './globals.css';
import { getConfig } from '@/lib/datos';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  let c = { negocio: 'Américas Drugstore', ciudad: 'Paraná', sitio: '' };
  try { c = await getConfig(); } catch {}
  const desc = `${c.negocio}: drugstore en ${c.ciudad || 'Paraná'}, Entre Ríos. Kiosco, bebidas, dietética y despensa. Pedí online y retirá en el local o recibilo en tu casa.`;
  return {
    metadataBase: c.sitio ? new URL(c.sitio) : undefined,
    title: { default: `${c.negocio} · Drugstore en ${c.ciudad || 'Paraná'} · Pedí online`, template: `%s | ${c.negocio}` },
    description: desc,
    keywords: ['américas drugstore', 'americas drugstore', 'drugstore paraná', 'kiosco paraná', 'dietética paraná', 'delivery paraná', 'av de las américas'],
    openGraph: { type: 'website', locale: 'es_AR', siteName: c.negocio, title: c.negocio, description: desc, images: ['/og.png'] },
    twitter: { card: 'summary_large_image', images: ['/og.png'] },
    alternates: { canonical: '/' },
    icons: { icon: '/icon.svg', apple: '/apple-icon.png' },
    formatDetection: { telephone: false }
  };
}
export const viewport = { themeColor: '#0a0a0b', width: 'device-width', initialScale: 1, maximumScale: 1, viewportFit: 'cover' };

export default function Raiz({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
