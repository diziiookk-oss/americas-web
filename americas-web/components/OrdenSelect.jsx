'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
export default function OrdenSelect({ valor }) {
  const router = useRouter(), pathname = usePathname(), sp = useSearchParams();
  return (<label>Ordenar por <select value={valor} onChange={(e) => { const p = new URLSearchParams(sp.toString()); p.set('orden', e.target.value); p.delete('pagina'); router.replace(pathname + '?' + p.toString(), { scroll: false }); }}>
    {[['pop', 'Más vendidos'], ['menor', 'Menor precio'], ['mayor', 'Mayor precio'], ['desc', 'Mayor descuento'], ['az', 'A → Z']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}
  </select></label>);
}
