# Scoring Database Model

## Objetivo

Este modelo calcula y persiste cuántos puntos gana cada pronóstico (`pool_match_predictions`) cuando su partido oficial se marca `finished`, y si corresponde, el bonus de jornada perfecta por membresía cuando su jornada se marca `finished`. Extiende `docs/database/PREDICTIONS.md` sin modificar la representación del pronóstico enviado por el usuario. Este documento no define ranking ni tabla de posiciones; esa agregación se documenta en `docs/database/RANKING.md`. Los premios calculados en base a puntos quedan fuera de alcance.

## Tablas

### `pool_match_prediction_scores`

Puntaje calculado para un `pool_match_predictions`, en una tabla separada para poder recomputar tras una corrección de resultado sin tocar el pronóstico original del usuario.

Columnas:

- `id`: UUID, primary key.
- `pool_match_prediction_id`: UUID, único (relación 1:1 con `pool_match_predictions`).
- `points_earned`: integer, `>= 0`.
- `was_exact_score`: boolean. Indica si el marcador pronosticado coincidió exactamente con el oficial; se persiste para evaluar el bonus de jornada perfecta sin recalcular desde cero.
- `created_at` / `updated_at`: timestamptz.

Claves e integridad:

- Índice único `pool_match_prediction_scores_prediction_unique` sobre `pool_match_prediction_id`: como máximo un puntaje por pronóstico.
- FK `pool_match_prediction_id` → `pool_match_predictions(id)` `ON DELETE CASCADE`. No se duplican `pool_id` ni `pool_membership_id`: el borrado en cascada de una quiniela ya llega de forma transitiva a través de `pool_match_predictions`.
- Check `points_earned >= 0`.

### `pool_matchday_perfect_bonuses`

Bonus de jornada perfecta otorgado a una membresía para una jornada. Una fila solo existe cuando el bonus fue efectivamente ganado; no se guardan filas con `0` puntos.

Columnas:

- `id`: UUID, primary key.
- `pool_id`, `competition_season_id`, `pool_membership_id`, `matchday_id`: UUID.
- `points_awarded`: integer, `> 0`.
- `created_at` / `updated_at`: timestamptz.

Claves e integridad:

- Índice único `pool_matchday_perfect_bonuses_membership_matchday_unique` sobre `(pool_membership_id, matchday_id)`: como máximo un bonus por membresía y jornada.
- FK `(pool_membership_id, pool_id)` → `pool_memberships(id, pool_id)` `ON DELETE CASCADE`, igual patrón que `pool_match_predictions`.
- FK `(pool_id, competition_season_id)` → `pools(id, competition_season_id)` `ON DELETE CASCADE`.
- FK `(matchday_id, competition_season_id)` → `matchdays(id, competition_season_id)` `ON DELETE RESTRICT` (el catálogo oficial no expone borrado de jornadas en este MVP).
- Check `points_awarded > 0`.
- Índices por `pool_id` y `matchday_id` para las consultas de recomputo y las cascadas de borrado.

## Borrado

Borrar una quiniela elimina ambas tablas en cascada: `pool_match_prediction_scores` transitivamente a través de `pool_match_predictions`, y `pool_matchday_perfect_bonuses` directamente vía su FK a `pool_memberships`/`pools`.

## Reglas de puntuación

Implementadas como funciones puras en `src/features/scoring/rules.ts`, reutilizando `derivePredictedResult` de `src/features/predictions/rules.ts`.

- **`simple`**: se deriva el resultado oficial (`home`/`draw`/`away`) desde `home_score`/`away_score`. Si `predicted_result` coincide, se otorgan `result_points`; si no, `0`. Nunca reporta marcador exacto.
- **`score`**: solo se otorgan puntos si `predicted_home_score`/`predicted_away_score` coinciden exactamente con el resultado oficial (`exact_score_points`). Acertar el ganador sin el marcador exacto otorga `0`.
- **`mixed`**: si el marcador es exacto, se otorgan `exact_score_points` (excluyente, no se suma con `result_points`). Si no es exacto pero el resultado derivado del marcador pronosticado coincide con el resultado oficial, se otorgan `result_points`. Si ninguno coincide, `0`.

