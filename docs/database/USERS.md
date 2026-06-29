# Users Database Model

## Objetivo

El primer modelo de datos cubre identidad, sesiones, cuentas de autenticacion, verificaciones, preferencias de usuario y auditoria de acciones administrativas.

Este modulo permite autenticar usuarios, administrar roles globales, persistir preferencias transversales y registrar eventos importantes sobre usuarios.

## Alcance

Tablas definidas:

- `users`
- `sessions`
- `accounts`
- `verifications`
- `user_preferences`
- `user_audit_events`

Ownership:

- Auth-owned: `users`, `sessions`, `accounts`, `verifications`.
- App-owned: `user_preferences`, `user_audit_events`.

Las tablas auth-owned deben mantenerse compatibles con Better Auth y sus plugins habilitados. Las tablas app-owned son propiedad del proyecto.

## Roles globales

Los roles globales iniciales son:

- `user`
- `super_admin`

Reglas:

- `user` es el rol normal.
- `super_admin` administra configuracion global y usuarios.
- Roles contextuales como administracion de ligas, quinielas o participacion no pertenecen a `users.role`.
- Los permisos contextuales se documentan junto al modulo de datos que introduzca ese contexto.

## `users`

Tabla principal de identidad.

Ownership: auth-owned.

| Columna | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `id` | `text` | si | Identificador unico del usuario. |
| `name` | `text` | si | Nombre visible del usuario. |
| `email` | `text` | si | Email principal del usuario. |
| `email_verified` | `boolean` | si | Indica si el email fue verificado. |
| `image` | `text` | no | URL de imagen de perfil. |
| `role` | `text` | si | Rol global: `user` o `super_admin`. |
| `banned` | `boolean` | si | Indica si el usuario esta bloqueado. |
| `ban_reason` | `text` | no | Motivo del bloqueo. |
| `ban_expires` | `timestamp with time zone` | no | Fecha en que expira el bloqueo. |
| `created_at` | `timestamp with time zone` | si | Fecha de creacion. |
| `updated_at` | `timestamp with time zone` | si | Fecha de ultima actualizacion. |

Constraints:

- `id` es primary key.
- `email` es unico.
- `email` debe guardarse normalizado.
- `role` solo acepta `user` o `super_admin`.
- `banned` por defecto es `false`.
- `email_verified` por defecto es `false`.

Indices:

- Unique index en `email`.
- Index en `role`.
- Index en `banned`.

Reglas:

- `role` representa autorizacion global, no permisos contextuales.
- Un usuario bloqueado no puede iniciar flujos autenticados normales.
- `ban_reason` y `ban_expires` solo tienen significado cuando `banned` es `true`.

## `sessions`

Tabla de sesiones activas o historicas segun la estrategia de Better Auth.

Ownership: auth-owned.

| Columna | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `id` | `text` | si | Identificador unico de sesion. |
| `user_id` | `text` | si | Usuario propietario de la sesion. |
| `token` | `text` | si | Token de sesion. |
| `expires_at` | `timestamp with time zone` | si | Fecha de expiracion. |
| `ip_address` | `text` | no | IP asociada a la sesion. |
| `user_agent` | `text` | no | User agent asociado. |
| `impersonated_by` | `text` | no | Usuario administrador que inicio impersonation. |
| `created_at` | `timestamp with time zone` | si | Fecha de creacion. |
| `updated_at` | `timestamp with time zone` | si | Fecha de ultima actualizacion. |

Constraints:

- `id` es primary key.
- `user_id` referencia `users.id`.
- `token` es unico.
- `expires_at` es obligatorio.
- `impersonated_by` referencia `users.id`.

Indices:

- Unique index en `token`.
- Index en `user_id`.
- Index en `expires_at`.
- Index en `impersonated_by`.

Reglas:

- Una sesion expirada no autoriza acceso.
- `impersonated_by` solo se usa para sesiones creadas por flujo administrativo de impersonation.

## `accounts`

Tabla de cuentas de autenticacion asociadas a un usuario.

Ownership: auth-owned.

| Columna | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `id` | `text` | si | Identificador unico de cuenta. |
| `user_id` | `text` | si | Usuario propietario de la cuenta. |
| `account_id` | `text` | si | Identificador de cuenta en el proveedor. |
| `provider_id` | `text` | si | Proveedor de autenticacion. |
| `access_token` | `text` | no | Token de acceso del proveedor. |
| `refresh_token` | `text` | no | Token de refresco del proveedor. |
| `id_token` | `text` | no | ID token del proveedor. |
| `access_token_expires_at` | `timestamp with time zone` | no | Expiracion de access token. |
| `refresh_token_expires_at` | `timestamp with time zone` | no | Expiracion de refresh token. |
| `scope` | `text` | no | Scopes otorgados por el proveedor. |
| `password` | `text` | no | Password hash para credenciales locales. |
| `created_at` | `timestamp with time zone` | si | Fecha de creacion. |
| `updated_at` | `timestamp with time zone` | si | Fecha de ultima actualizacion. |

