# Database

## Objetivo

La base de datos debe modelar el estado persistente de la aplicacion con integridad fuerte, migraciones versionadas y ownership claro entre datos gestionados por librerias externas y datos propios del producto.

Este documento define la arquitectura general de base de datos. Los modelos concretos viven en documentos especializados dentro de `docs/database/`.

## Decisiones base

- Motor: PostgreSQL.
- Proveedor: Neon.
- ORM/query builder: Drizzle ORM.
- Migraciones: Drizzle Kit con SQL versionado.
- Codigo de schema: `src/server/db/schema/`.
- Codigo real de migraciones: `src/server/db/migrations/`.
- Configuracion Drizzle: `drizzle.config.ts`.
- Cliente de base de datos: `src/server/db/client.ts`.

## Ownership de datos

Las tablas se clasifican por ownership:

- Auth-owned: tablas requeridas por Better Auth para identidad, sesiones, cuentas y verificaciones.
- App-owned: tablas propias de la aplicacion para preferencias, auditoria y dominio del producto.

Reglas:

- Las tablas auth-owned siguen los requisitos de Better Auth.
- Las tablas app-owned siguen las convenciones del proyecto.
- El codigo de aplicacion no debe depender de detalles internos de Better Auth fuera del modulo `src/server/auth`.
- La DAL expone DTOs seguros y evita filtrar modelos completos hacia UI.
- Better Auth puede exponer nombres de modelo en camelCase; la persistencia del proyecto usa `snake_case` mediante configuracion de adapter/schema.

## Convenciones de nombres

- Tablas en plural y `snake_case`.
- Columnas en `snake_case`.
- Primary keys con columna `id`.
- Foreign keys con formato `<table_singular>_id`.
- Timestamps con sufijo `_at`.
- Booleanos con nombres afirmativos.
- Enums persistidos como texto controlado por schema y validaciones de aplicacion.
- JSON estructurado con tipo `jsonb`.

## Timestamps

Las tablas propias del producto deben incluir:

- `created_at`
- `updated_at`

Reglas:

- `created_at` se define al crear el registro.
- `updated_at` se actualiza en cada cambio persistente.
- Timestamps se almacenan con zona horaria.

## Integridad

La base de datos debe reforzar integridad, no solo almacenar datos.

Reglas:

- Usar foreign keys para relaciones obligatorias.
- Usar unique constraints para invariantes de unicidad.
- Usar not null cuando el dato sea obligatorio.
- Usar cascadas solo cuando borrar el padre deba borrar permanentemente los hijos.
- Preferir estados explicitos sobre inferencias ambiguas.

## Indices

Todo indice debe existir por una razon de consulta o constraint.

Reglas:

- Indices para foreign keys consultadas frecuentemente.
- Indices unicos para valores que identifican entidades.
- Indices para tokens o identificadores usados en auth.
- No crear indices especulativos sin query conocida.

## Seguridad

La base de datos es el tercer control de seguridad junto a UI y servidor.

Reglas:

- La autorizacion vive en servidor, pero la base de datos debe proteger integridad.
- No guardar secretos en texto plano.
- No guardar tokens innecesarios.
- No exponer modelos completos de base de datos hacia componentes cliente.
- Datos de auditoria no deben editarse desde flujos normales de producto.

## Documentos de modelo

Modelos definidos:

- `docs/database/USERS.md`: usuarios, auth, preferencias y auditoria.

Proceso de cambios:

- `docs/database/MIGRATIONS.md`: reglas para crear, revisar y aplicar migraciones.

## Fuera de alcance

Este documento no define tablas de competiciones, quinielas, partidos, predicciones ni rankings. Esos modelos se documentan en archivos propios cuando se incorporen al producto.
