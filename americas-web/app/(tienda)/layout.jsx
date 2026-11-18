import { getConfig, getPremiosPublicos, configPublica } from '@/lib/datos';
import { pagoMax, plata } from '@/lib/precios';
import { TiendaProvider } from '@/components/Tienda';
import Cabecera from '@/components/Cabecera';
import Pie from '@/components/Pie';

export const dynamic = 'force-dynamic';

function Marquesina({ c }) {
  const mp = pagoMax(c.descPagoMap), items = [];
  if (mp.pct) items.push(mp.pct + '% OFF pagando en ' + mp.txt);
  items.push('Pedí online y retirá en el local' + (c.envio ? ' o recibilo en tu casa' : ''));
  if (c.envio && c.envioGratisDesde > 0) items.push('Envío gratis desde ' + plata(c.envioGratisDesde));
  if (c.direccion) items.push(c.direccion);
  if (c.ruleta) items.push('Girá la ruleta y ganá premios');
  const t = items.map((x, i) => <span key={i}>{x}</span>);
  return <div className="marquee" aria-hidden="true"><div className="track">{t}{t}{t}{t}</div></div>;
}

export default async function LayoutTienda({ children }) {
  let c, premios;
  try { c = await getConfig(); premios = await getPremiosPublicos(); }
  catch (e) {
    return <main className="wrap"><div className="vacio"><h1 className="h">Américas Drugstore</h1>La página todavía no está conectada a la base de datos.<br /><small>{String(e.message || e)}</small></div></main>;
  }
  const pub = configPublica(c);
  const ld = {
    '@context': 'https://schema.org', '@type': 'ConvenienceStore', name: c.negocio, url: c.sitio || undefined, image: c.sitio ? c.sitio + '/og.png' : undefined,
    telephone: c.whatsappWA ? '+' + c.whatsappWA : undefined, priceRange: '$',
    address: { '@type': 'PostalAddress', streetAddress: String(c.direccion || '').split(',')[0], addressLocality: c.ciudad || 'Paraná', addressRegion: 'Entre Ríos', addressCountry: 'AR' },
    ...(c.mapaLat && c.mapaLng ? { geo: { '@type': 'GeoCoordinates', latitude: Number(c.mapaLat), longitude: Number(c.mapaLng) } } : {}),
    description: c.nosotros, sameAs: c.instagram ? ['https://instagram.com/' + String(c.instagram).replace(/^@/, '')] : undefined,
    potentialAction: c.sitio ? { '@type': 'SearchAction', target: c.sitio + '/productos?q={q}', 'query-input': 'required name=q' } : undefined
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <TiendaProvider cfg={pub} premios={premios}>
          <Marquesina c={c} />
          <Cabecera direccion={c.direccion} />
          <main className="wrap">{!c.abierta && <div className="cerrado">{c.msgCerrada}</div>}{children}</main>
          <Pie c={c} />
        </TiendaProvider>
    </>
  );
}
