# Internationalization

## Objetivo

La aplicacion debe soportar multiples idiomas desde el inicio. Espanol es el idioma base y ingles es el segundo idioma soportado. La internacionalizacion debe cubrir rutas, metadata, textos visibles, formularios, validaciones y formatos de fecha, hora y numero.

Este documento define las reglas de internationalization, tambien referida como i18n. La arquitectura general esta definida en `ARCHITECTURE.md`.

## Decisiones base

- La libreria base de i18n es `next-intl`.
- El idioma base es `es`.
- Los locales soportados son `es` y `en`.
- Todo contenido de interfaz debe resolverse desde mensajes traducibles.
- La configuracion transversal vive en `src/i18n`.
- Las rutas publicas de aplicacion usan prefijo de locale.
- La ruta sin locale redirige al locale resuelto.

## Locales

Locales soportados:

- `es`: espanol, idioma base.
- `en`: ingles.

Reglas:

- `es` es el fallback final.
- Un locale no soportado debe resolverse a `es`.
- Los codigos de locale son cortos y no regionales: `es` y `en`.
- La aplicacion debe generar HTML con el atributo `lang` correcto para el locale activo.

## Estrategia de rutas

Las rutas de la aplicacion deben incluir prefijo de locale:

```txt
/es
/en
/es/...
/en/...
```

La raiz sin locale debe redirigir al locale resuelto. Las rutas internas deben preservar el locale activo durante la navegacion.

Reglas:

- No crear rutas duplicadas sin locale para la misma pantalla.
- Usar helpers de navegacion localizada para construir URLs internas.
- Los Route Groups de Next pueden organizar secciones sin cambiar la URL publica.
- Los Route Handlers internos de integraciones no necesitan prefijo de locale cuando no representan UI navegable.

## Resolucion de locale

El locale activo se resuelve con esta prioridad:

1. Locale presente en la URL.
2. Preferencia del usuario autenticado.
3. Preferencia persistida de usuario anonimo.
4. Cabecera `Accept-Language`.
5. Fallback `es`.

La URL tiene prioridad porque representa la intencion explicita del enlace actual.

## Mensajes

Los textos visibles deben vivir en archivos de mensajes por locale. Los componentes no deben hardcodear textos visibles salvo nombres propios, codigos tecnicos o contenido no traducible.

Estructura objetivo:

```txt
messages/
+-- es/
|   +-- common.json
|   +-- auth.json
|   +-- navigation.json
+-- en/
|   +-- common.json
|   +-- auth.json
|   +-- navigation.json
```

Reglas:

- `common` contiene texto realmente compartido.
- Los mensajes especificos deben vivir cerca del dominio funcional que representan.
- Las claves deben describir significado, no ubicacion visual.
- No reutilizar una misma clave para textos con intenciones diferentes.
- No traducir nombres propios de competiciones, equipos, personas o marcas desde la capa de mensajes de interfaz.

## Componentes

Los componentes deben recibir texto ya traducido o leer mensajes mediante las APIs de i18n aprobadas.

Reglas:

- Los componentes compartidos no deben asumir un idioma especifico.
- Los componentes de formulario deben traducir labels, placeholders, ayuda, errores y acciones.
- Los empty states, loading states y error states deben ser traducibles.
- Los componentes no deben formatear fechas o numeros manualmente.
- Los componentes cliente solo deben cargar los mensajes necesarios para su render.

### Mensajes en Client Components

- El provider localizado raiz usa `messages={null}`. Conserva locale y formatos sin serializar automaticamente todos los namespaces.
- Preferir strings traducidos como props cuando el componente cliente necesita pocos textos estaticos.
- Cada formulario interactivo de Auth recibe solo sus grupos compartidos y los de su pantalla; los mensajes de emails nunca se serializan al navegador.
- Los boundaries de home y quinielas reciben solo `pools.status`.
- El asistente de creacion recibe solo los grupos de `pools` que utiliza a lo largo de sus pasos; excluye metadata, listado, detalle, ingreso y estados.
- El formulario para unirse recibe solo `pools.join` y `pools.errors`.
- Todo provider nuevo debe seleccionar sus mensajes con el helper de `src/i18n/client-messages.ts`; omitir `messages` en un provider vuelve a serializar el catalogo completo.

