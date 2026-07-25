# Prediction Transparency Database Model

## Objetivo

Este documento define la segunda excepción documentada a la privacidad estricta de `docs/database/PREDICTIONS.md`: una pantalla de solo lectura donde cualquier miembro de una quiniela puede ver qué pronosticó cada uno de los demás miembros, una vez que la ventana de carga de ese partido ya cerró. El objetivo es transparencia dentro del grupo, no una relajación general de la privacidad de pronósticos.

## Modelo: agregación al vuelo, sin tabla nueva

Igual que `docs/database/RANKING.md`, esta pantalla no materializa datos propios. Es una consulta nueva sobre las mismas tablas ya persistidas: `pool_memberships`, `pool_match_predictions`, `pool_match_prediction_scores`, `pool_matchday_perfect_bonuses`, `matchdays`, `matches` y `user_profiles`. No hay migración asociada.

La diferencia frente a la lectura personal (`listPoolMatchPredictionRowsForUser`, anclada en la membresía de un solo usuario) es que la consulta de transparencia (`listPredictionTransparencyRowsForPool`) parte del **pool completo** y cruza cada partido visible con **todas** las membresías de esa quiniela, no con una sola. Una membresía sin pronóstico para un partido igual aparece en el resultado (con su pronóstico en `null`), en vez de quedar excluida.

## Regla de revelado

Un pronóstico se revela a todos los miembros exactamente en el mismo instante en que deja de poder editarse: `isPredictionRevealed(startsAt, now)` en `src/features/predictions/rules.ts`, que es la negación de la misma condición de tiempo que usa `isPredictionEditable` (`now >= getPredictionClosesAt(startsAt)`, es decir, 60 minutos antes del kickoff mediante `PREDICTION_LOCK_BUFFER_MINUTES`).

Esta decisión es deliberada: revelar un pronóstico solo puede ocurrir cuando ya nadie puede enviarlo o modificarlo, así que revelarlo nunca puede ayudar a nadie a copiar o ajustar su propia elección. Esto aplica partido por partido, igual que el cierre de carga; no espera a que el partido se juegue ni a que la jornada cierre.

Un partido cuya ventana todavía está abierta no revela absolutamente nada: ni el valor del pronóstico ni quién ya lo envió. El servicio (`getPoolPredictionTransparency`) fuerza esta redacción él mismo — el DAL puede traer las filas completas, pero el servicio descarta los pronósticos de un partido no revelado antes de construir el DTO, para que un pronóstico no revelado nunca llegue a la respuesta.

## Corrección y jornada perfecta

Una vez que el partido está `finished`, cada pronóstico revelado muestra además `pointsEarned` y `wasExactScore` (los mismos valores que ya calcula `scoring.ts`, ahora visibles para todos en vez de solo para su autor). Antes de que el partido termine, un pronóstico revelado se muestra sin ninguna indicación de acierto: solo el valor pronosticado.

El bonus de jornada perfecta se expone por membresía (`perfectMatchdayMembershipIds`) únicamente cuando la jornada está `finished` — igual regla que ya usa la lectura personal en `docs/database/SCORING.md`. El servicio vuelve a verificar el estado de la jornada además de la presencia del bonus, para no confiar en un dato inconsistente si llegara a existir.

## Autorización

- Sesión verificada (`requireVerifiedAppUser`), igual que predicciones, puntuación y ranking.
- Verificación de membresía reutilizando `getPoolMembershipCore` (movido a `src/server/dal/pools.ts` para compartirlo con ranking en vez de duplicar la misma consulta de autorización).
- Un usuario no miembro recibe `PoolMembershipRequiredError`, el mismo comportamiento que una quiniela inexistente.
- A diferencia de la lectura de pronósticos, esta pantalla expone deliberadamente a **todos** los miembros de la quiniela entre sí (nombre y pronóstico revelado), igual que el ranking expone el total de puntos de todos. Sigue sin ser pública fuera de la quiniela.

## DTO de lectura

`src/features/prediction-reveal/types.ts` define `PoolTransparencyView` → `matchdays: TransparencyMatchday[]` → `matches: TransparencyMatch[]` (con `isRevealed`) → `members: MemberMatchPrediction[]` (solo poblado cuando `isRevealed`). Es un DTO propio, independiente de `PredictionMatch`/`PredictionMatchday` (estrictamente personales) y de `RankingEntry` (no incluye pronósticos, solo totales).

## Interfaz

Pantalla `/[locale]/pools/[poolId]/transparency`, mismo patrón que `/matchdays` y `/ranking`: `requireDashboardUser`, `force-dynamic`, `PoolMembershipRequiredError` mapeado a `notFound()`, selector de jornada. Un partido no revelado muestra un candado con la hora en que se revelará; un partido revelado muestra el pronóstico de cada miembro, coloreado una vez el partido termina (mismo lenguaje visual que ya usa la pantalla personal de jornadas: éxito para acierto, insignia adicional para marcador exacto). Es de solo lectura, sin Server Actions.

## Fuera de alcance

- Notificaciones cuando se revela un pronóstico.
- Historial o comparación entre jornadas: cada jornada se revela de forma independiente.
- Cambiar la regla de cierre de pronósticos: esta pantalla solo lee el mismo instante ya definido en `docs/database/PREDICTIONS.md`.
