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
        |   +-- auth.ts
        |   +-- users.ts
        |   +-- index.ts
        +-- migrations/
            +-- 0000_initial_auth_users.sql
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
2. Generar migracion con Drizzle Kit.
3. Revisar el SQL generado.
4. Ajustar el schema o SQL si la migracion no expresa correctamente la intencion.
5. Aplicar la migracion en el ambiente correspondiente.
6. Versionar schema, SQL y metadata en el mismo commit.

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

## Better Auth

Better Auth define requisitos para tablas auth-owned. Drizzle mantiene el schema y las migraciones versionadas.

Reglas:

- La compatibilidad con Better Auth se preserva al modificar `users`, `sessions`, `accounts` y `verifications`.
- Cambios requeridos por plugins de Better Auth se reflejan en schema Drizzle.
- No se usa un migrador runtime de Better Auth como fuente principal de verdad.
- El schema versionado del proyecto es la fuente de verdad.

## Neon

Neon provee PostgreSQL gestionado. Las migraciones se aplican contra la base de datos configurada por ambiente.

Reglas:

- Cada ambiente usa su propia URL de conexion.
- `DATABASE_URL` no se versiona.
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

## Fuera de alcance

Este documento no define comandos exactos de package scripts. Los scripts se agregan al `package.json` cuando Drizzle y la conexion de base de datos esten instalados.
