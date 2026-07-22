# Quiniela FUTVE

Aplicacion web construida con Next.js, TypeScript y PostgreSQL.

## Stack

- Next.js 16 con App Router y React 19.
- TypeScript en modo estricto.
- Tailwind CSS 4.
- next-intl para internacionalizacion.
- next-themes para temas `light`, `dark` y `system`.
- Neon PostgreSQL.
- Drizzle ORM y Drizzle Kit.
- Neon Auth para identidad y sesiones.
- Resend para correo transaccional.
- Zod para validacion de datos y variables de entorno.
- pnpm como package manager.

## Requisitos

- Node.js compatible con la version de Next.js instalada.
- pnpm.
- Un proyecto de Neon con PostgreSQL y Neon Auth habilitados.
- Una cuenta de Resend para probar el envio de correos de autenticacion.

## Instalacion

```bash
pnpm install
cp .env.example .env.local
```

Completa `.env.local` con las credenciales del ambiente y luego inicia el servidor:

```bash
pnpm dev
```

La aplicacion queda disponible en [http://localhost:3000](http://localhost:3000).

## Variables de entorno

| Variable | Requerida | Descripcion |
| --- | --- | --- |
| `DATABASE_URL` | Si | URL de conexion PostgreSQL usada por Drizzle. |
| `NEON_AUTH_BASE_URL` | Si | URL base de la instancia de Neon Auth. |
| `NEON_AUTH_COOKIE_SECRET` | Si | Secreto de al menos 32 caracteres usado para proteger las cookies de autenticacion. |
| `RESEND_API_KEY` | Para emails | API key server-side de Resend. |
| `AUTH_EMAIL_FROM` | Para emails | Remitente autorizado por Resend. Usa `Quiniela FUTVE <onboarding@resend.dev>` durante pruebas sin dominio. |

El esquema completo se encuentra en [.env.example](.env.example). No se deben versionar `.env.local`, API keys, tokens ni credenciales reales.

## Base de datos

El schema app-owned vive en `src/server/db/schema/` y las migraciones versionadas en `src/server/db/migrations/`.

Generar una migracion despues de modificar el schema:

```bash
pnpm db:generate
```

Aplicar las migraciones pendientes al ambiente indicado por `DATABASE_URL`:

```bash
pnpm db:migrate
```

Insertar o actualizar los datos iniciales app-owned, como Liga FUTVE:

```bash
pnpm db:seed
```

Revisa el SQL generado y confirma el ambiente de destino antes de aplicar una migracion o seed. El schema interno `neon_auth` pertenece a Neon Auth y no se administra con Drizzle.

## Emails de autenticacion

Los correos personalizados se procesan mediante el Route Handler:

```text
POST /api/webhooks/neon-auth
```

Neon Auth debe configurar un webhook bloqueante para el evento `send.magic_link` apuntando a esa ruta. Los templates HTML se encuentran en `templates/emails/` y el contenido localizado en `messages/{locale}/auth.json`.

Para probar el webhook localmente se necesita una URL publica temporal, por ejemplo con ngrok:

```bash
ngrok http 3000
```

Configura en Neon la URL resultante con el path `/api/webhooks/neon-auth` y elimina o deshabilita el webhook temporal cuando termine la prueba. El procedimiento completo esta documentado en [docs/AUTHENTICATION.md](docs/AUTHENTICATION.md).

## Comandos

| Comando | Descripcion |
| --- | --- |
| `pnpm dev` | Inicia el servidor de desarrollo. |
| `pnpm build` | Genera y valida el build de produccion. |
| `pnpm start` | Ejecuta el build de produccion. |
| `pnpm lint` | Ejecuta ESLint sobre el proyecto. |
| `pnpm db:generate` | Genera migraciones desde el schema Drizzle. |
| `pnpm db:migrate` | Aplica migraciones pendientes. |
| `pnpm db:seed` | Inserta o actualiza datos iniciales app-owned. |

## Estructura principal

```text
messages/             Traducciones por locale
templates/emails/     Templates HTML de correo
src/app/              Rutas, layouts, paginas y Route Handlers
src/components/       Componentes reutilizables sin ownership de dominio
src/features/         Casos de uso y UI organizada por feature
src/i18n/             Configuracion de internacionalizacion
src/lib/              Utilidades transversales
src/server/auth/      Integracion server-side con Neon Auth
src/server/dal/       Acceso a datos
src/server/db/        Cliente, schema y migraciones Drizzle
src/server/email/     Renderizado y entrega de emails
src/server/services/  Orquestacion de reglas de aplicacion
```

## Validacion antes de entregar cambios

```bash
pnpm lint
pnpm build
```

Si se modifica el schema, tambien se debe generar y revisar la migracion correspondiente.

## Documentacion

- [Arquitectura](docs/ARCHITECTURE.md)
- [Autenticacion y correos](docs/AUTHENTICATION.md)
- [Internacionalizacion](docs/INTERNATIONALIZATION.md)
- [Theming](docs/THEMING.md)
- [Base de datos](docs/database/README.md)
- [Modelo de usuarios](docs/database/USERS.md)
- [Modelo de quinielas privadas](docs/database/POOLS.md)
- [Migraciones](docs/database/MIGRATIONS.md)
- [Convencion de commits](docs/COMMITS.md)
