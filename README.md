# Quiniela FUTVE

Aplicacion web para crear quinielas, enviar pronosticos y competir alrededor de competiciones de futbol. La base actual incluye interfaz publica bilingue, temas claro/oscuro/sistema y autenticacion real con email y password.

## Estado actual

- Registro con email/password y verificacion obligatoria de correo.
- Login, logout y proteccion server-side de `/[locale]/home`.
- Recuperacion y cambio de contrasena mediante links de un solo uso.
- Perfil, preferencias y auditoria app-owned en PostgreSQL con Drizzle.
- Correos transaccionales propios enviados con Resend desde un webhook firmado de Neon Auth.
- Interfaz y correos disponibles en espanol (`es`) e ingles (`en`).
- OAuth con Google aplazado; los botones permanecen deshabilitados con la etiqueta "Proximamente".

## Stack

- Next.js 16 con App Router y React 19.
- TypeScript estricto, Tailwind CSS 4 y next-intl.
- Neon PostgreSQL, Drizzle ORM y Drizzle Kit.
- Neon Auth para identidad, credenciales, verificacion y sesiones.
- Resend para entrega de emails de autenticacion.

## Configuracion local

Requisitos: Node.js compatible con la version de Next.js instalada, pnpm y un proyecto Neon con Neon Auth habilitado.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

La aplicacion queda disponible en [http://localhost:3000](http://localhost:3000). Completa estas variables en `.env.local`:

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexion PostgreSQL usada por Drizzle. |
| `NEON_AUTH_BASE_URL` | URL base de la instancia de Neon Auth. |
| `NEON_AUTH_COOKIE_SECRET` | Secreto de al menos 32 caracteres para cookies de sesion. |
| `RESEND_API_KEY` | API key server-side para enviar correos personalizados. |
| `AUTH_EMAIL_FROM` | Remitente de Resend; durante pruebas puede usarse `onboarding@resend.dev`. |

No se deben versionar `.env.local`, API keys, tokens ni URLs de correo generadas por Neon.

## Base de datos

El schema TypeScript vive en `src/server/db/schema/` y las migraciones versionadas en `src/server/db/migrations/`.

```bash
pnpm db:generate
pnpm db:migrate
```

Revisa siempre el SQL generado antes de aplicar una migracion. Las tablas internas del schema `neon_auth` pertenecen a Neon Auth y no se administran con Drizzle.

## Autenticacion y emails

Neon Auth genera los links de verificacion y recuperacion. El evento bloqueante `send.magic_link` llega a `POST /api/webhooks/neon-auth`, donde la aplicacion:

1. conserva el body original y verifica la firma Ed25519 con el JWKS de Neon;
2. valida headers, timestamp, payload y tipo de link;
3. selecciona locale a partir del callback incluido en el link;
4. renderiza uno de los dos archivos en `templates/emails/`;
5. envia con Resend usando `event_id` como clave de idempotencia.

En el modo gratuito sin dominio verificado, Resend limita el destinatario al correo autorizado por la cuenta. El codigo no restringe destinatarios: cuando se configure un dominio, podra enviar a cualquier direccion sin cambiar el flujo.

La configuracion completa, las pruebas con ngrok y el checklist de produccion estan en [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md).

## Validacion

```bash
pnpm lint
pnpm build
```

## Documentacion

- [Arquitectura](docs/ARCHITECTURE.md)
- [Autenticacion y correos](docs/AUTHENTICATION.md)
- [Internacionalizacion](docs/INTERNATIONALIZATION.md)
- [Theming](docs/THEMING.md)
- [Base de datos](docs/database/README.md)
- [Modelo de usuarios](docs/database/USERS.md)
- [Migraciones](docs/database/MIGRATIONS.md)
- [Convencion de commits](docs/COMMITS.md)
