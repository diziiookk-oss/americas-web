import Link from 'next/link';
export default function NoEncontrado() {
  return <div className="vacio"><h1 className="h1pag" style={{ marginBottom: 10 }}>No encontramos esa página</h1>Puede que el producto ya no esté disponible.<br /><br /><Link className="btn r" href="/productos">Ver productos</Link></div>;
}