### Bonus de jornada perfecta

`isPerfectMatchday(matchResults: boolean[])` (en `src/features/scoring/rules.ts`) es `true` solo si hay al menos un resultado computable y todos fueron exactos. Los partidos computables de una jornada son los `finished`; los `cancelled` quedan excluidos, siguiendo la misma definición usada en `docs/database/COMPETITION_CATALOG.md` ("Bonus de jornada perfecta") y `matchdayCanFinish`. Una jornada sin partidos computables nunca produce bonus, aunque se cierre administrativamente por tener todos sus partidos cancelados. Una membresía que no pronosticó alguno de los partidos computables de la jornada tampoco puede ganar el bonus, porque ese partido queda sin marcador exacto para ella. El bonus solo aplica a quinielas en modo `mixed`, único modo con `perfect_matchday_bonus_points` configurado.

## Disparo del cálculo

El cómputo se orquesta desde `src/server/services/scoring.ts` (`recomputeMatchPredictionPoints`, `recomputeMatchdayBonuses`), sin repetir ninguna validación de autorización: esas funciones se llaman únicamente desde flujos administrativos que ya verifican `super_admin` en `src/server/services/competition-catalog.ts`.

- **`updateMatch`**: cuando el partido transiciona a `finished` (acción `match.result_recorded` o `match.result_corrected`), se llama a `recomputeMatchPredictionPoints` para recalcular el puntaje de todas las predicciones de ese partido. Adicionalmente, si la jornada del partido ya está `finished` (es decir, se trata de una corrección posterior al cierre de la jornada), también se llama a `recomputeMatchdayBonuses` para esa jornada, de modo que una corrección de resultado nunca deje un bonus desactualizado sin intervención manual.
- **`transitionMatchday`**: cuando la jornada transiciona a `finished`, se llama a `recomputeMatchdayBonuses` para calcular el bonus de cada membresía con pronósticos en esa jornada. Como `canTransitionMatchday` permite la transición identidad `finished -> finished`, un `super_admin` puede volver a "finalizar" una jornada ya finalizada para forzar un recomputo manual del bonus si lo necesita, además del recomputo automático descrito arriba.

## Idempotencia

- `pool_match_prediction_scores` se actualiza con `onConflictDoUpdate` sobre el índice único de `pool_match_prediction_id`: recalcular tras una corrección sobrescribe el puntaje anterior, nunca lo acumula.
- `pool_matchday_perfect_bonuses` se recalcula completo por jornada: se borran todas las filas existentes de esa jornada y se insertan las que corresponden al estado actual, en el mismo `db.batch(...)`. Así, una membresía que pierde la jornada perfecta tras una corrección pierde también su bonus, en lugar de conservar una fila obsoleta.

## Lectura

`getCurrentUserPoolPredictions` extiende `PredictionMatch` con `pointsEarned: number | null` y `wasExactScore: boolean | null` (solo no nulos cuando el partido está `finished` y existe un puntaje calculado para el pronóstico del usuario actual), y `PredictionMatchday` con `perfectMatchdayBonusPoints: number | null` (solo no nulo cuando la jornada está `finished` y la membresía del usuario ganó el bonus). La consulta sigue anclada a `pool_memberships` del usuario autenticado, igual que el resto de la lectura de pronósticos: nunca puede exponer el puntaje o el bonus de otro miembro.

## Interfaz

La pantalla de jornadas (`matchday-predictions-form.tsx`) muestra los puntos ganados y una insignia de marcador exacto junto al pronóstico de solo lectura de cada partido finalizado, y el bonus de jornada perfecta una sola vez a nivel de la jornada seleccionada (no por partido).

## Fuera de alcance

- Premios calculados en base a puntos.
- Notificaciones de puntos o bonus ganados.
- Cualquier Server Action orientada al usuario para disparar el cálculo: todo el cómputo ocurre en servidor a partir de los eventos administrativos ya existentes.

El ranking o tabla de posiciones, que agrega estos puntos por membresía, está modelado en `docs/database/RANKING.md`.
