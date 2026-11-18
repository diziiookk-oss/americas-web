# Américas Drugstore — página web

Tienda online independiente de la caja: tiene su propia base de datos y su propio panel (`/admin`).
Los productos, precios, ofertas, fotos y stock llegan solos desde la caja (cada hora o con un botón).
Los pedidos de la web aparecen en la caja para cobrarlos con un toque.

## Qué hace falta (todo gratis)

| Para qué | Dónde |
|---|---|
| Guardar el código | GitHub (github.com) |
| Publicar la página | Netlify (netlify.com): su plan gratis permite negocios |
| Base de datos | Neon (neon.tech): plan gratis |
| Tu dirección propia (opcional) | NIC.ar: un dominio .com.ar sale unos pocos miles de pesos por año |

Hacelo desde la compu: tarda unos 20 minutos.

## 1. Base de datos (Neon)
1. Entrá a neon.tech → "Sign up" (podés usar tu cuenta de Google).
2. Creá un proyecto: nombre `americas`, región **AWS São Paulo** (la más cerca).
3. En "Connection string" copiá el link que empieza con `postgresql://…`. Ese es tu `DATABASE_URL`.

## 2. Subir el código (GitHub)
1. Creá una cuenta en github.com.
2. Arriba a la derecha: **+ → New repository**. Nombre: `americas-web`. Marcá **Private** → Create.
3. Tocá "uploading an existing file", arrastrá **todo lo que hay adentro** de esta carpeta (no la carpeta en sí) → **Commit changes**.

## 3. Publicar (Netlify)
1. Entrá a netlify.com → "Sign up" con tu cuenta de GitHub.
2. **Add new site → Import an existing project → GitHub** → elegí `americas-web`.
3. Antes de publicar, en **Environment variables** agregá:
   - `DATABASE_URL` = el link de Neon del paso 1.
   - `ADMIN_PASSWORD` = la contraseña para entrar al panel de la web (inventala).
   - `CAJA_KEY` = una clave larga para la caja (por ejemplo, 30 letras y números al azar). Guardala: la vas a pegar en la caja.
   - **Si algún día cambiás una de estas claves, hay que volver a publicar la web** (si no, sigue usando la vieja). La misma `CAJA_KEY` va en la caja: Apps Script → ⚙️ Configuración del proyecto → Propiedades de la secuencia de comandos → `CAJA_KEY`.
4. **Deploy**. En 2 o 3 minutos te da un link tipo `https://americas-web.netlify.app`.

## 4. Conectar la caja
1. En tu Apps Script reemplazá **Código.gs**, **Web.gs** e **Index.html** por los nuevos, y publicá una versión nueva (Implementar → Gestionar implementaciones → ✏️ → Nueva versión).
2. Ejecutá una vez la función `autorizarPermisos` y aceptá (ahora pide permiso para conectarse a la web y para actualizarla cada hora).
3. En la página de la caja: **Panel → Tienda online** → pegá el link de Netlify y la `CAJA_KEY` → **Conectar**.
   Se copian todos los productos y desde ahí se actualiza sola cada hora.

## 5. Configurar la web
Entrá a `tu-link/admin` con tu `ADMIN_PASSWORD` → **Ajustes**: WhatsApp del negocio, horario, envíos, descuentos por medio de pago, textos. En **Ruleta** elegís los premios.

## 6. Tu dominio y Google
1. **Dominio:** registrá `americasdrugstore.com.ar` (o el que esté libre) en nic.ar con tu clave fiscal. En Netlify → **Domain management → Add a domain**, y en NIC.ar delegá el dominio a los "nameservers" que te muestra Netlify. En unas horas la web anda con tu dirección.
2. **Perfil de Empresa en Google** (business.google.com): creá o reclamá "Américas Drugstore" con tu dirección, horario, fotos y el link de la web. Es lo que más rápido te hace aparecer cuando buscan tu nombre.
3. **Google Search Console** (search.google.com/search-console): agregá tu dominio y en "Sitemaps" mandá `sitemap.xml`. Así Google lee todos tus productos.

## Para el programador (si algún día lo necesitás)
Next.js 15 + Postgres. Variables: `DATABASE_URL`, `ADMIN_PASSWORD`, `CAJA_KEY`, opcional `SITE_URL` (Netlify ya da `URL`). Las tablas se crean solas.
API de la caja: `POST /api/caja/sync`, `GET /api/caja/pedidos`, `POST /api/caja/estado` (con `Authorization: Bearer CAJA_KEY`).
