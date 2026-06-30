# Theming

## Objetivo

La aplicacion debe soportar temas `light`, `dark` y `system` desde el inicio. El theming debe ser consistente, accesible y estable durante la carga inicial, sin parpadeos visuales ni estilos duplicados por componente.

Este documento define las reglas de theming para la aplicacion. La arquitectura general esta definida en `ARCHITECTURE.md`.

## Decisiones base

- La libreria base para resolucion y persistencia de tema es `next-themes`.
- Los temas soportados son `light`, `dark` y `system`.
- El tema por defecto es `system`.
- Tailwind CSS 4 es la capa de estilos utilitaria.
- Las variables CSS son la fuente de verdad para los valores visuales.
- Los componentes consumen tokens semanticos, no colores hardcodeados.
- El tema activo no debe modificar reglas de negocio ni permisos.

## Resolucion de tema

El tema efectivo se resuelve asi:

1. Si el usuario eligio explicitamente `light` o `dark`, se usa esa preferencia.
2. Si el usuario eligio `system`, se usa `prefers-color-scheme`.
3. Si no hay preferencia guardada, se usa `system`.

`system` no es un tema visual propio. Es una preferencia que se resuelve a `light` o `dark` segun el sistema operativo o navegador del usuario.

## Persistencia

La preferencia de tema debe persistirse para evitar que el usuario tenga que elegirla en cada visita.

- Para usuarios anonimos, la preferencia se persiste con el mecanismo de `next-themes`.
- Para usuarios autenticados, la preferencia pertenece a `user_preferences`, una tabla app-owned vinculada al `user_id` de Neon Auth.
- Al iniciar sesion, la preferencia del perfil del usuario tiene prioridad sobre la preferencia anonima.
- Al cerrar sesion, la interfaz conserva la ultima preferencia local conocida.

La implementacion debe evitar cambios bruscos de tema durante hidratacion. El tema debe resolverse lo mas temprano posible en el ciclo de render.

## Tokens de diseno

Los estilos visuales deben expresarse con tokens semanticos. Los tokens describen intencion, no colores concretos.

Categorias base:

- Superficies: `background`, `foreground`, `card`, `popover`.
- Texto secundario: `muted`, `muted-foreground`.
- Acciones: `primary`, `primary-foreground`, `secondary`, `secondary-foreground`.
- Estados: `destructive`, `destructive-foreground`, `success`, `warning`, `info`.
- Estructura: `border`, `input`, `ring`.
- Forma y profundidad: `radius`, `shadow`.

Reglas:

- Los componentes no deben usar colores hexadecimales directamente.
- Los componentes no deben definir variantes visuales separadas para `light` y `dark` cuando pueda resolverse con tokens.
- Los tokens deben existir en ambos temas.
- Un token no debe cambiar de significado entre temas.

## Integracion con Tailwind

Tailwind debe consumir variables CSS y tokens semanticos. Tailwind no debe convertirse en una paleta paralela con colores arbitrarios distribuidos por la aplicacion.

Reglas:

- Las clases utilitarias pueden usarse para layout, spacing, tipografia y estados interactivos.
- Los colores deben mapear a tokens.
- Las variantes `dark:` deben usarse con moderacion. La preferencia es resolver diferencias visuales mediante variables CSS.
- Los componentes base en `src/components/ui` definen el lenguaje visual reutilizable.
- Los componentes de `src/features` deben componer componentes base o consumir los mismos tokens.

## Componentes

Los componentes deben ser theme-aware sin conocer detalles de persistencia o resolucion del tema.

Reglas:

- Un componente puede leer el tema solo si su comportamiento visual realmente depende del valor elegido.
- Un componente no debe consultar permisos, datos de dominio o sesion para decidir colores.
- Los estados `hover`, `active`, `focus`, `disabled`, `loading` y `selected` deben verse correctamente en `light` y `dark`.
- Los iconos deben heredar color de texto o tokens semanticos.
- Las superficies interactivas deben tener contraste suficiente contra su fondo.

## Accesibilidad

El theming debe mantener accesibilidad en todos los temas.

Reglas:

- El contraste de texto e interfaz debe ser suficiente en `light` y `dark`.
- Todo foco interactivo debe ser visible.
- No se debe comunicar estado usando solo color.
- Estados destructivos, exitosos, informativos y de advertencia deben tener soporte visual y textual.
- El cambio de tema no debe desplazar layout ni esconder contenido.

## Relacion con preferencias de usuario

El tema es una preferencia de presentacion. No pertenece a la logica del dominio ni debe afectar autorizacion, visibilidad de datos o resultados de negocio.

La preferencia de tema pertenece a las preferencias app-owned del usuario autenticado. Neon Auth no es la fuente de verdad para el tema. `docs/database/USERS.md` define como se persiste esa preferencia; este documento define el comportamiento esperado.

## Validacion

Todo cambio visual relevante debe revisarse en:

- `light`
- `dark`
- `system`
- desktop
- mobile
- carga inicial
- navegacion entre rutas
- formularios
- tablas o listas densas
- estados vacios, errores y loading

Una pantalla no se considera lista si solo fue validada en un tema.

## Fuera de alcance

La aplicacion no soporta temas personalizados por usuario ni temas por competicion. El sistema visual tiene tres modos: `light`, `dark` y `system`.
