# Users Database Model

## Objetivo

El primer modelo app-owned de usuarios cubre perfil de aplicacion, datos personales opcionales, rol global, bloqueo administrativo, preferencias transversales y auditoria.

La identidad, credenciales, proveedores OAuth, verificacion de email y sesiones son responsabilidad de Neon Auth. Neon Auth guarda esos datos en el schema `neon_auth`, pero la aplicacion no administra esas tablas con Drizzle ni con migraciones propias.

## Alcance

Tablas app-owned definidas:

- `user_profiles`
- `user_preferences`
- `user_audit_events`

Datos Neon Auth-managed fuera del ownership del proyecto:

- usuarios de identidad
- credenciales email/password
- cuentas OAuth como Google
- tokens de verificacion
- sesiones
- cookies y metadatos internos del proveedor

El enlace entre Neon Auth y las tablas app-owned es `user_id`, un identificador externo estable emitido por Neon Auth.

## Reglas de ownership

- Las tablas app-owned viven en el schema y migraciones del proyecto.
- Las tablas internas de Neon Auth no se editan, renombran ni migran desde este repositorio.
- El codigo fuera de `src/server/auth` no debe depender de detalles internos de Neon Auth.
- La DAL debe exponer DTOs seguros, no modelos completos del proveedor ni filas completas de base de datos.
- El estado de email verificado debe consultarse mediante la sesion/API de Neon Auth, no duplicarse como fuente de verdad app-owned.

## Roles globales

Los roles globales app-owned iniciales son:

- `user`
- `super_admin`

Reglas:

- `user` es el rol normal.
- `super_admin` administra configuracion global y usuarios.
- Roles contextuales como `league_admin`, `pool_admin` y `player` no pertenecen al rol global.
- Los permisos contextuales se documentan junto al modulo de datos que introduzca ese contexto.

## Bloqueo administrativo

El bloqueo administrativo es app-owned y vive en `user_profiles`.

Reglas:

- Un usuario bloqueado no puede entrar a la experiencia autenticada normal aunque Neon Auth tenga una sesion valida.
- El bloqueo no elimina ni modifica credenciales del proveedor.
- `ban_reason` y `ban_expires_at` solo tienen significado cuando `banned` es `true`.
- Las decisiones de bloqueo se validan en servidor, especialmente en `requireUser`, DAL, services y Server Actions.

## `user_profiles`

Tabla principal app-owned para informacion transversal de producto sobre un usuario autenticado.

Ownership: app-owned.

| Columna          | Tipo                       | Requerido | Descripcion                                            |
| ---------------- | -------------------------- | --------- | ------------------------------------------------------ |
| `user_id`        | `text`                     | si        | Identificador del usuario emitido por Neon Auth.       |
| `display_name`   | `text`                     | no        | Nombre visible preferido dentro de la aplicacion.      |
| `first_name`     | `text`                     | no        | Nombre del usuario para perfil de aplicacion.          |
| `last_name`      | `text`                     | no        | Apellido del usuario para perfil de aplicacion.        |
| `birth_date`     | `date`                     | no        | Fecha de nacimiento del usuario.                       |
| `gender`         | `text`                     | no        | Genero declarado por el usuario.                       |
| `avatar_url`     | `text`                     | no        | URL de imagen visible para UI cuando aplique.          |
| `global_role`    | `text`                     | si        | Rol global app-owned: `user` o `super_admin`.          |
| `banned`         | `boolean`                  | si        | Indica si el usuario esta bloqueado por la aplicacion. |
| `ban_reason`     | `text`                     | no        | Motivo administrativo del bloqueo.                     |
| `ban_expires_at` | `timestamp with time zone` | no        | Fecha en que expira el bloqueo.                        |
| `created_at`     | `timestamp with time zone` | si        | Fecha de creacion del registro app-owned.              |
| `updated_at`     | `timestamp with time zone` | si        | Fecha de ultima actualizacion app-owned.               |

Constraints:

- `user_id` es primary key.
- `global_role` solo acepta `user` o `super_admin`.
- `global_role` por defecto es `user`.
- `banned` por defecto es `false`.
- `display_name`, `first_name`, `last_name`, `birth_date` y `gender` son opcionales.
- `gender` solo acepta valores controlados por la aplicacion, inicialmente `female`, `male`, `non_binary`, `prefer_not_to_say` u `other`.
- `birth_date` no puede ser una fecha futura.

Indices:

- Primary key en `user_id`.
- Index en `global_role`.
- Index en `banned`.

Reglas:

- Cada usuario de Neon Auth tiene como maximo un perfil app-owned.
- El perfil debe crearse o asegurarse despues de registro o primer login exitoso.
- `display_name` y `avatar_url` son datos de presentacion y pueden sincronizarse desde Neon Auth o ser editados por la aplicacion si se habilita ese flujo.
- `first_name`, `last_name`, `birth_date` y `gender` son datos personales opcionales; no pertenecen a Neon Auth ni a `user_preferences`.
- Estos datos personales no deben exponerse en DTOs publicos salvo que una pantalla o caso de uso lo necesite explicitamente.
- La edad debe derivarse en servidor a partir de `birth_date`; no se persiste como columna.
- `global_role` representa autorizacion global, no permisos contextuales.
- No guardar email como dato app-owned salvo que exista una necesidad de producto documentada.

## `user_preferences`

Tabla de preferencias transversales del usuario.

Ownership: app-owned.

