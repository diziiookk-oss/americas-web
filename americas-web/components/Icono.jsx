import { norm } from '@/lib/precios';

export const IC = {
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>', grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  star: '<path d="M12 3l2.7 5.9 6.3.6-4.8 4.2 1.4 6.3L12 16.8 6.4 20l1.4-6.3L3 9.5l6.3-.6z" fill="currentColor" stroke="none"/>',
  shop: '<path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16M9 20v-6h6v6"/>', plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', back: '<path d="M15 18l-6-6 6-6"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  moto: '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M9 17h6l-2-6h-3M13 6h3l3 8"/>', cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>',
  gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9M12 8C10 4 7 4 7 6.5S10 8 12 8zm0 0c2-4 5-4 5-1.5S14 8 12 8z"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/>',
  wa: '<path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z"/>', ig: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5v.01"/>', receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3"/>',
  wheel: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', bag: '<path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  candy: '<path d="M8.5 8.5a5 5 0 0 1 7 7 5 5 0 0 1-7-7zM8.5 8.5L5 5l-1 3-2 0 3 3M15.5 15.5L19 19l1-3h2l-3-3"/>', cookie: '<path d="M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3-3 3 3 0 0 1-3-3 3 3 0 0 1-3-3z"/><path d="M8.5 10v.01M12 15v.01M8 15.5v.01M15.5 13v.01"/>',
  cup: '<path d="M6 8h12l-1.5 12h-9zM5 8h14M9 8l1-5h4"/><path d="M7 13h10"/>', wine: '<path d="M8 3h8l-.5 5a3.5 3.5 0 0 1-7 0zM12 11.5V20M8 20h8"/>', coffee: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M11 3v3M14 3v3"/>',
  leaf: '<path d="M5 19C5 10 11 5 20 4c-1 9-6 15-15 15zM5 19l8-8"/>', basket: '<path d="M3 10h18l-2 10H5zM8 10l3-6M16 10l-3-6M9 14v3M12 14v3M15 14v3"/>', smoke: '<path d="M3 15h14v3H3zM19 15v3M21 15v3M17 11c0-2 2-2 2-4M20 11c0-2 2-2 2-4"/>',
  bottle: '<path d="M10 3h4v3l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z"/><path d="M8 13h8"/>', battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4M7 10v4M11 10v4"/>', milk: '<path d="M8 3h8v3l2 3v12H6V9l2-3z"/><path d="M6 13h12"/>',
  meat: '<path d="M15 4a5 5 0 0 1 4.5 7.2L11 19.6a3 3 0 1 1-4-4L15.3 7"/><circle cx="15" cy="8" r="1.5"/>', bread: '<path d="M5 11a4 4 0 0 1 0-8h14a4 4 0 0 1 0 8v9H5z"/>', apple: '<path d="M12 7c-3-2-8-1-8 5s3 9 5 9c1 0 2-.5 3-.5s2 .5 3 .5c2 0 5-3 5-9s-5-7-8-5zM12 7c0-2 1-4 3-4"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>', clean: '<path d="M9 3h6l-1 4h-4zM7 7h10l1 14H6zM10 11v6M14 11v6"/>', ice: '<path d="M7 10a5 5 0 0 1 10 0zM8 10l4 11 4-11"/>'
};

export function Ic({ n, cl = '', style }) {
  return <svg className={'i ' + cl} viewBox="0 0 24 24" style={style} aria-hidden="true" dangerouslySetInnerHTML={{ __html: IC[n] || IC.tag }} />;
}

export function iconoCat(c) {
  const n = norm(c);
  const M = [[/kiosc|golos|carame|chicle|choco/, 'candy'], [/galle|snack|alfaj/, 'cookie'], [/alcoh|vino|cerve|fernet|licor|whisk/, 'wine'], [/bebid|gaseo|jugo|agua/, 'cup'], [/cafe|infus|yerba|\bte\b/, 'coffee'],
    [/dietet|cereal|semill|fruto|natural|granel/, 'leaf'], [/despen|almac|alimen/, 'basket'], [/cigar|tabac/, 'smoke'], [/perfum|higien|cosme/, 'bottle'], [/hogar|pila|bateri/, 'battery'], [/limpi/, 'clean'],
    [/regal|termo|juguet/, 'gift'], [/lacte|leche|queso|fiambr/, 'milk'], [/carne|pollo|granja|milanes|congel/, 'meat'], [/pan|factur|panad/, 'bread'], [/fruta|verdu/, 'apple'], [/helad/, 'ice'], [/oferta/, 'star']];
  for (const [re, ic] of M) if (re.test(n)) return ic;
  return 'tag';
}

export function iniciales(n) { return String(n).split(/\s+/).filter((w) => /[a-záéíóúñ]/i.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase(); }

export const ESTRELLA = 'M24 2l6.6 15.2 16.5 1.4-12.5 10.9 3.8 16.2L24 37.1 9.6 45.7l3.8-16.2L.9 18.6l16.5-1.4z';

export function Logo({ alto = 46 }) {
  return (
    <svg viewBox="0 0 300 64" role="img" aria-label="Américas Drugstore" style={{ height: alto, width: 'auto', display: 'block' }}>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff4a50" /><stop offset="1" stopColor="#c9161c" /></linearGradient></defs>
      <path d={ESTRELLA} fill="url(#lg)" />
      <text x="50" y="40" fontFamily="Montserrat, Arial Black, Arial, sans-serif" fontWeight="900" fontSize="41" fill="#fff" letterSpacing="-.5">AMERICAS</text>
      <rect x="50" y="51" width="34" height="3" rx="1.5" fill="#e3242b" /><rect x="262" y="51" width="34" height="3" rx="1.5" fill="#e3242b" />
      <text x="173" y="58" textAnchor="middle" fontFamily="Montserrat, Arial Black, Arial, sans-serif" fontWeight="800" fontSize="13" fill="#fff" letterSpacing="7.2">DRUGSTORE</text>
    </svg>
  );
}
