# Arquitectura del proyecto

## Contexto

`quiniela-futve` nace como una aplicacion en blanco creada con `pnpm create next-app@latest quiniela-futve --yes`.

El objetivo inicial es construir una plataforma de quinielas para la liga de futbol de Venezuela, manteniendo desde el dia cero una arquitectura extensible para soportar multiples ligas, temporadas, roles y flujos administrativos.

## Referencias revisadas

Se reviso la documentacion local instalada en `node_modules/next/dist/docs/`, como exige `AGENTS.md`, especialmente:

- `01-app/01-getting-started/02-project-structure.md`
- `01-app/01-getting-started/03-layouts-and-pages.md`
- `01-app/01-getting-started/05-server-and-client-components.md`
- `01-app/01-getting-started/06-fetching-data.md`
- `01-app/01-getting-started/07-mutating-data.md`
- `01-app/01-getting-started/08-caching.md`
- `01-app/01-getting-started/15-route-handlers.md`
- `01-app/01-getting-started/16-proxy.md`
- `01-app/02-guides/authentication.md`
- `01-app/02-guides/data-security.md`
- `01-app/02-guides/upgrading/version-16.md`

Referencias externas utiles:

- Next.js docs: https://nextjs.org/docs
- React docs: https://react.dev
- Better Auth docs: https://www.better-auth.com/docs
- Drizzle ORM docs: https://orm.drizzle.team/docs
- next-intl docs: https://next-intl.dev/docs
- next-themes docs: https://github.com/pacocoursey/next-themes
- Zod docs: https://zod.dev

## Principios de arquitectura

1. Usar App Router como unico sistema de rutas.
2. Mantener `app` enfocado en routing, layouts, loading/error states y composicion de pantallas.
3. Usar Server Components por defecto.
4. Usar Client Components solo cuando hagan falta estado interactivo, eventos, efectos, APIs del navegador o hooks de cliente.
5. Centralizar acceso a datos en una Data Access Layer server-only.
6. Validar permisos dentro de cada operacion sensible, incluyendo Server Actions y Route Handlers.
7. No hardcodear FUTVE como unico dominio; las competiciones deben tratarse como configuracion del producto.
8. Preferir DTOs minimos y seguros para pasar datos a componentes, especialmente componentes cliente.
9. Evitar que componentes UI conozcan detalles de base de datos, autenticacion o proveedores externos.
10. Evitar textos visibles hardcodeados en pantallas y componentes compartidos.
11. Usar tokens de diseno para estilos visuales, evitando colores hardcodeados en componentes.
12. Organizar por dominio cuando el codigo represente negocio, y por tipo solo para piezas compartidas transversales.

## Stack base

### Base

- Framework: Next.js 16 con App Router.
- UI runtime: React 19.
- Lenguaje: TypeScript estricto.
- Styling: Tailwind CSS 4.
- Package manager: pnpm.

### Datos

- Base de datos: PostgreSQL.
- Proveedor de base de datos: Neon.
- ORM/query builder: Drizzle ORM.
- Migraciones: Drizzle Kit.
- Validacion: Zod.

PostgreSQL encaja bien porque la aplicacion tendra un dominio relacional y necesitara integridad fuerte entre sus conceptos principales. Neon sera el proveedor gestionado de PostgreSQL por su ajuste natural con aplicaciones Next.js modernas y despliegues serverless. Drizzle mantiene el esquema en TypeScript, permite SQL explicito cuando haga falta y se integra bien con PostgreSQL y Better Auth.

### Autenticacion y autorizacion

- Auth: Better Auth.
- Estrategia inicial: email/password o OAuth segun producto, con sesiones gestionadas por la libreria.
- Roles de aplicacion: `super_admin`, `league_admin`, `pool_admin`, `player`.
- Permisos: helpers centralizados en `src/server/auth/permissions.ts`.

Better Auth sera la capa de identidad, sesiones y flujos de autenticacion. La autorizacion del dominio se mantendra en codigo propio, porque los permisos dependen del contexto de negocio: liga, temporada, quiniela, membresia, estado del partido y rol del usuario dentro de cada ambito.

