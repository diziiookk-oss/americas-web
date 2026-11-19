// Conexión a la base de datos (Postgres: Neon desde Vercel, o Supabase).
// Las tablas se crean solas la primera vez.
import postgres from 'postgres';

const g = globalThis;

export function sql() {
  if (!g.__sql) {
    const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('Falta DATABASE_URL: conectá una base de datos (Netlify → Extensions → Neon, o pegá DATABASE_URL).');
    const local = /localhost|127\.0\.0\.1|\/tmp/.test(url);
    g.__sql = postgres(url, { ssl: local ? false : 'require', max: 5, idle_timeout: 20, connect_timeout: 15, onnotice: () => {} });
  }
  return g.__sql;
}

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS config (clave text PRIMARY KEY, valor jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS productos (
  id text PRIMARY KEY, slug text UNIQUE NOT NULL, nombre text NOT NULL, marca text DEFAULT '', categoria text DEFAULT 'Otros',
  unidad text DEFAULT 'un', precio numeric NOT NULL DEFAULT 0, oferta numeric, escalones jsonb DEFAULT '[]', img text DEFAULT '',
  stock numeric, pop int DEFAULT 0, activo boolean DEFAULT true,
  oculto boolean DEFAULT false, img_web text DEFAULT '', descripcion text DEFAULT '', destacado boolean DEFAULT false,
  actualizado timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS productos_cat ON productos (categoria);
CREATE TABLE IF NOT EXISTS premios (
  id serial PRIMARY KEY, orden int DEFAULT 0, texto text NOT NULL, tipo text NOT NULL, valor numeric DEFAULT 0, peso numeric DEFAULT 10,
  minimo numeric DEFAULT 0, categoria text DEFAULT '', activo boolean DEFAULT true
);
CREATE TABLE IF NOT EXISTS giros (
  id serial PRIMARY KEY, fecha timestamptz DEFAULT now(), dispositivo text, premio text, tipo text, codigo text UNIQUE,
  usado_en text DEFAULT '', telefono text DEFAULT '', vence timestamptz
);
CREATE INDEX IF NOT EXISTS giros_disp ON giros (dispositivo, fecha);
CREATE TABLE IF NOT EXISTS pedidos (
  num serial PRIMARY KEY, nro text UNIQUE, fecha timestamptz DEFAULT now(), cliente text, telefono text, entrega text, direccion text DEFAULT '',
  pago text, items jsonb, detalle text, subtotal numeric, desc_premio numeric DEFAULT 0, desc_pago numeric DEFAULT 0, envio numeric DEFAULT 0,
  total numeric, premio text DEFAULT '', estado text DEFAULT 'Nuevo', nota text DEFAULT '', ticket text DEFAULT '', cobrado_en_caja boolean DEFAULT false,
  actualizado timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pedidos_fecha ON pedidos (fecha);
CREATE TABLE IF NOT EXISTS eventos (
  id bigserial PRIMARY KEY, fecha timestamptz DEFAULT now(), visitante text, sesion text, tipo text, detalle text
);
CREATE INDEX IF NOT EXISTS eventos_fecha ON eventos (fecha);
CREATE TABLE IF NOT EXISTS avisos (
  id serial PRIMARY KEY, fecha timestamptz DEFAULT now(), producto text, cliente text, telefono text, estado text DEFAULT 'Pendiente'
);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS etiqueta text DEFAULT '';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS costo numeric;
CREATE TABLE IF NOT EXISTS vendedores (
  codigo text PRIMARY KEY, nombre text NOT NULL, telefono text DEFAULT '', activo boolean DEFAULT true, creado timestamptz DEFAULT now()
);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS vendedor text DEFAULT '';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS ganancia numeric DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS comision numeric DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS sin_costo int DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS comision_pagada timestamptz;
CREATE INDEX IF NOT EXISTS pedidos_vendedor ON pedidos (vendedor);
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS clave text DEFAULT '';
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS estado text DEFAULT 'activo';
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS nota text DEFAULT '';
ALTER TABLE vendedores ADD COLUMN IF NOT EXISTS alias text DEFAULT '';
`;

const PREMIOS_DEF = [
  ['5% OFF', 'Descuento %', 5, 30, 0, ''], ['Otra vez', 'Otra vez', 0, 14, 0, ''], ['Envío gratis', 'Envío gratis', 0, 14, 0, ''],
  ['10% OFF', 'Descuento %', 10, 10, 10000, ''], ['$500 OFF', 'Descuento $', 500, 14, 5000, ''], ['Seguí participando', 'Sin premio', 0, 18, 0, '']
];

export async function db() {
  const s = sql();
  if (!g.__migrado) {
    g.__migrado = (async () => {
      await s.unsafe(ESQUEMA);
      const [{ n }] = await s`SELECT count(*)::int AS n FROM premios`;
      if (!n) for (let i = 0; i < PREMIOS_DEF.length; i++) {
        const p = PREMIOS_DEF[i];
        await s`INSERT INTO premios (orden, texto, tipo, valor, peso, minimo, categoria) VALUES (${i}, ${p[0]}, ${p[1]}, ${p[2]}, ${p[3]}, ${p[4]}, ${p[5]})`;
      }
    })().catch((e) => { g.__migrado = null; throw e; });
  }
  await g.__migrado;
  return s;
}
