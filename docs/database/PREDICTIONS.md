# Match Predictions Database Model

## Objetivo

Este modelo persiste el pronóstico de una membresía para un partido oficial dentro de una quiniela. Extiende la lectura protegida de jornadas para que cada miembro vea y edite únicamente su propio pronóstico, respetando el modo de puntuación configurado en `pool_prediction_rules`. Este documento no define cálculo de puntos ni ranking; el cálculo de puntos y el bonus de jornada perfecta se modelan en `docs/database/SCORING.md`, y la tabla de posiciones en `docs/database/RANKING.md`.

## Tabla

### `pool_match_predictions`

Representa el pronóstico de una `pool_membership` para un `match` dentro de una `pool`.

Columnas:

- `id`: UUID, primary key.
- `pool_id`: UUID, quiniela a la que pertenece el pronóstico.
- `competition_season_id`: UUID, temporada oficial de la quiniela en el momento de guardar.
- `pool_membership_id`: UUID, membresía autora del pronóstico.
- `match_id`: UUID, partido oficial pronosticado.
- `predicted_result`: texto nullable (`home`, `draw` o `away`).
- `predicted_home_score`: smallint nullable, entre 0 y 99.
- `predicted_away_score`: smallint nullable, entre 0 y 99.
- `created_at` / `updated_at`: timestamptz.

## Representación según modalidad

Un check constraint permite únicamente una de estas dos representaciones:

- Pronóstico simple: `predicted_result` no es null y ambos marcadores son null.
- Pronóstico de marcador: `predicted_result` es null y ambos marcadores no son null.

La capa de servicio (`src/server/services/predictions.ts`) exige además que la representación coincida con `pool_prediction_rules.mode`:

- `simple` guarda `predicted_result`.
- `score` y `mixed` guardan ambos marcadores.

En `score` y `mixed` nunca se persiste `predicted_result`; el resultado simple se deriva del marcador con `derivePredictedResult` cuando haga falta (por ejemplo, en el futuro feature de puntuación), pero no se duplica en la fila.

## Claves e integridad

Como máximo un pronóstico por membresía y partido: índice único `pool_match_predictions_membership_match_unique` sobre `(pool_membership_id, match_id)`. Este índice también es el target del upsert.

Para poder expresar claves foráneas compuestas se agregaron índices únicos auxiliares:

- `pools_id_competition_season_unique` sobre `pools (id, competition_season_id)`.
- `pool_memberships_id_pool_unique` sobre `pool_memberships (id, pool_id)`.
- `matches_id_season_unique` sobre `matches (id, competition_season_id)`.

Claves foráneas de `pool_match_predictions`:

- `(pool_membership_id, pool_id)` → `pool_memberships (id, pool_id)` `ON DELETE CASCADE`. Garantiza que la membresía pertenece a la quiniela indicada.
- `(pool_id, competition_season_id)` → `pools (id, competition_season_id)` `ON DELETE CASCADE`. Garantiza que la quiniela referenciada pertenece a la misma temporada guardada en el pronóstico.
- `(match_id, competition_season_id)` → `matches (id, competition_season_id)` `ON DELETE RESTRICT`. Garantiza que el partido pertenece a esa temporada y evita que un partido oficial con pronósticos se borre accidentalmente (el catálogo oficial no ofrece borrado de partidos en este MVP).

Ningún ID enviado por el cliente se confía directamente: la Server Action solo recibe `poolId`, `matchId` y el payload; membresía, temporada y modo se resuelven en servidor a partir de la sesión autenticada.

Checks adicionales:

- `predicted_result` solo admite `home`, `draw` o `away` cuando no es null.
- Ambos marcadores, cuando no son null, están entre 0 y 99.
- El check de representación descrito arriba.

## Borrado

Borrar una quiniela elimina sus pronósticos por cascade, tanto por la FK directa a `pools` como por la cascada transitiva a través de `pool_memberships` (que ya se elimina en cascade al borrar la quiniela). Un partido oficial con pronósticos no puede borrarse mientras existan filas que lo referencien (`ON DELETE RESTRICT`); el catálogo oficial no expone borrado de partidos en este MVP, por lo que esta restricción es preventiva.

## Autorización

Todos los miembros de una quiniela pueden pronosticar (`pool_admin` y `player`). Un `super_admin` no obtiene acceso automático: para leer o escribir pronósticos también debe ser miembro, resuelto siempre desde `pool_memberships`. Un usuario no miembro recibe el mismo comportamiento que una quiniela inexistente (`PoolMembershipRequiredError`), sin filtrar si la quiniela privada existe.

Cada Server Action (`savePredictionAction`) vuelve a validar, tratándose como un endpoint público:

1. Input con Zod.
2. Sesión y verificación de usuario (`requireVerifiedAppUser`).
3. Membresía y modo de predicción (`getPredictionWriteMembershipContext`).
4. Que el partido pertenezca a la misma temporada de la quiniela (`getPredictionWriteMatchContext`, filtrado por `competition_season_id`).
5. Estado de la jornada y del partido, y el horario oficial de cierre.
6. Que la representación del payload coincida con el modo configurado.

