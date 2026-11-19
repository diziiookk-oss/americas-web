import VendedorApp from '@/components/VendedorApp';
import { getConfig } from '@/lib/datos';

export const metadata = {
  title: 'Vendé con nosotros y ganá plata',
  description: 'Creá tu cuenta de revendedor de Américas Drugstore: compartís tu link y ganás una parte de cada venta. Te pagamos todas las semanas.'
};

export default async function Vendedor() {
  let pct = 30;
  try { pct = Number((await getConfig()).comisionPct) || 30; } catch {}
  return <VendedorApp pct={pct} />;
}