### Formularios y mutaciones

- Server Actions para mutaciones internas usadas por pantallas React.
- Route Handlers para webhooks, integraciones externas, endpoints publicos o clientes no React.
- Zod para validar input en el servidor.
- `revalidatePath`, `revalidateTag` o invalidacion equivalente cuando una mutacion cambie datos visibles.

### UI

- Tailwind CSS 4 para estilos.
- Componentes base propios en `src/components/ui`.
- Iconos: `lucide-react`.

### Internacionalizacion

- Libreria base: next-intl.
- Idioma base: espanol.
- Idiomas preparados inicialmente: `es` y `en`.
- Las rutas deben poder resolverse por locale.
- Los textos visibles de UI deben vivir fuera de los componentes, salvo contenido tecnico o nombres propios.

### Theming

- Libreria base: next-themes.
- Temas soportados: `light`, `dark` y `system`.
- La UI debe consumir tokens de diseno y variables CSS.
- Tailwind debe apoyarse en tokens, no en colores arbitrarios distribuidos por la aplicacion.
- La preferencia de tema debe poder resolverse sin parpadeos visuales durante la carga inicial.

### Testing

- Unit tests: Vitest.
- Component tests: Testing Library cuando haga sentido.
- E2E: Playwright para flujos criticos como login, crear quiniela, enviar predicciones y revisar ranking.
- Validacion continua minima: `pnpm lint`, `pnpm build`, tests unitarios y E2E criticos.

## Estructura objetivo

Cuando empecemos la implementacion, conviene mover el codigo de aplicacion a `src/`. Next soporta oficialmente `src` y ayuda a separar configuracion raiz de codigo producto.

```txt
src/
+-- app/
|   +-- (public)/
|   |   +-- page.tsx
|   |   +-- leagues/[leagueSlug]/page.tsx
|   +-- (auth)/
|   |   +-- login/page.tsx
|   |   +-- register/page.tsx
|   +-- (dashboard)/
|   |   +-- layout.tsx
|   |   +-- dashboard/page.tsx
|   |   +-- quinielas/page.tsx
|   |   +-- quinielas/[poolId]/page.tsx
|   |   +-- admin/
|   |       +-- leagues/page.tsx
|   |       +-- seasons/page.tsx
|   |       +-- matches/page.tsx
|   +-- api/
|   |   +-- webhooks/
|   |       +-- route.ts
|   +-- layout.tsx
|   +-- globals.css
|   +-- error.tsx
|   +-- loading.tsx
|   +-- not-found.tsx
+-- components/
|   +-- ui/
|   +-- layout/
|   +-- feedback/
+-- i18n/
+-- features/
|   +-- auth/
|   +-- leagues/
|   +-- seasons/
|   +-- teams/
|   +-- matches/
|   +-- quinielas/
|   +-- predictions/
|   +-- leaderboards/
+-- server/
|   +-- auth/
|   +-- db/
|   |   +-- client.ts
|   |   +-- schema/
|   |   +-- migrations/
|   +-- dal/
|   +-- services/
|   +-- integrations/
+-- lib/
|   +-- env.ts
|   +-- routes.ts
|   +-- dates.ts
|   +-- utils.ts
+-- types/
```

## Responsabilidades por carpeta

### `src/app`

Contiene rutas, layouts, `loading.tsx`, `error.tsx`, `not-found.tsx`, metadata y Route Handlers.

Reglas:

- No poner queries SQL directas en paginas.
- No poner reglas de negocio complejas en `page.tsx`.
- Las paginas componen features y llaman funciones de lectura seguras del DAL.
- Usar route groups como `(public)`, `(auth)` y `(dashboard)` para organizar layouts sin afectar URLs.

### `src/components`

Componentes compartidos y sin conocimiento profundo del dominio.

Ejemplos:

- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/layout/app-shell.tsx`
- `components/feedback/empty-state.tsx`

Reglas:

- No importar `src/server/*`.
- No hacer fetching directo.
- Aceptar datos ya preparados por props.

### `src/i18n`

Configuracion transversal de internacionalizacion.

Reglas:

- Centralizar locales soportados, helpers de resolucion de idioma y carga de mensajes.
- Mantener los mensajes traducibles fuera de componentes de dominio y componentes compartidos.
- Evitar que la estructura de traducciones defina el modelo de datos del producto.

### `src/features`

Codigo orientado a casos de uso del producto. Cada feature puede tener:

```txt
features/quinielas/
+-- components/
+-- actions.ts
+-- queries.ts
+-- schemas.ts
+-- types.ts
+-- permissions.ts
```

Reglas:

- `actions.ts` contiene Server Actions de esa feature.
- `schemas.ts` contiene validaciones Zod.
- `components/` contiene UI especifica del dominio.
- Si una funcion toca base de datos directamente, debe vivir en `src/server/dal` o importar desde alli.

### `src/server`

Codigo que solo debe ejecutarse en servidor.

Subcarpetas:

- `auth`: configuracion de Better Auth, session helpers y permisos.
- `db`: cliente Drizzle, schema y migraciones.
- `dal`: lecturas/escrituras seguras que devuelven DTOs.
- `services`: orquestacion de casos de negocio que combinan varias entidades.
- `integrations`: clientes para APIs externas, por ejemplo proveedores de fixtures/resultados.

Reglas:

- Los archivos server-only deben importar `server-only`.
- Ningun Client Component puede importar desde `src/server`.
- Las funciones del DAL hacen checks de autenticacion/autorizacion cuando leen datos privados.

### `src/lib`

Utilidades transversales que pueden ser isomorficas, salvo que el archivo indique lo contrario.

Ejemplos:

- `env.ts` para parsear variables con Zod.
- `routes.ts` para helpers de URLs internas.
- `dates.ts` para formato y zonas horarias.
- `utils.ts` para helpers puros como `cn`.

## Estrategia de routing

La aplicacion usara App Router como unico sistema de rutas. Las rutas deben organizarse con route groups para separar secciones de producto sin afectar la URL publica.

Grupos principales:

- Publico: paginas de entrada, exploracion y contenido visible sin sesion.
- Auth: login, registro, recuperacion y flujos relacionados con identidad.
- Dashboard: experiencia autenticada del usuario.
- Admin: administracion de plataforma y operaciones internas.

Las rutas administrativas deben validar permisos en layout y en cada operacion de datos. El layout sirve para UX y redireccion temprana; no reemplaza autorizacion en el servidor.

## Data Access Layer

La DAL es la frontera principal de seguridad y datos. Debe:

- Ejecutarse solo en servidor.
- Leer la sesion actual cuando aplique.
- Verificar permisos.
- Consultar la base de datos.
- Devolver DTOs minimos.
- Evitar pasar modelos completos de DB a componentes cliente.

## Servicios de dominio

Usar `src/server/services` cuando una operacion coordine varias entidades o reglas.

Los servicios encapsulan reglas de negocio y coordinan operaciones que no pertenecen a una sola lectura o escritura simple. No deben devolver datos sin filtrar a UI. Si se necesita UI, se expone un DTO via DAL o un action.

## Server Actions

Usar Server Actions para mutaciones iniciadas por la UI. Toda Server Action debe tratarse como una entrada publica al servidor, aunque se invoque desde un formulario o componente interno.

Reglas:

- Cada action valida input con Zod.
- Cada action verifica sesion y permisos.
- Cada action llama servicios o DAL, no SQL inline.
- Cada action revalida rutas/tags afectadas.
- Nunca confiar en que el boton o formulario solo existe para usuarios autorizados.

## Route Handlers

Usar `app/api/**/route.ts` para:

- webhooks de auth, pagos o proveedores externos
- endpoints consumidos por apps externas
- callbacks OAuth si la libreria lo requiere
- importaciones o sincronizaciones externas

No usar Route Handlers como API interna por defecto si la UI puede resolverlo con Server Components y Server Actions.

## Proxy

Next 16 renombra Middleware a Proxy. Si se necesita, debe existir un unico `proxy.ts` en la raiz o en `src`.

Usos permitidos:

- redirecciones optimistas para usuarios no autenticados
- agregar headers transversales
- experimentos o rewrites simples basados en request

No usar Proxy como autorizacion definitiva ni para consultas lentas.

## Caching y render

Next 16 introduce un modelo donde Cache Components y `use cache` pueden ser importantes. Decision inicial:

- No activar `cacheComponents` hasta tener los primeros flujos y mediciones.
- Usar Server Components y streaming con `loading.tsx` o `Suspense` para datos dinamicos.
- Cuando haya datos publicos relativamente estables, como ligas, equipos o fixture publicado, evaluar `use cache`, `cacheLife` y tags.
- Datos personalizados, permisos y sesiones no deben cachearse globalmente.

## Internacionalizacion y theming

La internacionalizacion y el theming son capacidades transversales de la aplicacion, no detalles exclusivos de UI. Deben considerarse desde el inicio en routing, metadata, formularios, validaciones, preferencias de usuario y componentes compartidos.

La estrategia de i18n debe partir de espanol como idioma base y preparar ingles como segundo idioma. El idioma activo debe poder resolverse por ruta, preferencia de usuario o fallback del sistema. Las fechas, horas, numeros y formatos visibles deben pasar por APIs de internacionalizacion, no por formateo manual disperso.

La estrategia de theming debe soportar `light`, `dark` y `system`. Los componentes deben consumir tokens de diseno y variables CSS para que el cambio de tema sea coherente en toda la aplicacion. La preferencia visual debe poder persistirse y resolverse antes de que la interfaz sea interactiva para evitar cambios bruscos durante la hidratacion.

La definicion detallada de namespaces, mensajes, rutas localizadas, providers, tokens y persistencia de preferencias vive en documentos especificos, como `INTERNATIONALIZATION.md` y `THEMING.md`.

## Seguridad

Reglas obligatorias:

- Variables secretas solo en servidor.
- Validacion Zod en toda entrada externa.
- `server-only` en DAL, DB, auth y servicios.
- DTOs minimos hacia componentes.
- Autorizacion en DAL/actions/services, no solo en layouts.
- No exponer IDs sensibles si se puede usar slug publico.
- Rate limiting para login, registro, unirse a quinielas y enviar predicciones cuando se implemente infraestructura.
- La seguridad debe aplicarse en tres controles: interfaz, servidor y base de datos.
- La interfaz ayuda a la experiencia del usuario, pero nunca es la fuente de autorizacion.
- El servidor es el punto obligatorio de validacion antes de leer o mutar datos.
- La base de datos debe reforzar integridad con constraints, relaciones, unicidad y estados validos.

## Roles y permisos

La autorizacion se modelara como permisos contextuales, no solo como roles globales. Un usuario puede tener distintas capacidades segun el ambito donde actua: plataforma, liga, temporada, quiniela o participacion.

Roles conceptuales iniciales:

- `super_admin`: administra toda la plataforma.
- `league_admin`: administra ligas, temporadas, equipos y partidos dentro de su ambito.
- `pool_admin`: administra una quiniela especifica.
- `player`: participa en quinielas.

Los permisos se evaluaran siempre con contexto. Por ejemplo, poder editar una quiniela depende de la quiniela concreta, la membresia del usuario, el estado de la quiniela y las reglas definidas. Poder cargar resultados depende de la liga o temporada asignada, no solamente de que el usuario tenga una etiqueta administrativa.

La definicion detallada de tablas y relaciones persistidas vive en `docs/database/`. La definicion detallada de permisos vive en el documento de autorizacion correspondiente.

## Convenciones de nombres

- Rutas dinamicas: `[leagueSlug]`, `[poolId]`, `[matchId]`.
- Slugs publicos para URLs humanas.
- IDs internos como UUID o cuid/ulid.
- Archivos de actions: `actions.ts`.
- Validaciones: `schemas.ts`.
- DTOs o tipos de UI: `types.ts`.
- Queries de lectura de feature: `queries.ts`.
- Codigo server-only compartido: `src/server/**`.
