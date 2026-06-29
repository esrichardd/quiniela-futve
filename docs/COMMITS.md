# Commits

## Objetivo

Los mensajes de commit deben ser cortos, claros y faciles de leer en el historial.

## Formato

```txt
type: mensaje corto
```

El mensaje debe estar en minusculas, en presente y sin punto final.

Ejemplos:

```txt
feat: add login page
fix: handle empty predictions
chore: update dependencies
docs: add architecture notes
refactor: simplify auth helpers
test: add pool creation tests
style: format dashboard cards
```

## Tipos permitidos

- `feat`: agrega una funcionalidad.
- `fix`: corrige un bug.
- `docs`: cambia documentacion.
- `chore`: tareas de mantenimiento sin cambio funcional.
- `refactor`: reorganiza codigo sin cambiar comportamiento.
- `test`: agrega o ajusta tests.
- `style`: cambios de formato o estilos sin cambio de logica.
- `build`: cambios de build, dependencias o tooling.
- `ci`: cambios de integracion continua.
- `perf`: mejora rendimiento sin cambiar comportamiento esperado.

## Reglas

- Usar un solo tipo por commit.
- Mantener el mensaje corto y especifico.
- No usar punto final.
- No mezclar cambios no relacionados.
- No usar mensajes genericos como `update`, `changes` o `fix stuff`.
- Preferir varios commits pequenos sobre un commit grande con varias intenciones.

## Alcance opcional

Se permite usar alcance cuando ayude a entender el area afectada:

```txt
feat(auth): add session provider
fix(i18n): preserve locale on redirect
docs(theming): define token rules
```

El alcance debe ser corto y en minusculas.