Constraints:

- `id` es primary key.
- `user_id` referencia `users.id`.
- La combinacion `provider_id` + `account_id` es unica.

Indices:

- Index en `user_id`.
- Unique index en `provider_id`, `account_id`.

Reglas:

- `password` nunca guarda texto plano.
- Tokens de proveedor solo se guardan cuando el flujo de autenticacion los requiere.
- Borrar un usuario borra sus cuentas asociadas.

## `verifications`

Tabla de verificaciones temporales.

Ownership: auth-owned.

| Columna | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `id` | `text` | si | Identificador unico de verificacion. |
| `identifier` | `text` | si | Identificador verificable, como email o token subject. |
| `value` | `text` | si | Valor de verificacion. |
| `expires_at` | `timestamp with time zone` | si | Fecha de expiracion. |
| `created_at` | `timestamp with time zone` | si | Fecha de creacion. |
| `updated_at` | `timestamp with time zone` | si | Fecha de ultima actualizacion. |

Constraints:

- `id` es primary key.
- `identifier` es obligatorio.
- `value` es obligatorio.
- `expires_at` es obligatorio.

Indices:

- Index en `identifier`.
- Index en `expires_at`.

Reglas:

- Una verificacion expirada no puede usarse.
- Las verificaciones son datos temporales y pueden limpiarse por mantenimiento.

## `user_preferences`

Tabla de preferencias transversales del usuario.

Ownership: app-owned.

| Columna | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `user_id` | `text` | si | Usuario propietario de las preferencias. |
| `locale` | `text` | si | Locale preferido: `es` o `en`. |
| `theme` | `text` | si | Tema preferido: `light`, `dark` o `system`. |
| `time_zone` | `text` | si | Time zone IANA preferido. |
| `created_at` | `timestamp with time zone` | si | Fecha de creacion. |
| `updated_at` | `timestamp with time zone` | si | Fecha de ultima actualizacion. |

Constraints:

- `user_id` es primary key.
- `user_id` referencia `users.id`.
- `locale` solo acepta `es` o `en`.
- `theme` solo acepta `light`, `dark` o `system`.
- `locale` por defecto es `es`.
- `theme` por defecto es `system`.
- `time_zone` por defecto es `America/Caracas`.

Indices:

- Primary key en `user_id`.

Reglas:

- Cada usuario tiene maximo un registro de preferencias.
- `locale` no modifica permisos ni datos disponibles.
- `theme` no modifica permisos ni datos disponibles.
- `time_zone` se usa para presentacion de fechas y horas.
- `time_zone` no define el huso horario oficial de un evento deportivo.

## `user_audit_events`

Tabla append-only para eventos relevantes sobre usuarios.

Ownership: app-owned.

| Columna | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `id` | `text` | si | Identificador unico del evento. |
| `actor_user_id` | `text` | no | Usuario que ejecuto la accion. |
| `target_user_id` | `text` | no | Usuario afectado por la accion. |
| `action` | `text` | si | Accion registrada. |
| `metadata` | `jsonb` | si | Detalles estructurados del evento. |
| `created_at` | `timestamp with time zone` | si | Fecha del evento. |

Acciones iniciales:

- `user.created`
- `user.role_changed`
- `user.banned`
- `user.unbanned`
- `user.session_revoked`
- `user.impersonation_started`
- `user.impersonation_stopped`

Constraints:

- `id` es primary key.
- `actor_user_id` referencia `users.id`.
- `target_user_id` referencia `users.id`.
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
- `metadata` no debe guardar secretos.
- `actor_user_id` puede ser null para eventos iniciados por sistema.
- `target_user_id` puede ser null para eventos globales.
- Si el actor o target se elimina, la referencia se conserva como null y el evento permanece.

## Relaciones

Relaciones principales:

- `users` tiene muchas `sessions`.
- `users` tiene muchas `accounts`.
- `users` tiene cero o una `user_preferences`.
- `users` puede ser actor en muchos `user_audit_events`.
- `users` puede ser target en muchos `user_audit_events`.

## Borrado

Reglas:

- Borrar un usuario elimina sesiones y cuentas asociadas con cascade.
- Borrar un usuario elimina sus preferencias con cascade.
- Los eventos de auditoria no se borran por cascada.
- En auditoria, `actor_user_id` y `target_user_id` usan `set null` al borrar usuarios.

## Fuera de alcance

Este documento no define membresias de ligas, administracion contextual, quinielas, equipos, partidos, predicciones ni rankings.
