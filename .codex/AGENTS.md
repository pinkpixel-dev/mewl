# Mewl Development Guidelines

## General Rules

- Always sound friendly and engaged with this project.
- Always update all documentation files - README.md, CHANGELOG.md, OVERVIEW.md, ROADMAP.md, and any other documentation and/or planning documents after completing a task.
- Use all available agents, skills, and tools autonomously as needed.
- Always refer to all instruction files at the start of new tasks.
- Use Context7 tools for up-to-date framework/API documentation.
- Check the system date/time before updating CHANGELOG.md.
- Thoroughly understand the full codebase context before making any changes. When uncertain, ask for clarification.
- Keep `OVERVIEW.md` (technical overview document), `README.md`, and `CHANGELOG.md` current. Create them if they don't exist.
- Always create an Apache 2.0 `LICENSE` file if none exists.
- Always produce modern, elegant, and stylized solutions — avoid outdated or basic implementations.

**Important:** Do NOT change files unless you fully understand the project structure and intent.

**Important:** Always update all documentation files - README.md, CHANGELOG.md, OVERVIEW.md, ROADMAP.md, and any other documentation and/or planning documents after completing a task.

## Brand

- Primary: Pink `#ec4899` · Secondary: Purple `#8b5cf6`

---

## Owner / Org Branding

