# Contributing

## Objetivo

Este proyecto debe crecer con cambios pequenos, revisables y alineados con la arquitectura definida en `docs/ARCHITECTURE.md`.

## Reglas generales

- Leer `AGENTS.md` antes de modificar codigo.
- Revisar la documentacion relevante en `docs/` antes de implementar cambios estructurales.
- Mantener cambios enfocados en una sola intencion.
- No mezclar refactors grandes con features o fixes.
- No introducir modelos de datos, permisos o estructura persistente sin documentarlo primero en el archivo correspondiente.
- Preferir Server Components por defecto y Client Components solo cuando hagan falta interactividad, hooks o APIs del navegador.
- Validar entradas en servidor.
- Mantener textos visibles preparados para internacionalizacion.
- Usar tokens de diseno en lugar de colores hardcodeados.

## Antes de abrir un cambio

Ejecutar las validaciones que apliquen al alcance del cambio:

```bash
pnpm lint
pnpm build
```

Si el cambio agrega tests, tambien deben ejecutarse los tests relacionados.

## Documentacion

Actualizar documentacion cuando el cambio modifique decisiones, convenciones o comportamiento transversal.

Documentos base:

- `docs/ARCHITECTURE.md`
- `docs/INTERNATIONALIZATION.md`
- `docs/THEMING.md`
- `docs/database/README.md`
- `docs/database/MIGRATIONS.md`
- `docs/COMMITS.md`

## Commits

Los commits deben seguir las reglas de `docs/COMMITS.md`.
