# Database Migrations

## Objetivo

Las migraciones deben permitir evolucionar la base de datos de forma revisable, versionada y reproducible.

Este documento define el proceso. Los archivos reales de migracion viven en `src/server/db/migrations/`.

## Decisiones base

- Herramienta: Drizzle Kit.
- Fuente de schema: `src/server/db/schema/`.
- Directorio de migraciones: `src/server/db/migrations/`.
- Configuracion: `drizzle.config.ts`.
- Las migraciones SQL se versionan en git.
- Las migraciones se revisan antes de aplicarse.

## Estructura de codigo

```txt
src/
+-- server/
    +-- db/
        +-- client.ts
        +-- schema/
        |   +-- users.ts
        |   +-- index.ts
        +-- migrations/
            +-- 0000_initial_user_app_data.sql
            +-- meta/
drizzle.config.ts
```

Reglas:

- `schema/` contiene la definicion TypeScript del schema Drizzle.
- `migrations/` contiene SQL generado y metadata de Drizzle.
- `client.ts` contiene el cliente de conexion a PostgreSQL.
- `drizzle.config.ts` define rutas de schema y migraciones.

## Flujo de cambio

Todo cambio de base de datos sigue este flujo:

1. Actualizar el schema TypeScript en `src/server/db/schema/`.
2. Generar migracion con `pnpm db:generate`.
3. Revisar el SQL generado.
4. Ajustar el schema o SQL si la migracion no expresa correctamente la intencion.
5. Aplicar la migracion con `pnpm db:migrate` en el ambiente correspondiente.
6. Versionar schema, SQL y metadata en el mismo commit.

Los dos comandos usan `DATABASE_URL` del ambiente actual. Nunca ejecutar `db:migrate` sin confirmar primero el destino y revisar el SQL pendiente.

## Reglas de migracion

- No usar `push` como flujo principal de cambios persistentes.
- No editar una migracion ya aplicada.
- Crear una nueva migracion para cada cambio posterior.
- Revisar operaciones destructivas antes de aplicarlas.
- Separar cambios de schema de cambios masivos de datos.
- No hacer cambios manuales directos en la base de datos sin reflejarlos en migraciones.
- El SQL generado forma parte del codigo del proyecto.

## Cambios destructivos

Cambios destructivos incluyen:

- Eliminar tablas.
- Eliminar columnas.
- Cambiar tipos incompatibles.
- Agregar `not null` a una columna con datos existentes.
- Renombrar columnas o tablas.
- Cambiar constraints que puedan invalidar datos existentes.

Reglas:

- Todo cambio destructivo debe dividirse en pasos seguros.
- Primero se agrega estructura nueva.
- Luego se migra o backfillea data.
- Despues se actualiza el codigo de aplicacion.
- Al final se elimina la estructura antigua.

## Neon Auth

Neon Auth gestiona identidad, credenciales, proveedores OAuth, verificaciones y sesiones. Esos datos viven en el schema `neon_auth`, pero no son ownership del schema Drizzle del proyecto.

Reglas:

- Las migraciones del proyecto no crean ni modifican tablas internas de Neon Auth.
- Las migraciones del proyecto no deben incluir objetos del schema `neon_auth`.
- El schema versionado del proyecto es la fuente de verdad solo para tablas app-owned.
- Los datos app-owned que referencian usuarios usan el `user_id` emitido por Neon Auth.
- Si Neon Auth requiere configuracion o migraciones internas, se administran desde el flujo oficial de Neon Auth, no desde Drizzle Kit del proyecto.
- Si en el futuro se migra a Better Auth self-hosted, debe abrirse un cambio documental y migratorio separado antes de crear tablas auth-owned propias.

## Neon

Neon provee PostgreSQL gestionado. Las migraciones se aplican contra la base de datos configurada por ambiente.

Reglas:

- Cada ambiente usa su propia URL de conexion.
- `DATABASE_URL` no se versiona.
- La configuracion de Neon Auth y OAuth no se versiona cuando contiene secretos.
- Las migraciones no deben depender de datos locales no versionados.
- Las migraciones deben poder ejecutarse desde cero en una base vacia.

## Datos semilla

Los datos semilla no son migraciones estructurales.

Reglas:

- Las migraciones crean o transforman estructura.
- Los seeds insertan datos iniciales necesarios para operar.
- Los seeds deben ser idempotentes.
- Los seeds viven separados de migraciones.

## Revision

Antes de aceptar una migracion:

- El SQL generado fue revisado.
- La migracion corresponde al cambio de schema.
- No hay operaciones destructivas accidentales.
- Indices y constraints tienen justificacion.
- La documentacion del modelo fue actualizada cuando corresponde.

## Rollback

El rollback principal es avanzar con una nueva migracion correctiva.

Reglas:

- No editar migraciones aplicadas para simular rollback.
- No asumir que una migracion destructiva puede revertirse sin perdida.
- Para cambios riesgosos, usar migraciones por fases.
- Restaurar backups es una accion operativa, no reemplaza una migracion correctiva.
