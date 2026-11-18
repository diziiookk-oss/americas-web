'use client';
import { useEffect } from 'react';
import { useTienda } from './Tienda';
// Anota un evento de estadística cuando se abre una página (por ejemplo, qué producto se vio).
export default function Registrar({ tipo, detalle }) {
  const { ev, cargado } = useTienda();
  useEffect(() => { if (cargado && detalle) ev(tipo, detalle); }, [cargado, tipo, detalle]); // eslint-disable-line
  return null;
}
