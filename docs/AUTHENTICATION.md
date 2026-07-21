# Authentication and Transactional Email

## Objetivo

Este documento describe el flujo implementado de autenticacion y correo. Neon Auth es la fuente de verdad para identidad, credenciales, email verificado y sesiones; las tablas app-owned solo guardan perfil, preferencias, bloqueo y auditoria del producto.

## Funcionalidad implementada

- Registro con email/password.
- Verificacion obligatoria de correo antes de entrar al dashboard.
- Login y logout con sesiones de Neon Auth.
- Recuperacion y cambio de contrasena.
- Proteccion server-side del dashboard para sesiones ausentes, usuarios bloqueados y correos no verificados.
- Creacion idempotente de `user_profiles` y `user_preferences`.
- Emails de verificacion y recuperacion personalizados con Resend.
- UI y emails localizados en `es` y `en`.

OAuth con Google no forma parte de esta fase. Los botones visibles estan deshabilitados y localizados como funcionalidad futura.

## Limites de responsabilidad

### Neon Auth

- Usuarios de identidad y credenciales.
- Tokens y links de verificacion o recuperacion.
- Estado de email verificado.
- Sesiones y cookies de autenticacion.
- Emision del webhook `send.magic_link`.

### Aplicacion

- Server Actions y pantallas de auth.
- Perfiles, preferencias, bloqueo y auditoria app-owned.
- Validacion criptografica del webhook.
- Seleccion de idioma, renderizado HTML y entrega mediante Resend.

No se leen ni modifican tablas internas del schema `neon_auth` desde Drizzle.

## Variables de entorno

Usar `.env.example` como referencia y guardar valores reales solo en `.env.local` o en el gestor de secretos del ambiente:

```dotenv
DATABASE_URL=postgresql://...
NEON_AUTH_BASE_URL=https://.../neondb/auth
NEON_AUTH_COOKIE_SECRET=...
RESEND_API_KEY=re_...
AUTH_EMAIL_FROM="Quiniela FUTVE <onboarding@resend.dev>"
```

`RESEND_API_KEY` es opcional para compilar la aplicacion, pero obligatorio para procesar emails. Si falta, el webhook responde `503` para que el evento no se considere entregado.

## Flujos de usuario

### Registro y verificacion

1. `signUpAction` valida email, nombres, password y locale con Zod.
2. Neon Auth crea la identidad y genera el link con callback `/{locale}/verify-email/result`.
3. La aplicacion asegura el perfil y las preferencias; el locale del registro se persiste al crear las preferencias.
4. Neon emite `send.magic_link` con `link_type=email-verification`.
5. El webhook entrega el template de verificacion mediante Resend.
6. Neon valida el token cuando el usuario abre el link y redirige al resultado localizado.
7. El dashboard vuelve a comprobar sesion, bloqueo y email verificado en servidor.

### Login

1. `signInAction` valida los campos y llama a Neon Auth.
2. El usuario retornado por el propio login se usa para asegurar los datos app-owned; no se depende de una segunda lectura inmediata de la cookie.
3. Un usuario bloqueado cierra sesion y recibe un error localizado.
4. Una cuenta no verificada va a `/{locale}/verify-email`; una cuenta valida va a `/{locale}/home`.

### Recuperacion de contrasena

1. `requestPasswordResetAction` valida email y locale.
2. Neon Auth genera el link con callback `/{locale}/reset-password`.
3. El webhook procesa `link_type=forget-password` y entrega el segundo template.
4. La pantalla valida la presencia del token y `resetPasswordAction` envia la nueva contrasena a Neon Auth.
5. El usuario vuelve a iniciar sesion despues del cambio.

La pantalla posterior a la solicitud usa un mensaje generico y no confirma si una direccion pertenece a una cuenta.

## Webhook de Neon Auth

- Ruta: `POST /api/webhooks/neon-auth`.
- Runtime: Node.js.
- Content-Type: `application/json`.
- Tamano maximo aceptado: 64 KiB.
- Evento aceptado: `send.magic_link`.
- Tipos aceptados: `email-verification` y `forget-password`.
- `sign-in` se rechaza porque magic-link login no esta habilitado en el producto.

La verificacion usa el body sin modificar, los headers `x-neon-*`, una ventana maxima de cinco minutos y el JWKS publicado por la instancia de Neon Auth. Las claves se cachean durante cinco minutos; una firma invalida responde `401`, mientras que un fallo temporal al obtener JWKS responde `503` para permitir reintentos.

El handler no registra emails, tokens ni links. Resend recibe `neon-auth/{event_id}` como idempotency key para evitar duplicados durante reintentos.

## Templates e internacionalizacion

Los dos shells HTML reutilizables son:

- `templates/emails/verify-email.html`
- `templates/emails/reset-password.html`

El contenido vive en `messages/{locale}/auth.json`, bajo `emails`. El renderer obtiene el locale del `callbackURL` o `redirectTo` incluido en el link de Neon; si no puede resolverlo, usa `es`. Todos los valores dinamicos se escapan antes de insertarse y el envio falla si queda un placeholder sin resolver.

Los templates se incluyen explicitamente en el output trace de Next.js para que existan en despliegues empaquetados.

## Probar localmente con ngrok

1. Configura `.env.local` y ejecuta `pnpm dev`.
2. Expone el servidor con `ngrok http 3000`.
3. Configura temporalmente en Neon Auth un webhook bloqueante `send.magic_link` apuntando a `https://TU-SUBDOMINIO.ngrok-free.app/api/webhooks/neon-auth`.
4. Registra una cuenta nueva para probar verificacion.
5. Solicita recuperacion desde `/es/forgot-password` o `/en/forgot-password`.
6. Revisa la consola de Next.js, la inspeccion de ngrok y el panel de Resend.
7. Deshabilita o elimina el webhook temporal al terminar; una URL de ngrok apagada bloquearia nuevos envios.

Con el remitente de prueba de Resend, la entrega solo funciona hacia el destinatario permitido por la cuenta. La ruta acepta cualquier email y deja que Resend aplique esa restriccion.

## Checklist de produccion

- Verificar un dominio en Resend.
- Cambiar `AUTH_EMAIL_FROM` a una direccion del dominio verificado.
- Publicar la aplicacion por HTTPS con una URL estable.
- Configurar el webhook de Neon con la URL de produccion.
- Mantener separados los secretos por ambiente.
- Ejecutar registro, verificacion, login, recuperacion y logout en `es` y `en`.
- Confirmar respuestas `2xx` y ausencia de reintentos inesperados en Neon/Resend.
- Agregar pruebas automatizadas de los flujos criticos antes de ampliar auth u OAuth.