## Metadata y SEO

La metadata visible para usuarios y buscadores debe ser localizable.

Reglas:

- `title` y `description` deben resolverse por locale.
- Open Graph y Twitter metadata deben usar texto localizado cuando representen paginas visibles.
- El atributo `lang` debe coincidir con el locale activo.
- Los links internos deben preservar locale.
- Las rutas localizadas deben evitar contenido duplicado sin diferenciacion de locale.

## Fechas, horas y numeros

Los formatos regionales deben resolverse con APIs de internationalization.

Reglas:

- Usar `Intl` o helpers basados en `Intl`.
- No formatear fechas con concatenacion manual.
- No asumir formato de fecha estadounidense.
- No asumir que el huso horario del usuario es el huso horario del evento.
- La hora de eventos deportivos debe mostrarse de forma clara para el usuario.
- Numeros, porcentajes y rankings deben formatearse segun locale.

## Validaciones y formularios

Las validaciones deben producir mensajes traducibles.

Reglas:

- Los schemas de validacion no deben acoplarse a frases en un solo idioma.
- Las validaciones deben devolver claves o estructuras que puedan traducirse.
- Los errores de servidor mostrados al usuario deben tener mensaje localizado.
- Los errores tecnicos internos no deben exponerse literalmente.
- Los errores de Neon Auth deben mapearse a claves propias antes de mostrarse en UI.
- Los flujos de login, registro, verificacion de email y recuperacion deben tener mensajes en `es` y `en`. OAuth debe cumplir la misma regla cuando se habilite.

Claves esperadas para auth:

- `invalid_credentials`
- `email_not_verified`
- `email_already_registered`
- `invalid_form`
- `invalid_reset_token`
- `network_error`
- `rate_limited`
- `user_banned`
- `unknown_error`

Los emails de autenticacion reutilizan shells HTML en `templates/emails/`, pero todo su contenido traducible vive bajo `auth.emails` en los archivos de mensajes. El locale se obtiene del callback localizado incluido en el link generado por Neon Auth y usa `es` como fallback.

## Contenido persistido

Este documento no define modelos de base de datos. La capa i18n no almacena variantes localizadas de contenido persistido; esa responsabilidad pertenece a `docs/database/README.md` y al documento del modulo correspondiente.

Reglas:

- El contenido de interfaz se traduce mediante mensajes.
- El contenido de dominio almacenado en base de datos se muestra como fue definido por el producto.
- Nombres propios y datos oficiales no se traducen automaticamente.
- Las variantes por idioma de datos persistidos pertenecen a `docs/database/README.md` y al documento del modulo correspondiente.

## Preferencias de usuario

El idioma es una preferencia de presentacion. No modifica permisos, reglas de negocio ni datos disponibles.

Reglas:

- Para usuarios autenticados, la preferencia de idioma pertenece al perfil del usuario.
- La preferencia autenticada se persiste en tablas app-owned, no en tablas internas de Neon Auth.
- Para usuarios anonimos, la preferencia puede persistirse localmente.
- La URL localizada siempre tiene prioridad sobre la preferencia guardada.
- Toda pantalla visible debe existir en los locales soportados. Cambiar idioma preserva la pantalla actual en el nuevo locale.

## Validacion

Toda pantalla visible debe revisarse en `es` y `en`.

Criterios:

- No hay mensajes faltantes.
- No hay textos visibles hardcodeados.
- La navegacion preserva locale.
- La metadata corresponde al locale activo.
- Fechas, horas y numeros respetan locale.
- Formularios muestran labels, ayudas y errores traducidos.
- Mobile y desktop no rompen layout por cambios de longitud de texto.

## Fuera de alcance

La aplicacion no soporta traduccion automatica en runtime. Todo texto de interfaz debe venir de mensajes versionados en el repositorio.
