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

- Neon Auth-managed: datos internos que Neon Auth guarda en el schema `neon_auth` para identidad, credenciales, proveedores OAuth, verificaciones y sesiones.
- App-owned: tablas propias de la aplicacion para perfil de aplicacion, roles globales, preferencias, auditoria y dominio del producto.

Reglas:

- Las tablas Neon Auth-managed no se modelan ni migran desde el schema Drizzle del proyecto.
- El schema `neon_auth` pertenece al proveedor gestionado aunque viva dentro de la base Neon.
- La aplicacion puede referenciar el `user_id` emitido por Neon Auth, pero no debe depender de la estructura interna de sus tablas.
- Las tablas app-owned siguen las convenciones del proyecto.
- El codigo de aplicacion no debe depender de detalles internos de Neon Auth fuera del modulo `src/server/auth`.
- La DAL expone DTOs seguros y evita filtrar modelos completos hacia UI.
- La persistencia app-owned del proyecto usa `snake_case`.
- Las migraciones versionadas del proyecto solo administran tablas app-owned.

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
- Indices para identificadores externos usados por integraciones, como `user_id` de Neon Auth.
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

- `docs/database/USERS.md`: perfil de usuario app-owned, preferencias y auditoria.
- `docs/database/POOLS.md`: competiciones, quinielas privadas, membresias, invitaciones y reglas.
- `docs/database/COMPETITION_CATALOG.md`: temporadas, equipos, jornadas, partidos, resultados y auditoria oficial.

Proceso de cambios:

- `docs/database/MIGRATIONS.md`: reglas para crear, revisar y aplicar migraciones.

## Fuera de alcance

Este documento no define pronosticos enviados ni rankings. Esos modelos se documentan en archivos propios cuando se incorporen al producto.