- **Name:** Pink Pixel
- **Website:** [pinkpixel.dev](https://pinkpixel.dev)
- **GitHub:** [github.com/pinkpixel-dev](https://github.com/pinkpixel-dev)
- **Email:** admin@pinkpixel.dev
- **Support Email:** support@pinkpixel.dev
- **Discord:** @sizzlebopz
- **Funding:** [buymeacoffee.com/pinkpixel](https://www.buymeacoffee.com/pinkpixel) · [ko-fi.com/sizzlebop](https://ko-fi.com/sizzlebop)
- **Tagline:** "Dream it, Pixel it ✨”
- **Signature:** “Made with 💖 by Pink Pixel”

---

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

---

## Project Overview

**Mewl** is an interactive, local operations cockpit for managing running services, monitored ports, and system metrics from a single workspace. Features include:

- Search and start/stop/restart/scan services
- Process and port registry browser
- Host system pressure monitoring (CPU, memory, disk, network)
- Service health sidebar with status indicators
- Mock-backed design (real runtime adapter coming via Electron/Tauri/daemon)

It's a **Pink Pixel** branded product with a custom visual system featuring glass UI effects and cute component naming conventions.

---

## Tech Stack & Constraints

- **Framework**: React 19.2.4 + TypeScript (strict mode, ES2021 target)
- **Build**: Vite with `@tailwindcss/vite` plugin (not PostCSS)
- **Styling**: Tailwind CSS 4 + custom CSS for glass effects in `src/styles.css`
- **Icons**: lucide-react
- **State**: React hooks only (`useState`, `useTransition`, `useDeferredValue`)
- **Dev server**: Fixed port `29463` (enforced via `strictPort: true` in vite.config)
- **License**: Apache-2.0

---

## Build & Development Commands

```bash
npm run dev      # Start dev server on http://127.0.0.1:29463
npm run build    # TypeScript check + Vite build
npm run preview  # Preview production build
# Note: No test suite yet (type checking during build is validation)
```

**Key constraint**: Both dev and preview servers use port 29463—do not suggest changing this.

---

## Architecture & Key Files

| File                    | Purpose                                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx`           | Main shell: navigation rail, 6 workspace views, search/filter, alerts tray, lifecycle handlers                                           |
| `src/components/ui.tsx` | Reusable UI **Building Blocks**: `StatusPill`, `ShinyButton`, `SugarCard`, `CandyInput`, `SweetToggle`, `HologramProgress`, `SignalBars` |
| `src/data/runtime.ts`   | **Contract layer** for mock process/port/alert/automation data (integration point for real runtime adapter)                              |
| `src/styles.css`        | Design system: gradients, overlays, glass panels, animations, Google fonts                                                               |
| `vite.config.ts`        | Vite configuration (port 29463, Tailwind integration)                                                                                    |
| `index.html`            | Entry point                                                                                                                              |

### Workspace Structure

- 6 main views: Overview, Processes, Managed, Ports, Monitor, Automation
- Collapsible left navigation rail
- Top action header with search/filter
- Alerts tray at bottom
- Expandable host health sidebar

---

## Coding Conventions

### State Management

- Use React Hooks exclusively: `useState` for local state, `useTransition` for async actions, `useDeferredValue` for responsive search/filters
- No Redux, Context API, or external state management
- Actions use `startTransition()` for non-blocking updates

### Component Naming & Color Tones

Follow cute naming pattern with status tones:

- **Component names**: `SomeFeaturePill`, `SweetInput`, `HologramProgress` (descriptive + character)
- **Status tones**: Use `online`, `warning`, `offline`, `starting` as data attributes or className suffixes
- **Button icons**: lucide-react icons (e.g., `Play`, `Square`, `RefreshCw`, `Zap`)

### Styling

- **Preferred**: Tailwind CSS utility classes for layout, spacing, responsive design
- **Custom CSS**: Use `src/styles.css` for glass effects, gradients, animations, design tokens
- **No component libraries**: All UI components built in `src/components/ui.tsx` using Tailwind + custom CSS
- **Responsive**: Mobile-first Tailwind breakpoints

### TypeScript

- Strict mode enabled—no `any` types without justification
- Type all props, state, and function returns
- Use interfaces for component props; avoid inline types

---

## Mock-First Design & Contract Layer

**Core principle**: All data flows through `src/data/runtime.ts`. This is a **contract layer** that will eventually connect to a real runtime backend (Tauri/Electron/daemon).

### Current Mock Data

`runtime.ts` exports mock objects for:

- Processes list + actions (start, stop, restart, scan)
- Port registry with ownership
- System metrics (CPU, memory, disk, network)
- Alert list + automation rules

### For New Features

1. **Define the contract** in `runtime.ts` (interfaces/types for data and actions)
2. **Implement mock data** to feed the UI
3. **Add UI components** that consume mock data
4. **Document the integration point** for future real-backend swap

---

## Development Workflow

### Adding Features

1. **New data shape?** Add interfaces and mock data to `src/data/runtime.ts`
2. **New UI component?** Build in `src/components/ui.tsx` following cute naming + Tailwind + custom CSS
3. **New view?** Add to `src/App.tsx` with navigation entry
4. **Styling adjustments?** Prefer Tailwind classes; add custom effects to `src/styles.css`

### Common Tasks

- **Button/pill/card style updates** → Add Tailwind classes or custom CSS in `styles.css`
- **Add status indicator** → Use `StatusPill` component or add color tone variant
- **Responsive layout** → Use Tailwind breakpoints (`sm:`, `md:`, `lg:`)
- **Performance optimization** → Use `useDeferredValue` for input filtering, `useTransition` for state changes

### Before Committing

1. Run `npm run build` to ensure TypeScript check passes
2. Test dev server at http://127.0.0.1:29463
3. Verify feature works with mock data

---

## Anti-Patterns to Avoid

- ❌ Don't add external state management (Redux, Zustand, Context API)—use hooks
- ❌ Don't use component libraries (Material-UI, shadcn, Chakra)—build in `ui.tsx`
- ❌ Don't hardcode colors—use Tailwind + design tokens in `styles.css`
- ❌ Don't bypass the contract layer—all data modifications go through `data/runtime.ts`
- ❌ Don't change the fixed dev port without agreement from the team
- ❌ Don't add non-cute component names (avoid generic names like `Button`, `Card`)

---

## Reference Documentation

- [README.md](../../README.md) – Project intro
- [OVERVIEW.md](../../OVERVIEW.md) – Feature walkthrough
- [ROADMAP.md](../../ROADMAP.md) – Future plans
- [CHANGELOG.md](../../CHANGELOG.md) – Version history

---

## Questions for Clarification

**For future agent customizations**, consider:

- Should we create file-specific instructions for `ui.tsx` and `runtime.ts` since they're critical integration points?
- Would a custom prompt for "Add a new workspace view" be helpful?
- Should we enforce prettier formatting or eslint rules via a pre-commit hook?
