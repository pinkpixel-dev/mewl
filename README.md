# Mewl

Mewl is a local operations cockpit for managing running services, watched ports, quick lifecycle actions, and host pressure from one workspace.

## What It Does Today

- Search a managed local runtime made up of services, workers, tooling, and data processes
- Scan the live workspace from a compact top command strip
- Browse a cleaner live Processes page that stays focused on what is running right now, with expandable cards and a read-only inspector
- Keep long process names, descriptions, commands, and working-directory paths wrapped inside expanded Processes cards instead of spilling past the card edge
- Convert an observed live process into a reviewed managed-service draft with prefilled command, cwd, port-watch, and runtime hints before saving anything to the catalog
- Use a clearly marked observed-only kill action that terminates the current live pid without mutating the managed service list
- Use a dedicated Managed workspace to create, edit, color-code, and control user-authored service definitions
- Start, stop, and restart managed services from compact icon actions on managed cards instead of mixing control buttons into the live process list
- Collapse helper subprocess noise on the Processes page so Chromium and Electron-based apps surface as one app-level row instead of a pile of zygotes and utility workers
- Persist workspace state across refreshes, including the active view, filters, sidebar state, selected process, expanded cards, alerts, and automation toggles
- Use a cleaner overview dashboard with summary cards plus side-by-side process and port previews
- Jump from dashboard previews into dedicated Processes and Ports pages with `See all` actions
- Browse the Processes page as expandable three-column cards with the full inspector shown below
- Inspect per-process stdout and stderr tails from the live managed runtime bridge
- Load live processes, listening ports, and host telemetry through an Electron preload bridge when running in the desktop shell
- Start, stop, and restart Mewl-owned services through a config-driven Electron lifecycle bridge
- Save managed services with explicit start commands, optional stop and restart commands, working directories, notes, colors, and card icons
- Review imported legacy managed-service entries from older `mewl.services.json` shapes, see why they were normalized, and mark them as cleaned up from the Managed editor
- Update managed `autostart` and `watch ports` settings from the UI and persist them back to `mewl.services.json`
- Boot managed startup profiles and quiet-mode presets through the Electron Automation view
- Launch managed services through a hardened Electron runner with explicit env inheritance, command tokenization, PATH resolution, and reserved-port guards
- Reattach orphaned managed services that are already running on the host so lifecycle actions can reclaim and control them cleanly
- Normalize accidental helper-process promotions back to a single managed entry so repeated `Manage` clicks on child processes do not create confusing duplicates in the saved config
- Review a port registry with exposure, conflict, and watched-binding states
- Track host CPU, memory, disk, network, and GPU pressure from the sidebar and monitor view
- Recover gracefully with loading, empty, and error states while the workspace runtime hydrates
- Route runtime hydration through a provider layer that requires the Electron desktop bridge
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

- The UI now hydrates only through the live Electron desktop bridge and restores saved workspace preferences from local storage.
- Runtime loading flows through [`src/runtime/provider.ts`](/home/sizzlebop/PINKPIXEL/PROJECTS/CURRENT/mewl/src/runtime/provider.ts), which now requires the Electron host bridge instead of exposing a browser fallback.
- Lifecycle actions, automation toggles, startup profiles, and managed-service logs now round-trip through the live Electron runtime.
- Electron is the chosen host integration layer for the native bridge because it keeps the renderer, preload contract, and runtime orchestration in the same TypeScript stack.
- Managed process launching, live port discovery, and host telemetry now run through the Electron preload bridge, with the Processes page staying focused on live inspection and the Managed page owning saved service control.
- Managed-service configuration now lives in a per-user app config file instead of the repo, so packaged Electron builds can keep using the same settings location.
- Managed services are now explicit saved definitions with a start command plus optional stop and restart commands instead of inferred promotion from the Processes page.
- Legacy managed-service entries can now surface cleanup reasons in the Managed workspace so older config shapes are reviewed in-app instead of being silently rewritten with no follow-up.
- Observed processes can now seed the Managed editor through an explicit review step instead of being silently promoted straight into saved config.
- The live Processes page now exposes only two observed-process actions: create a managed draft from what Mewl can currently see, or kill the live pid without changing the managed catalog.

## Run Locally

