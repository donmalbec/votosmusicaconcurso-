# Concurso PizzaDAO x MusicaW3

Felirami aqui, estas son las mejoras que hice para reforzar la votacion desde ahora en adelante.

## Resumen

La decision fue no alterar los votos historicos. Los votos ya emitidos quedan intactos, pero el sistema queda endurecido para que los nuevos votos tengan que pasar por validaciones reales antes de entrar a la base de datos.

## Mejoras principales

- El voto ya no se escribe directo desde el navegador hacia Supabase.
- Los inserts pasan por Server Actions de Next.js.
- El correo debe verificarse con codigo OTP o magic link de Supabase Auth.
- Se bloquea un voto por correo en todo el concurso.
- Se bloquea un voto por dispositivo en todo el concurso.
- El `device_id` guardado ahora lo genera el servidor, no se confia en un valor inventado por el navegador.
- Se usa una cookie httpOnly firmada para amarrar la verificacion del dispositivo.
- Se agrego honeypot anti-bot.
- Se agrego soporte para hCaptcha.
- Se agrego rate limiting por IP y por correo para solicitudes de codigo.
- Se bloquean correos temporales conocidos.
- El panel de administracion usa sesion firmada httpOnly.
- El CSV de administracion queda protegido detras de la sesion de admin.

## Supabase

Supabase tambien fue endurecido con una migracion forward-only:

```txt
supabase/migrations/20260520000000_harden_votes_forward_only.sql
```

Esta migracion ya fue aplicada al proyecto enlazado `pizza-music-vote` (`migquiivlhupijgmlbup`).

La migracion:

- No borra votos.
- No actualiza votos existentes.
- No invalida votos historicos.
- Quita permisos directos publicos sobre `public.votes`.
- Elimina politicas publicas de lectura/escritura sobre votos crudos.
- Deja acceso a `votes` por medio de `service_role`.
- Agrega indices para busqueda por correo, dispositivo e IP.
- Agrega constraints `not valid`, que no rompen filas historicas pero si validan nuevas filas.
- Agrega un trigger `votes_insert_guardrails` para bloquear nuevos inserts duplicados por correo o dispositivo.

Tambien queda una copia explicativa en:

```txt
supabase/proposals/secure_votes_forward_only.sql
```

## Configuracion de entorno

En produccion hay que configurar estas variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://canciondepizza.fun
SITE_URL=https://canciondepizza.fun

ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
VOTE_SECURITY_SECRET=

NEXT_PUBLIC_HCAPTCHA_SITE_KEY=
HCAPTCHA_SECRET=
REQUIRE_HCAPTCHA=true

VOTE_RATE_LIMIT_MAX=20
VOTE_RATE_LIMIT_WINDOW_MS=900000
```

Recomendaciones:

- `ADMIN_PASSWORD` debe tener al menos 12 caracteres.
- `ADMIN_SESSION_SECRET` debe ser largo y aleatorio.
- `VOTE_SECURITY_SECRET` debe ser otro secreto separado, idealmente de 32 caracteres o mas.
- No subir archivos `.env` reales al repositorio.

## Configuracion de Supabase Auth

Para que el magic link funcione bien:

1. En Supabase Dashboard, configurar `Site URL`:

```txt
https://canciondepizza.fun
```

2. En la lista permitida de redirects, agregar estas URLs:

```txt
https://canciondepizza.fun/auth/confirm
https://www.canciondepizza.fun/auth/confirm
https://votosmusicaconcurso.vercel.app/auth/confirm
https://*-feliramis-projects.vercel.app/**
http://localhost:3000/auth/confirm
```

3. Configurar el template de Magic Link para incluir codigo y enlace:

```html
<h2>Codigo de verificacion</h2>
<p>Ingresa este codigo para confirmar tu voto: {{ .Token }}</p>
<p>O confirma tu correo desde este enlace:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar correo</a></p>
```

El usuario puede votar ingresando el codigo o abriendo el enlace magico desde el mismo navegador.

## Desarrollo local

Instalar dependencias:

```bash
npm install
```

Levantar el proyecto:

```bash
npm run dev
```

Abrir:

```txt
http://localhost:3000
```

## Verificaciones

Comandos usados para validar el cambio:

```bash
npx tsc --noEmit
npm run build
npm run lint
npm audit --audit-level=moderate
```

`npm run lint` pasa con advertencias existentes sobre `<img>` y carga de fuentes, sin errores.

## Reporte de auditoria

El reporte en espanol para el organizador esta en:

```txt
reports/reporte-auditoria-votos.md
```

La auditoria se hizo con datos redacted. No se guardaron correos, IPs ni dispositivos crudos en el repositorio.