Nunca se acepta del cliente `user_id`, `pool_membership_id`, `competition_season_id`, el modo de predicción, el horario oficial ni el estado oficial del partido; todos se resuelven en servidor.

## Privacidad

La lectura (`getCurrentUserPoolPredictions`) solo devuelve el pronóstico de la membresía del usuario autenticado. El DTO (`PoolPredictionsView` / `PredictionMatch`) es mínimo: no incluye IDs de otras membresías ni pronósticos de otros participantes. Al ser una lectura dependiente de la sesión, no entra en ningún caché global compartido (la página usa `force-dynamic`).

Esta privacidad estricta tiene una única excepción documentada, igual que el ranking: una vez que la ventana de pronósticos de un partido cierra, ese pronóstico deja de ser personal y se revela a todos los miembros de la quiniela para efectos de transparencia. Ver `docs/database/PREDICTION_TRANSPARENCY.md`.

## Regla de cierre

Un pronóstico puede crearse o actualizarse solamente cuando:

- La jornada está `published`.
- El partido está `scheduled` o `postponed`.
- `now` es estrictamente anterior al instante de cierre del partido.

El instante de cierre no es el horario oficial del partido (`matches.starts_at`), sino `starts_at` menos un margen fijo de `PREDICTION_LOCK_BUFFER_MINUTES` (60 minutos), calculado por `getPredictionClosesAt` en `src/features/predictions/rules.ts`. Es una decisión de producto para reducir el valor de un pronóstico enviado a último momento (por ejemplo, con la alineación ya conocida), no una frontera de seguridad adicional: la regla siempre se evaluó exclusivamente en servidor con el reloj del servidor (`isPredictionEditable`), así que el reloj del dispositivo del cliente nunca pudo evadirla, ni antes ni después de introducir este margen.

Se bloquea cuando `now >= getPredictionClosesAt(starts_at)`, el partido está `in_progress`, `finished` o `cancelled`, o la jornada está `draft` o `finished`. El motivo expuesto a la UI en ese primer caso es `prediction_window_closed` (en `src/features/predictions/types.ts`), deliberadamente sin mencionar "el partido ya comenzó": el cierre ocurre antes del kickoff. El cliente puede mostrar una cuenta regresiva informativa hasta ese instante, pero nunca es la frontera de seguridad.

Cada partido se bloquea de forma individual usando su propio `starts_at`; un partido que ya comenzó no bloquea los partidos posteriores de la misma jornada.

## Comportamiento de `postponed`

Un partido `postponed` con un nuevo `starts_at` futuro vuelve a aceptar pronósticos mientras mantenga ese estado y `now` sea anterior al nuevo horario. La regla no distingue entre `scheduled` y `postponed`: ambos son editables bajo las mismas condiciones de jornada y horario.

## Upsert

Cada partido se guarda con `db.insert(...).onConflictDoUpdate(...)` sobre el índice único `pool_match_predictions_membership_match_unique`:

- Si no existe fila para `(pool_membership_id, match_id)`, se crea.
- Si ya existe, se actualiza `predicted_result`, `predicted_home_score`, `predicted_away_score` y `updated_at`.
- `id` y `created_at` nunca se sobrescriben en el conflicto, por lo que se conservan.
- Reintentar la misma operación es segura.

La UI guarda todos los pronósticos editables de una jornada con un solo botón. El servicio `savePredictions(poolId, items)` valida cada partido de forma independiente (temporada, estado de jornada/partido, horario de cierre, modo) y solo agrupa en un `db.batch(...)` los que pasan la validación; ese batch es una única transacción no interactiva de Neon, así que se guardan todos o ninguno. Un partido inválido o bloqueado nunca bloquea a los demás partidos de la misma jornada: queda marcado con su propio código de error mientras el resto se guarda con normalidad. El resultado es un mapa `matchId -> { status: "saved" } | { status: "error", error }` que la UI usa para mostrar el estado de cada partido y un resumen agregado.

## Consultas

- Lectura: `listPoolMatchPredictionRowsForUser` parte de `pool_memberships` del usuario actual, une quiniela, temporada, competición y reglas de predicción, y hace `left join` de jornadas publicadas/finalizadas, partidos, equipos y el pronóstico propio (`pool_membership_id` de la fila).
- Escritura: `getPredictionWriteMembershipContext` resuelve membresía + modo; `getPredictionWriteMatchContext` resuelve partido + jornada filtrando por la temporada de la quiniela.
- Índices `pool_match_predictions_pool_id_idx` y `pool_match_predictions_match_id_idx` soportan las cascadas de borrado y las futuras consultas de puntuación por partido o por quiniela.

## Decisiones que quedan pendientes

- Premios calculados en base a puntos.

El cálculo de puntos por resultado o marcador exacto y el bonus de jornada perfecta ya están modelados en `docs/database/SCORING.md`, en tablas propias (`pool_match_prediction_scores`, `pool_matchday_perfect_bonuses`) separadas de `pool_match_predictions`: el pronóstico enviado por el usuario nunca se modifica para guardar puntos. La tabla de posiciones que agrega esos puntos por membresía ya está modelada en `docs/database/RANKING.md`.