```bash
npm install
npm run dev:desktop
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

The development Electron flow now binds Vite explicitly to `127.0.0.1:29463` so the desktop shell and dev server resolve the same loopback address. If you see Electron's insecure CSP warning in development, that warning is expected from the Vite dev server and is not the cause of a blank window.
Closing the main Mewl window in `npm run dev:desktop` now quits the Electron process instead of leaving a detached DevTools-backed session running in the background, so the paired Vite server is released cleanly too.

Run the production-style Electron shell with a fresh renderer build:

```bash
npm run desktop
```

`npm run desktop` now rebuilds the Vite renderer before launch, and the production bundle emits relative asset paths so Electron can load `dist/index.html` over `file://` without dropping to a blank window.

Managed desktop services are stored in a per-user config file:

- Linux: `~/.config/mewl/mewl.services.json`
- macOS: `~/Library/Application Support/mewl/mewl.services.json`
- Windows: `%APPDATA%\\mewl\\mewl.services.json`

The repository copy at [`mewl.services.json`](/home/sizzlebop/PINKPIXEL/PROJECTS/CURRENT/mewl/mewl.services.json) is now an empty baseline instead of a seeded fake-service list.
Mewl only performs lifecycle control for services listed in the per-user config, while other discovered host processes stay read-only on the live Processes page.
Those same managed services now drive the Managed workspace editor and Electron automation rules, so the UI edits the real desktop config instead of local-only state.
Profiles in that same file can now boot or quiet grouped services through the Automation page, and enabled startup profiles are applied when the Electron runtime hydrates.
Managed service launches are now intentionally strict: Mewl tokenizes plain command strings into executable-plus-args form, inherits only explicitly listed environment variables, and blocks starts when reserved ports are already occupied.

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

- collapsible left navigation rail for overview, processes, managed, ports, monitor, and automation
- a dedicated Managed workspace for user-authored service cards and lifecycle control
- compact operational header with search, scan, and alert tray instead of hero copy
- the shared search field now uses the Pink Pixel rose accent for its icon and focus glow
- clean overview dashboard with summary cards and short preview lists instead of oversized explainer surfaces
- dedicated Processes page with expandable cards and a full-width inspector for live process inspection
- observed-only action panels on live process cards and inspector, with explicit language around draft creation versus pid termination
- managed cards now carry their own icon-only lifecycle controls so command execution stays attached to saved service definitions
- process surfaces now label each entry as `managed` or `observed` without extra explanatory filler on observed cards
- observed process cards now prefer launchable parent app rows instead of noisy helper children, which keeps the live process list focused on the app users actually mean
- collapsed process cards now stay compact, with long command and path details moved into the expanded state
- dedicated Ports and Monitor pages for deeper operational detail
- GPU telemetry folded into the host monitor and sidebar health card, with graceful fallback when the host bridge cannot read GPU data
- a cleaner Automation page that keeps rule editing in one workspace instead of a separate scaffold-like state column
- expandable monitor-side resource cards so long process command lines stay hidden until requested
- structured process logs and session memory so the shell feels more like a real local cockpit
- a runtime source abstraction that boots only when the Electron bridge is available
- a live Electron host bridge that can scan the current user session for processes, ports, and machine pressure
- an Electron-safe production renderer build that uses relative asset paths instead of web-only absolute `/assets/...` URLs
- a tuned Ports registry layout that keeps longer `Target` bindings readable in the desktop shell
- config-driven managed services so desktop lifecycle actions only touch processes Mewl explicitly owns
- managed service settings that round-trip between the React UI and `mewl.services.json`
- startup profiles that can boot or quiet groups of Mewl-owned services through the Electron bridge
- hardened managed service execution rules so the desktop bridge only launches validated commands with controlled environments
- the current product step is the first half of the `Observed` / `Managed` split, with `Managed` now owning saved service definitions and the live Processes page staying visually lighter
- older inferred managed config entries now normalize into the explicit saved-service schema during load so the runtime can separate remembered service definitions from current host processes
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
- The current implementation is a live Electron-first desktop cockpit with persisted workspace preferences and managed local service control.
- The browser build now intentionally stops at the desktop-required state instead of presenting a fallback runtime.
- The desktop shell can now control services registered in `mewl.services.json`; arbitrary discovered host processes are intentionally read-only from the live Processes page.
- The live host scan now hides helper subprocesses such as Chromium zygotes and utility workers from the default Processes grid so one app reads like one app.
- The notifications tray is layered above the dashboard surfaces so alerts stay readable when opened from the top command bar.
- Managed services can now be authored directly in the app with command fields, notes, color accents, and icon selection, while live process cards stay focused on inspection instead of control.
- Creating from an observed process now opens the Managed editor with a prefilled draft banner so the saved definition is reviewed before it becomes part of Mewl's catalog.
- Killing an observed process is now a dedicated live-runtime action that targets only the current pid and keeps managed lifecycle semantics separate.
