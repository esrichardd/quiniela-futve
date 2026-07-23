# Official Competition Catalog Database Model

## Objetivo

El catalogo oficial centraliza temporadas, equipos, jornadas, partidos, horarios y resultados. Una temporada se comparte entre todas las quinielas vinculadas; no existen calendarios ni resultados por quiniela.

## Tablas

### `competition_seasons`

Representa una edicion concreta de `competitions`. El codigo es unico dentro de la competicion y el estado admite `draft`, `active` o `finished`. Las fechas son opcionales y, cuando ambas existen, `ends_on` no puede preceder a `starts_on`.

Solo temporadas `active` de competiciones activas se ofrecen al crear quinielas. Apertura y Clausura se modelan como temporadas independientes en este MVP; no existe todavia una tabla de fases.

### `teams`

Identidad estable y global de un equipo. `code` es unico y normalizado; la participacion por temporada no se duplica en esta tabla.

### `season_teams`

Relacion many-to-many entre temporadas y equipos, con primary key `(competition_season_id, team_id)`. Las claves foraneas de partidos usan esta relacion para impedir equipos ajenos a la temporada.

### `matchdays`

Una jornada pertenece a una temporada, tiene numero positivo unico dentro de ella y estado `draft`, `published` o `finished`.

- `draft` no es visible para jugadores.
- `published` es visible y admite seguimiento de sus partidos.
- `finished` es un cierre explicito. El servicio solo lo permite si todos los partidos estan `finished` o `cancelled`.

La unicidad adicional `(id, competition_season_id)` permite que los partidos refuercen por FK que jornada y temporada coinciden.

### `matches`

Cada partido guarda `competition_season_id` y `matchday_id`. La temporada redundante garantiza que la jornada y ambos equipos pertenecen a la misma temporada.

Estados: `scheduled`, `postponed`, `in_progress`, `finished` y `cancelled`.

El resultado oficial solo existe en `finished`: ambos marcadores deben ser enteros no negativos. En cualquier otro estado ambos son `null`. Local y visitante deben ser distintos. `starts_at` usa `timestamp with time zone` y la UI lo presenta con locale y zona horaria del perfil.

### `competition_catalog_audit_events`

Registro append-only de cambios administrativos relevantes: creacion y estado de temporadas, altas de equipos, asociaciones, jornadas, horarios, estados y resultados. Conserva el `actor_user_id` de Neon Auth sin depender de sus tablas internas.

## Autorizacion

La administracion usa el rol global app-owned `super_admin`. `pool_admin` solo administra su quiniela y nunca puede modificar datos oficiales. Layouts, Server Actions y servicios verifican permisos de forma independiente.

## Transiciones

- Temporada: `draft -> active -> finished`.
- Jornada: `draft -> published -> finished`.
- Los partidos usan una matriz centralizada de transiciones.
- Un resultado `finished` puede corregirse por un `super_admin`; la correccion queda auditada.
- Una jornada requiere al menos un partido para publicarse.

## Consulta desde quinielas

`pools.competition_season_id` es obligatorio. La lectura parte de `pool_memberships`, muestra jornadas `published` y `finished` y ordena partidos por `starts_at` e ID.

El cierre futuro de pronosticos se evaluara contra `matches.starts_at` por partido en servidor. Un partido iniciado no cierra los partidos posteriores de la jornada.

## Borrado

Las relaciones oficiales usan `ON DELETE RESTRICT`. El MVP no ofrece acciones de borrado para temporadas, equipos, jornadas o partidos. Esto preserva referencias futuras desde pronosticos, puntuacion y auditoria.

## Bonus de jornada perfecta

Los partidos computables son los `finished`; `cancelled` queda excluido. Una jornada sin partidos computables nunca debe producir bonus, aunque pueda cerrarse administrativamente si todos fueron cancelados.