| Columna      | Tipo                       | Requerido | Descripcion                                      |
| ------------ | -------------------------- | --------- | ------------------------------------------------ |
| `user_id`    | `text`                     | si        | Identificador del usuario emitido por Neon Auth. |
| `locale`     | `text`                     | si        | Locale preferido: `es` o `en`.                   |
| `theme`      | `text`                     | si        | Tema preferido: `light`, `dark` o `system`.      |
| `time_zone`  | `text`                     | si        | Time zone IANA preferido.                        |
| `created_at` | `timestamp with time zone` | si        | Fecha de creacion.                               |
| `updated_at` | `timestamp with time zone` | si        | Fecha de ultima actualizacion.                   |

Constraints:

- `user_id` es primary key.
- `locale` solo acepta `es` o `en`.
- `theme` solo acepta `light`, `dark` o `system`.
- `locale` por defecto es `es`.
- `theme` por defecto es `system`.
- `time_zone` por defecto es `America/Caracas`.

Indices:

- Primary key en `user_id`.

Reglas:

- Cada usuario tiene como maximo un registro de preferencias.
- `locale` no modifica permisos ni datos disponibles.
- `theme` no modifica permisos ni datos disponibles.
- `time_zone` se usa para presentacion de fechas y horas.
- `time_zone` no define el huso horario oficial de un evento deportivo.
- Las preferencias deben crearse o asegurarse junto al perfil app-owned.

## `user_audit_events`

Tabla append-only para eventos relevantes sobre usuarios.

Ownership: app-owned.

| Columna          | Tipo                       | Requerido | Descripcion                                  |
| ---------------- | -------------------------- | --------- | -------------------------------------------- |
| `id`             | `text`                     | si        | Identificador unico del evento.              |
| `actor_user_id`  | `text`                     | no        | Usuario de Neon Auth que ejecuto la accion.  |
| `target_user_id` | `text`                     | no        | Usuario de Neon Auth afectado por la accion. |
| `action`         | `text`                     | si        | Accion registrada.                           |
| `metadata`       | `jsonb`                    | si        | Detalles estructurados del evento.           |
| `created_at`     | `timestamp with time zone` | si        | Fecha del evento.                            |

Acciones iniciales:

- `user.created`
- `user.first_login`
- `user.email_verification_required`
- `user.profile_updated`
- `user.password_reset_requested`
- `user.password_changed`
- `user.google_login`
- `user.role_changed`
- `user.banned`
- `user.unbanned`
- `user.session_revoked`

Constraints:

- `id` es primary key.
- `action` es obligatorio.
- `metadata` por defecto es `{}`.
- `created_at` es obligatorio.

Indices:

- Index en `actor_user_id`.
- Index en `target_user_id`.
- Index en `action`.
- Index en `created_at`.

Reglas:

- Los eventos son append-only.
- Los eventos no se editan desde flujos normales de producto.
- `metadata` no debe guardar secretos, passwords, tokens OAuth, links de verificacion, links de recuperacion ni tokens temporales.
- `actor_user_id` puede ser null para eventos iniciados por sistema.
- `target_user_id` puede ser null para eventos globales.
- Como `user_id` pertenece a Neon Auth, los eventos deben conservar el identificador historico incluso si el usuario deja de existir en el proveedor.

## Relaciones app-owned

Relaciones principales:

- `user_profiles.user_id` identifica un usuario de Neon Auth.
- `user_preferences.user_id` identifica un usuario de Neon Auth.
- `user_audit_events.actor_user_id` y `target_user_id` identifican usuarios de Neon Auth.
- `user_profiles` tiene cero o una `user_preferences` por `user_id`.

## Borrado

Reglas:

- Borrar una cuenta en Neon Auth no debe borrar automaticamente auditoria app-owned.
- Si se implementa borrado de usuario desde la aplicacion, debe definirse un flujo explicito para anonimizar o eliminar datos app-owned segun requisitos legales y de producto.
- `user_preferences` puede eliminarse junto con `user_profiles` cuando el usuario se borre desde flujos controlados por la aplicacion.
- `user_audit_events` no se borra por cascada.

## Flujos de creacion

Registro email/password:

1. Neon Auth crea la cuenta y gestiona credenciales.
2. La configuracion de Neon Auth exige verificacion de correo por link.
3. La aplicacion crea o asegura `user_profiles`.
4. La aplicacion crea o asegura `user_preferences`.
5. Neon Auth envia el link de verificacion usando Resend como proveedor SMTP custom.
6. La aplicacion registra auditoria app-owned cuando corresponda, sin guardar links ni tokens.

Recuperacion de contrasena:

1. Neon Auth genera el link/token de recuperacion.
2. Neon Auth envia el email usando Resend como proveedor SMTP custom.
3. La aplicacion puede registrar eventos app-owned sin guardar links ni tokens.

Eventos opcionales si se habilitan webhooks de email en el futuro:

- `user.email_verification_link_sent`
- `user.password_reset_link_sent`

Primer login con Google:

1. Neon Auth resuelve la identidad OAuth.
2. La aplicacion crea o asegura `user_profiles`.
3. La aplicacion crea o asegura `user_preferences`.
4. La aplicacion registra `user.google_login` o `user.first_login` cuando corresponda.

## Fuera de alcance

Este documento no define membresias de ligas, administracion contextual, quinielas, equipos, partidos, predicciones ni rankings.

Este documento tampoco define la estructura interna de Neon Auth.
