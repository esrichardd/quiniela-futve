# Private Pools Database Model

## Objetivo

Este modelo implementa quinielas privadas configurables. Persiste la competicion, costo informativo, premios, reglas de prediccion, membresias contextuales y codigo de invitacion sin depender de las tablas internas de Neon Auth.

## Tablas

### `competitions`

Catalogo app-owned de ligas y competiciones con UUID estable, codigo unico, nombre propio, estado activo y timestamps. El registro inicial es Liga FUTVE, insertado de forma idempotente mediante `pnpm db:seed`. El modelo no limita el catalogo a esa competicion.

### `pools`

Entidad principal de una quiniela privada.

- `competition_id` referencia una competicion y restringe su borrado.
- `created_by_user_id` referencia el perfil app-owned del creador.
- `creation_token` es la clave de idempotencia de la confirmacion.
- `name` y `description` contienen la informacion definida por el administrador.

La combinacion `(created_by_user_id, creation_token)` es unica. Un reintento de la misma confirmacion devuelve la quiniela existente.

### `pool_financial_settings`

Configuracion monetaria uno-a-uno con la quiniela.

- `currency`: `USD`, `COP` o `VES`.
- `has_participation_fee`: indicador explicito.
- `participation_fee_minor`: `bigint` en unidades minimas o `null` para una quiniela gratuita.

La constraint exige un monto positivo cuando existe fee y `null` cuando no existe. Todos los montos son informativos; no representan cobros ni pagos procesados.

### `pool_prize_configurations`

Discriminador persistido del modelo de premios. Combinaciones validas:

- `winner_takes_all` + `pooled`
- `first_place` + `percentage`
- `first_place` + `fixed`
- `top_three` + `percentage`
- `top_three` + `fixed`

### `pool_prize_allocations`

Distribuciones para modelos porcentuales o fijos. La clave es `(pool_id, position)` y una FK compuesta garantiza que los discriminadores coincidan con `pool_prize_configurations`.

- En modo `percentage`, `value` contiene basis points enteros entre 1 y 10000.
- En modo `fixed`, `value` contiene unidades monetarias minimas positivas.
- `first_place` solo admite la posicion 1.
- `top_three` exige las posiciones 1, 2 y 3 desde el servicio de creacion.

Para top tres, la suma porcentual debe ser mayor que cero y menor o igual a 100%. Puede existir un remanente no asignado y no visible como premio. Los montos fijos deben cumplir primero mayor o igual a segundo, y segundo mayor o igual a tercero.

Los porcentajes se aplican al fee multiplicado por la cantidad actual de membresias, incluyendo administradores. El calculo usa enteros y redondea hacia abajo a la unidad minima; cualquier fraccion o porcentaje no asignado permanece fuera de los premios mostrados.

### `pool_prediction_rules`

Union discriminada de reglas de puntuacion:

- `simple`: `result_points` positivo; las demas columnas de puntos son `null`.
- `score`: `exact_score_points` positivo; las demas columnas de puntos son `null`.
- `mixed`: puntos de resultado positivos, puntos exactos mayores y bonus de jornada perfecta positivo.

En `mixed`, el marcador exacto entrega solamente `exact_score_points`; no se acumula con `result_points`. Si todos los marcadores de una jornada son exactos, se agrega `perfect_matchday_bonus_points`.

### `pool_memberships`

Relacion contextual entre usuarios y quinielas. La combinacion `(pool_id, user_id)` es unica y el rol solo admite `pool_admin` o `player`. El creador se inserta como administrador y el ingreso por codigo usa jugador. Todos los roles cuentan como participantes del pozo.

### `pool_invitation_codes`

Codigo uno-a-uno con una quiniela.

- Longitud fija de seis caracteres.
- Alfabeto: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`.
- Generacion criptograficamente segura en servidor.
- Constraint unica global e indice por codigo.
- No deriva de IDs, nombres ni datos del usuario.

El codigo solo se incluye en DTOs de administradores. La regeneracion no forma parte de este MVP.

## Consistencia y concurrencia

El cliente instalado usa `drizzle-orm/neon-http`. Este driver no soporta `db.transaction(...)` interactivo, pero `db.batch([...])` ejecuta una transaccion no interactiva de Neon.

La creacion envia en un batch atomico la quiniela, configuraciones, asignaciones, membresia administrativa y codigo. Una colision de codigo reintenta todo el batch con un codigo nuevo. Cualquier otro error revierte el conjunto.

El ingreso normaliza y valida el codigo, inserta la membresia con `ON CONFLICT DO NOTHING` y trata los reintentos como exito idempotente.

## Autorizacion

- Solo miembros pueden obtener el detalle.
- Un usuario no miembro y un ID inexistente producen la misma respuesta de not found.
- Solo `pool_admin` puede consultar el codigo.
- Los roles se resuelven desde `pool_memberships`, nunca desde `user_profiles.global_role` ni desde datos enviados por el cliente.
- Las Server Actions vuelven a validar sesion, verificacion, bloqueo, entrada y permisos.

## Indices

- Codigo y estado activo de competicion.
- Competicion y creador de quiniela.
- Token idempotente por creador.
- Membresias por quiniela y por usuario.
- Membresia unica por usuario y quiniela.
- Codigo de invitacion unico.

## Borrado

- Una competicion referenciada no se elimina.
- El borrado controlado de una quiniela elimina sus configuraciones, asignaciones, membresias y codigo.
- Un perfil con quinielas creadas o membresias no se elimina por cascade.
- No existe UI de borrado de quinielas o miembros en este MVP.
