# Mewl

<p align="center">
	<img src="logo.png" alt="Mewl logo" width="300" height="300" />
</p>


Mewl is a local operations dashboard for managing running services, watched ports, quick lifecycle actions, and host pressure from one workspace.

## What It Does Today

- Search a managed local runtime made up of services, workers, tooling, and data processes
- Scan the live workspace from a compact top command strip
- Browse a cleaner live Processes page that stays focused on what is running right now, with expandable cards and a read-only inspector
- Keep long process names, descriptions, commands, and working-directory paths wrapped inside expanded Processes cards instead of spilling past the card edge
- Convert an observed live process into a reviewed managed-service draft with prefilled command and runtime hints before saving anything to the catalog
- Use a clearly marked observed-only kill action that terminates the current live pid without mutating the managed service list
- Use a dedicated Managed workspace to browse a two-column grid of service cards, then open a focused modal to create, edit, color-code, and control user-authored service definitions
- Toggle `autostart` and `watch ports` directly on each managed service card instead of leaving those controls on a separate automation page
- Start, stop, and restart managed services from compact icon actions on managed cards instead of mixing control buttons into the live process list
- Collapse helper subprocess noise on the Processes page so Chromium and Electron-based apps surface as one app-level row instead of a pile of zygotes and utility workers
- Persist workspace state across refreshes, including the active view, filters, sidebar state, selected process, expanded cards, alerts, and managed-service toggle state
- Use a cleaner overview dashboard with summary cards plus side-by-side process and port previews
- Jump from dashboard previews into dedicated Processes and Ports pages with `See all` actions
- Browse the Processes page as expandable three-column cards with the full inspector shown below
- Inspect per-process stdout and stderr tails from the live managed runtime bridge
- Load live processes, listening ports, and host telemetry through an Electron preload bridge when running in the desktop shell
- Start, stop, and restart Mewl-owned services through a config-driven Electron lifecycle bridge
- Save managed services with explicit start commands, optional stop and restart commands, working directories, notes, colors, and card icons
- Author managed services in explicit `command`, `script`, or `docker` modes so the editor can label each flow honestly instead of treating every launch as the same generic command
- Launch direct script paths like `./scripts/dev.sh` or `./workers/boot.py` through the Electron bridge without having to wrap them in shell glue first
- Let Docker-managed services use Docker-specific start, stop, and restart flows, with a derived stop command for common Compose and named-container launches when no explicit stop flow is saved
- Review imported legacy managed-service entries from older `mewl.services.json` shapes, see why they were normalized, and mark them as cleaned up from the Managed modal editor
- Choose per-service restart policies with retry limits so Mewl can recover managed services after unhealthy exits
- Update managed `autostart` and `watch ports` settings from the UI and persist them back to `mewl.services.json`
- Inspect a persisted automation history stream for starts, stops, profile runs, retries, and failures
- Filter the alerts tray by severity, service, and time window when you need to narrow the current incident feed
- Catch richer runtime issues including crash loops, reserved ports claimed by the wrong process, and unhealthy managed-service CPU or memory spikes
- Read rolling trend visuals for CPU, memory, disk, network, and GPU from the Monitor page instead of only seeing single-snapshot pressure bars
- Use a cleaner Monitor composition with a full-width trend canvas, a wider snapshot lane, a two-by-two noisy-services grid, and an in-grid runtime waveform tile instead of one tall stacked monitor column
- Launch managed services through a hardened Electron runner with explicit env inheritance, command tokenization, PATH resolution, and reserved-port guards
- Reattach orphaned managed services that are already running on the host so lifecycle actions can reclaim and control them cleanly
- Normalize accidental helper-process promotions back to a single managed entry so repeated `Manage` clicks on child processes do not create confusing duplicates in the saved config
- Generate Linux packaging icons directly from `public/icon.png` and build AppImage, `.deb`, and `.rpm` artifacts from one Electron packaging flow
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
- Electron Builder

## Current Reality

This is the first real product pass, not the final native implementation yet.

