'use client';
import dynamic from 'next/dynamic';
const Panel = dynamic(() => import('./Panel'), { ssr: false, loading: () => <div className="vacio">Cargando el panel…</div> });
export default function PanelCliente() { return <Panel />; }
