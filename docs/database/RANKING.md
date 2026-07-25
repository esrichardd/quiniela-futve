# Ranking Database Model

## Objetivo

Este documento define cómo se calcula y expone la tabla de posiciones de una quiniela: el total de puntos acumulados por cada membresía y su posición numérica. Extiende `docs/database/SCORING.md` sin introducir tablas nuevas ni modificar el cálculo de puntos o del bonus de jornada perfecta, que se leen tal como quedan persistidos.

## Modelo elegido: agregación al vuelo

El ranking no materializa una tabla propia. Se calcula con una consulta agregada sobre datos ya persistidos e indexados:

- `pool_memberships` (una fila por membresía de la quiniela).
- `pool_match_prediction_scores.points_earned`, alcanzado vía `pool_match_predictions.pool_membership_id`.
- `pool_matchday_perfect_bonuses.points_awarded`, filtrado por `pool_membership_id`.

`totalPoints` de una membresía es la suma de ambos orígenes. La consulta parte de `pool_memberships` (no de las tablas de puntaje) para que una membresía sin ningún puntaje calculado todavía aparezca con `totalPoints = 0` en vez de quedar excluida, usando el mismo patrón de subconsulta correlacionada que ya calcula `memberCount` en `src/server/dal/pools.ts`.

### Por qué no una tabla materializada

- Las quinielas de este producto son privadas y con un número acotado de miembros: el costo de la agregación al vuelo es bajo y no crece con el catálogo global, solo con el tamaño de una quiniela.
- Los datos fuente (`pool_match_prediction_scores`, `pool_matchday_perfect_bonuses`) ya están recalculados de forma idempotente por `src/server/services/scoring.ts` cada vez que un partido o una jornada cambian de estado; materializar un total obligaría a disparar un tercer recomputo desde los mismos puntos de `competition-catalog.ts` sin aportar una ventaja de rendimiento medible.
- `docs/ARCHITECTURE.md` establece evitar cachear datos personalizados o dependientes de sesión; el ranking, aunque no es personal, sí es de solo lectura y de tamaño acotado por quiniela, por lo que una consulta directa en cada visita es consistente con esa preferencia y evita una fuente de verdad adicional que pueda desincronizarse.
- Si en el futuro el número de miembros por quiniela crece de forma significativa o se necesita historial de posiciones por jornada, esta decisión debe revisarse explícitamente en este documento antes de introducir una tabla materializada.

No hay migración asociada a este feature: no se agrega, modifica ni elimina ninguna tabla o columna.

## Regla de desempate

El ranking usa desempate estándar de competencia ("1224"), implementado como función pura en `src/features/ranking/rules.ts` (`assignCompetitionRanks`):

- Las membresías con el mismo `totalPoints` comparten la misma posición (`rank`).
- La siguiente posición distinta salta tantos números como membresías empatadas existan. Por ejemplo, dos membresías empatadas en el puesto 1 dejan la siguiente en el puesto 3, nunca en el 2.
- Contrato de la función: recibe una lista de `{ membershipId, totalPoints }` en cualquier orden y la ordena ella misma por `totalPoints` descendente (orden estable). El llamador puede pre-ordenar el listado (por ejemplo por fecha de ingreso a la quiniela) para obtener un orden de exhibición determinista entre membresías empatadas, ya que el sort estable conserva el orden relativo de entrada.

`src/server/dal/ranking.ts` ordena las filas por `(pool_memberships.created_at, pool_memberships.id)` ascendente antes de que el servicio calcule las posiciones, de modo que los empates se muestren siempre en el mismo orden (quien se unió primero aparece primero entre los empatados).

## Autorización

A diferencia de `docs/database/PREDICTIONS.md` y `docs/database/SCORING.md` (estrictamente personales: cada miembro solo ve su propio pronóstico, puntaje y bonus), el ranking es una vista compartida dentro de la quiniela: cualquier miembro puede ver el `displayName` y el `totalPoints` de **todos** los demás miembros. Esto es intencional porque una tabla de posiciones sin visibilidad de los demás participantes no cumple su propósito.

El ranking sigue sin ser público fuera de la quiniela:

1. `src/server/services/ranking.ts` (`getPoolRanking`) exige sesión verificada con `requireVerifiedAppUser`, igual que `predictions.ts` y `competition-catalog.ts`.
2. Verifica que el usuario autenticado sea miembro de la quiniela mediante `src/server/dal/ranking.ts` (`getPoolMembershipCoreForRanking`), que resuelve el nombre de la quiniela y la propia membresía en la misma consulta.
3. Un usuario no miembro recibe `PoolMembershipRequiredError`, el mismo error que produce una quiniela inexistente. Ningún dato de la quiniela (ni siquiera si existe) se filtra a un no-miembro.

El servicio marca además qué fila corresponde al usuario actual (`isCurrentUser`) para que la interfaz pueda resaltarla, sin que eso implique ningún filtrado adicional: la lista completa de membresías se devuelve siempre.

## DTO de lectura

`src/features/ranking/types.ts` define `RankingEntry` (`poolMembershipId`, `displayName`, `role`, `totalPoints`, `rank`, `isCurrentUser`) y `PoolRankingView` (`poolId`, `poolName`, `entries`). Es un DTO propio, no reutiliza `PredictionMatch` ni `PredictionMatchday`, porque esos tipos son estrictamente personales y no deben mezclarse conceptualmente con una vista que expone a todos los miembros.

## Interfaz

La pantalla `/[locale]/pools/[poolId]/ranking` sigue el mismo patrón que `/[locale]/pools/[poolId]/matchdays`: `requireDashboardUser`, `force-dynamic`, y `PoolMembershipRequiredError` mapeado a `notFound()`. Es de solo lectura; no expone ninguna Server Action. La pestaña `ranking` se agregó a `pool-navigation.tsx` junto a `matchdays`.

## Fuera de alcance

- Premios calculados en base al ranking.
- Notificaciones de cambios de posición.
- Historial de posiciones por jornada: este documento solo cubre el total acumulado actual, no una serie temporal de posiciones.
- Cualquier escritura o recomputo manual disparado por el usuario: el ranking siempre se deriva en el momento de la lectura a partir de los datos ya calculados por `scoring.ts`.