- The UI now hydrates only through the live Electron desktop bridge and restores saved workspace preferences from local storage.
- Runtime loading flows through [`src/runtime/provider.ts`](/home/sizzlebop/PINKPIXEL/PROJECTS/CURRENT/mewl/src/runtime/provider.ts), which now requires the Electron host bridge instead of exposing a browser fallback.
- Lifecycle actions, automation toggles, startup profiles, and managed-service logs now round-trip through the live Electron runtime.
- Electron is the chosen host integration layer for the native bridge because it keeps the renderer, preload contract, and runtime orchestration in the same TypeScript stack.
- Managed process launching, live port discovery, and host telemetry now run through the Electron preload bridge, with the Processes page staying focused on live inspection and the Managed page owning saved service control.
- Managed-service configuration now lives in a per-user app config file instead of the repo, so packaged Electron builds can keep using the same settings location.
- Managed services are now explicit saved definitions with a start command plus optional stop and restart commands instead of inferred promotion from the Processes page.
- Managed services now also carry an explicit mode (`command`, `script`, or `docker`) so the editor, saved schema, and runtime stop behavior can match the kind of launch the user actually intends.
- Legacy managed-service entries can now surface cleanup reasons in the Managed workspace so older config shapes are reviewed in-app instead of being silently rewritten with no follow-up.
- Managed services can now opt into restart policies (`manual`, `on-failure`, or `always`) with bounded retry limits for the current desktop session.
- Direct script-path launches now resolve through interpreter-aware runtime handling for common script types such as `.sh`, `.bash`, `.zsh`, `.py`, `.js`, `.cjs`, and `.mjs`.
- Docker-managed services now expose Docker-first command labels in the editor, and common `docker compose up ...` or named `docker run ...` starts can derive a matching stop flow when the service definition leaves stop blank.
- Observed processes can now seed the Managed editor through an explicit review step instead of being silently promoted straight into saved config.
- The live Processes page now exposes only two observed-process actions: create a managed draft from what Mewl can currently see, or kill the live pid without changing the managed catalog.
- The alerts tray is now filterable and uses richer runtime metadata so it can point to a specific service, time window, and alert category instead of staying as a flat feed.
- The Monitor page now keeps a rolling in-memory sample buffer through the Electron bridge and quietly refreshes it in the renderer so trend charts feel live instead of decorative.
- The Monitor page now uses horizontal bands instead of a tall left-heavy split, and the Runtime Pulse waveform now fills the open Trend Canvas slot instead of moving into the sidebar.
- The Managed page now keeps the workspace focused on a two-column service grid, with create and edit actions opening a modal instead of pinning a full editor column on the screen.
- The old standalone Automation page has been folded away, and the service-level `autostart` and `watch ports` settings now live directly on the managed cards.
- Managed card toggle help now lives in hover text instead of taking up persistent space inside each card.
- Linux desktop packaging is now wired through `electron-builder`, with generated icon assets and package commands for AppImage, `.deb`, and `.rpm`.
- A manual GitHub Actions workflow now exists for Linux package builds and artifact upload, while Windows packaging remains intentionally out of scope until the runtime bridge itself becomes cross-platform.

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

Build Linux desktop packages:

```bash
npm run package:linux
```

That packaging flow regenerates icons from [`public/icon.png`](/home/sizzlebop/PINKPIXEL/PROJECTS/CURRENT/mewl/public/icon.png), rebuilds the renderer, and emits AppImage, `.deb`, and `.rpm` artifacts into `release/`.

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
|-- .github/
|   `-- workflows/
|       `-- linux-packages.yml
|-- build/
|   `-- icons/
|       |-- icon.ico
|       |-- icon.png
|       `-- png/
|-- public/
|   |-- favicon.png
|   `-- icon.png
|-- scripts/
|   `-- generate-icons.mjs
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

