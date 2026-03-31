# Mewl Project Guidelines

## Code Style

- Use React 19 + TypeScript in strict mode.
- Prefer interfaces for props and explicit return types; avoid `any` unless it is clearly justified.
- Use React hooks only (`useState`, `useTransition`, `useDeferredValue`); do not add Redux, Zustand, or Context-based state for app-wide logic.
- Keep layout and responsive structure in Tailwind utility classes; keep glass effects, gradients, and animation tokens in `src/styles.css`.
- Build reusable UI blocks in `src/components/ui.tsx` with the project’s cute naming pattern, such as `StatusPill`, `ShinyButton`, and `SugarCard`.
- Keep runtime contract types and mock/live data shapes in `src/data/runtime.ts`.

## Architecture

- Electron is the required host bridge for live runtime hydration; there is no browser-only fallback.
- Renderer runtime access flows through `src/runtime/provider.ts` and the Electron files in `electron/`.
- Treat `managed` services as explicit, user-controlled definitions and `observed` processes as live host rows that are read-only unless intentionally promoted.
- The primary workspace views are Overview, Processes, Managed, Ports, Monitor, and Automation.
- Keep Pink Pixel branding consistent with the core colors: pink `#ec4899` and purple `#8b5cf6`.

## Build and Test

- `npm run dev` starts the Vite dev server on `http://127.0.0.1:29463`.
- `npm run build` runs TypeScript checking and the production Vite build.
- `npm run preview` previews the production build on the same fixed port.
- `npm run dev:desktop` and `npm run desktop` are the Electron desktop flows.
- Use the build as the main validation step; there is no separate automated test suite yet.

## Conventions

- Keep the shared search and filtering experience responsive with `useDeferredValue` and `startTransition`.
- Do not change the fixed dev/preview port.
- Prefer explicit managed-service fields and lifecycle actions over inferred launch guesses.
- When changing product behavior, keep README.md, OVERVIEW.md, ROADMAP.md, and CHANGELOG.md aligned.
- Prefer small, focused updates that preserve the project’s compact operational UI.
