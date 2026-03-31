# Mewl

Mewl is a local operations cockpit for managing running services, watched ports, quick lifecycle actions, and host pressure from one workspace.

## What It Does Today

- Search a managed local runtime made up of services, workers, tooling, and data processes
- Start, stop, restart, and scan the selected service from a compact top command strip
- Persist workspace state across refreshes, including the active view, filters, sidebar state, selected process, expanded cards, alerts, and automation toggles
- Use a cleaner overview dashboard with summary cards plus side-by-side process and port previews
- Jump from dashboard previews into dedicated Processes and Ports pages with `See all` actions
- Browse the Processes page as expandable three-column cards with the full inspector shown below
- Inspect per-process stdout and stderr tails from the mock runtime contract
- Load live processes, listening ports, and host telemetry through an Electron preload bridge when running in the desktop shell
- Start, stop, and restart Mewl-owned services through a config-driven Electron lifecycle bridge
- Update managed `autostart` and `watch ports` settings from the UI and persist them back to `mewl.services.json`
- Review a port registry with exposure, conflict, and watched-binding states
- Track host CPU, memory, disk, and network pressure from the sidebar and monitor view
- Recover gracefully with loading, empty, and error states while the workspace runtime hydrates
- Route runtime hydration through a provider layer that can fall back to mock data or swap to a native host bridge
- Collapse the sidebar when you want more room for the main workspace
- Use a dedicated Vite dev port at `29463` instead of the default `5173`

## Stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- lucide-react

## Current Reality

This is the first real product pass, not the final native implementation yet.

- The UI now hydrates from a mock front-end runtime model in [`src/data/runtime.ts`](/home/sizzlebop/PINKPIXEL/PROJECTS/CURRENT/mewl/src/data/runtime.ts) and restores saved workspace state from local storage.
- Runtime loading now flows through [`src/runtime/provider.ts`](/home/sizzlebop/PINKPIXEL/PROJECTS/CURRENT/mewl/src/runtime/provider.ts), which keeps the current mock contract in place while preparing for a native host bridge.
- Lifecycle actions update the mock process model, alerts feed, and structured log tails, so the cockpit behaves more like a real app even before a native bridge exists.
- Electron is the chosen host integration layer for the native bridge because it keeps the renderer, preload contract, and runtime orchestration in the same TypeScript stack.
- Real OS process launching, killing, port discovery, and machine telemetry still need to be implemented behind the Electron preload bridge.

## Run Locally

```bash
npm install
npm run dev
```

The dev server now runs on:

```text
http://127.0.0.1:29463
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run the Electron desktop shell against the live host bridge:

```bash
npm run dev:desktop
```

Managed desktop services are defined in [`mewl.services.json`](/home/sizzlebop/PINKPIXEL/PROJECTS/CURRENT/mewl/mewl.services.json). Mewl only performs lifecycle control for services listed there, while other discovered host processes stay read-only.
Those same managed services now drive the inspector toggles and Electron automation rules, so the UI edits the real desktop config instead of local-only state.

## Project Structure

```text
.
|-- public/
|   |-- favicon.png
|   `-- icon.png
|-- src/
|   |-- components/
|   |   `-- ui.tsx
|   |-- data/
|   |   `-- runtime.ts
|   |-- runtime/
|   |   |-- index.ts
|   |   `-- provider.ts
|   |-- App.tsx
|   |-- main.tsx
|   |-- styles.css
|   `-- vite-env.d.ts
|-- electron/
|   |-- main.cjs
|   |-- preload.cjs
|   `-- runtime.cjs
|-- mewl.services.json
|-- CHANGELOG.md
|-- LICENSE
|-- OVERVIEW.md
|-- ROADMAP.md
|-- README.md
|-- index.html
|-- package.json
|-- tsconfig.json
`-- vite.config.ts
```

## Design Direction

The current product direction is intentionally utility-first rather than dashboard wallpaper:

- collapsible left navigation rail for overview, processes, ports, monitor, and automation
- compact operational header with lifecycle actions, search, and alert tray instead of hero copy
- clean overview dashboard with summary cards and short preview lists instead of oversized explainer surfaces
- dedicated Processes page with expandable cards and a full-width inspector
- dedicated Ports and Monitor pages for deeper operational detail
- structured process logs and session memory so the shell feels more like a real local cockpit
- a runtime source abstraction that keeps the mock snapshot and a future Electron bridge behind the same UI-facing contract
- a live Electron host bridge that can scan the current user session for processes, ports, and machine pressure
- config-driven managed services so desktop lifecycle actions only touch processes Mewl explicitly owns
- managed service settings that round-trip between the React UI and `mewl.services.json`
- Pink Pixel branding applied without turning the app into a generic purple SaaS grid

## Brand

- Name: Pink Pixel
- Website: https://pinkpixel.dev
- GitHub: https://github.com/pinkpixel-dev
- Email: admin@pinkpixel.dev
- Support: support@pinkpixel.dev
- Discord: @sizzlebopz

## Notes

- `mockup.png` remains the visual reference image in the repository.
- `public/icon.png` is used by the app shell and browser tab.
- The current implementation is a polished local-ops foundation with mock runtime data, persisted workspace state, and no native system bridge yet.
- Electron is now the documented native-host target, but the repo still ships as a web build until the preload and main-process bridge lands.
- The desktop shell now has a first live Electron bridge for runtime hydration, but lifecycle control is still being wired one step at a time.
- The desktop shell can now control services registered in `mewl.services.json`; arbitrary discovered host processes are intentionally read-only.
- The remaining browser-side mock path is temporary; the long-term goal is a fully live desktop runtime with no mock fallback.
- The notifications tray is layered above the dashboard surfaces so alerts stay readable when opened from the top command bar.