- collapsible left navigation rail for overview, processes, managed, ports, and monitor
- a dedicated Managed workspace for user-authored service cards and lifecycle control, with editing moved into a modal window instead of a persistent side panel
- a Managed editor that now understands `command`, `script`, and `docker` service modes instead of flattening every launch definition into one generic command form
- compact operational header with search, scan, and alert tray instead of hero copy
- the shared search field now uses the Pink Pixel rose accent for its icon and focus glow
- clean overview dashboard with summary cards and short preview lists instead of oversized explainer surfaces
- dedicated Processes page with expandable cards and a full-width inspector for live process inspection
- observed-only action panels on live process cards and inspector, with explicit language around draft creation versus pid termination
- managed cards now carry their own icon-only lifecycle controls so command execution stays attached to saved service definitions
- process surfaces now label each entry as `managed` or `observed` without extra explanatory filler on observed cards
- the Managed page no longer repeats a `managed` ownership pill on every saved service card, keeping those cards focused on status plus service mode
- observed process cards now prefer launchable parent app rows instead of noisy helper children, which keeps the live process list focused on the app users actually mean
- collapsed process cards now stay compact, with long command and path details moved into the expanded state
- dedicated Ports and Monitor pages for deeper operational detail
- a rebalanced Monitor page layout that spreads trend charts across the workspace, including a sixth Runtime Pulse tile before dropping into snapshot and noisy-service bands
- GPU telemetry folded into the host monitor and sidebar health card, with graceful fallback when the host bridge cannot read GPU data
- service-level automation controls kept on the managed cards instead of a separate mostly-empty automation workspace
- expandable monitor-side resource cards so long process command lines stay hidden until requested
- a lean managed-service editor that focuses on name, description, start/stop/restart commands, color, and icon selection while deeper runtime fields stay out of the default UI
- a managed-service editor that again exposes working directory and restart-policy controls alongside mode-specific command labels and examples
- structured process logs and session memory so the shell feels more like a real local dashboard
- a runtime source abstraction that boots only when the Electron bridge is available
- a live Electron host bridge that can scan the current user session for processes, ports, and machine pressure
- an Electron-safe production renderer build that uses relative asset paths instead of web-only absolute `/assets/...` URLs
- a tuned Ports registry layout that keeps longer `Target` bindings readable in the desktop shell
- config-driven managed services so desktop lifecycle actions only touch processes Mewl explicitly owns
- managed service settings that round-trip between the React UI and `mewl.services.json`
- managed restart-policy settings that let the Electron bridge retry services after exits without guessing indefinitely
- interpreter-aware script launches so direct wrapper files can be saved as first-class managed definitions without shell operators
- Docker-aware stop derivation for common Compose and named-container flows when a saved Docker service omits its explicit teardown command
- startup profiles that can boot or quiet groups of Mewl-owned services through the Electron bridge
- a persisted automation history feed that explains what started, stopped, retried, failed, or was toggled and why
- hardened managed service execution rules so the desktop bridge only launches validated commands with controlled environments
- a Linux packaging pipeline driven by `electron-builder`, with package metadata, generated icons, and a manual GitHub workflow for artifact builds
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
- The current implementation is a live Electron-first desktop dashboard with persisted workspace preferences and managed local service control.
- The browser build now intentionally stops at the desktop-required state instead of presenting a fallback runtime.
- The desktop shell can now control services registered in `mewl.services.json`; arbitrary discovered host processes are intentionally read-only from the live Processes page.
- The live host scan now hides helper subprocesses such as Chromium zygotes and utility workers from the default Processes grid so one app reads like one app.
- The notifications tray is layered above the dashboard surfaces so alerts stay readable when opened from the top command bar.
- Managed services can now be authored directly in the app with command fields, notes, color accents, and icon selection, while live process cards stay focused on inspection instead of control.
- Creating from an observed process now opens the Managed editor with a prefilled draft banner so the saved definition is reviewed before it becomes part of Mewl's catalog.
- Killing an observed process is now a dedicated live-runtime action that targets only the current pid and keeps managed lifecycle semantics separate.
- The current packaging work is Linux-first because the runtime bridge still relies on Linux host-inspection paths and commands for process, port, disk, network, and GPU data.
