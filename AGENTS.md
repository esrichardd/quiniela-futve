<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Agent Coding Guidelines

## Language

- Code, variables, functions, types, files, and folders must be written in English.
- User-visible text must be written through the internationalization layer.
- The base user-facing language is Spanish.
- Code comments must be written in English.
- Avoid comments that restate obvious code.

## Documentation First

- Read the relevant document in `docs/` before changing cross-cutting behavior.
- Architecture decisions live in `docs/ARCHITECTURE.md`.
- Database decisions live in `docs/database/`.
- Internationalization rules live in `docs/INTERNATIONALIZATION.md`.
- Theming rules live in `docs/THEMING.md`.
- Commit message rules live in `docs/COMMITS.md`.
- Do not redefine architecture, database, i18n, or theming rules inside feature code.

## File Boundaries

- `src/app` is for routing, layouts, metadata, loading states, error boundaries, pages, and Route Handlers.
- Pages must stay thin: compose features and call safe server-side read functions.
- `src/components` is for reusable UI without domain ownership.
- `src/features` is for product/domain use cases.
- `src/server` is for server-only code, auth, database, DAL, services, and integrations.
- `src/i18n` is for locale configuration, message loading, and localized navigation helpers.
- `src/lib` is for small shared utilities.

## Server and Client Components

- Prefer Server Components by default.
- Use `"use client"` only for state, effects, event handlers, refs, browser APIs, or client-only hooks.
- Keep client component boundaries as small as practical.
- Do not import `src/server/*` from Client Components.
- Pass only minimal serializable DTOs from server code to Client Components.

## Data Access

- UI components must not query the database directly.
- Database reads and writes must go through the DAL or server services.
- Server Actions must validate input, verify session and permissions, and call DAL/services.
- Treat every Server Action as a public server entrypoint.
- Route Handlers are for webhooks, integrations, callbacks, and non-React clients.
- Do not use Route Handlers as the default internal API for React UI.

## TypeScript

- Do not use `any`.
- Prefer explicit types for public function signatures and external contracts.
- Use `import type` for type-only imports.
- Prefer discriminated unions for component variants and state variants.
- Keep large shared types out of visual components.

## Naming

| Element          | Convention | Example               |
| ---------------- | ---------- | --------------------- |
| React components | PascalCase | `PredictionCard.tsx`  |
| Hooks            | camelCase  | `usePredictions`      |
| Functions        | camelCase  | `getUserPools`        |
| Types            | PascalCase | `UserPreferences`     |
| Files            | kebab-case | `prediction-card.tsx` |
| Folders          | kebab-case | `user-menu`           |

## UI, Theming, and i18n

- Use design tokens and CSS variables instead of hardcoded colors.
- Support `light`, `dark`, and `system` theme behavior.
- Do not put visible UI strings directly in components.
- Use the i18n message layer for labels, buttons, empty states, errors, metadata, and form text.
- Format dates, times, numbers, and rankings through internationalization helpers.
- Validate UI in Spanish and English when adding visible text.

## Database and Migrations

- Schema code belongs in `src/server/db/schema/`.
- Real migration files belong in `src/server/db/migrations/`.
- Do not edit an applied migration.
- Do not use database push workflows as the main persistent migration strategy.
- Update `docs/database/` when a schema change introduces or changes a model contract.

## Styling

- Prefer Tailwind utility classes backed by semantic tokens.
- Keep global CSS limited to tokens, base styles, animations, and shared utilities.
- Do not add feature-specific global CSS.
- Use `lucide-react` for icons.

## Before Closing

- Remove dead imports and unused code.
- Check that visible text uses i18n.
- Check that theme styles use tokens.
- Check that server-only code stays out of client bundles.
- Run `pnpm lint` when code changes.
- Run `pnpm build` for structural or framework-level changes.
- Report clearly if validation could not be run.
