import PanelCliente from './PanelCliente';
export const metadata = { title: 'Panel', robots: { index: false, follow: false } };
// El panel se dibuja solo en el navegador (no en el servidor): evita pantallas en blanco por diferencias
// entre lo que arma el servidor y lo que ve el navegador (extensiones, traductores, zona horaria).
export default function Admin() { return <main className="admroot"><PanelCliente /></main>; }
