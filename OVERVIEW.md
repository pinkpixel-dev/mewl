# Overview

## Purpose

Mewl is a local process and port management app for Pink Pixel. This pass pushes the project from a visual scaffold into a more functional product shell by restoring workspace state, surfacing structured process logs, and handling runtime loading and failure states more deliberately.

The latest iteration chooses Electron as the native host direction, introduces a runtime-provider seam, requires the live Electron bridge for boot, wires real lifecycle control for Mewl-owned services, and now extends the Managed workspace with an in-app cleanup flow for legacy `mewl.services.json` entries alongside the observed-to-managed review path and observed-only kill action.

## Technical Summary

- Framework: React 19
- Language: TypeScript
- Bundler: Vite 8
- Styling: Tailwind CSS 4 plus custom CSS tokens and effects
- Icons: lucide-react
- Asset strategy: static assets served from `public/`
- Production desktop renderer: built with relative asset paths so Electron can load the bundle from `dist/index.html`
- Dev server address: `127.0.0.1:29463`

## Application Structure

### `src/App.tsx`

Defines the main product shell, workspace views, action handlers, search/filter state, alerts tray, process-selection workflow, runtime hydration flow, and local session persistence.

The current implementation includes:

- a collapsible left navigation rail for overview, processes, managed, ports, monitor, and automation
- a compact action/search header with no large banner copy
- a rose-accented shared search field that matches the Pink Pixel brand color
- a clean dashboard made of summary cards plus short process and port preview lists
- a dedicated Processes page with expandable cards and a full inspector surface for live process inspection
- improved wrapping rules on expanded process cards so long commands and filesystem paths stay contained within the card layout
- explicit observed-runtime action panels that can prefill a managed draft or terminate only the current observed pid
- a dedicated Managed page for explicit service definitions, lifecycle controls, and visual metadata
- a managed cleanup banner, review badges, and editor actions for imported legacy service definitions that still need confirmation
- a prefilled managed-draft review state that carries observed command and cwd context into the editor before anything is saved
- explicit `managed` and `observed` ownership tags on process surfaces without extra warning copy cluttering the cards
- a collapsed process-card layout that keeps the grid tidy by moving long command text into the expanded panel
- the first shipped split between lighter live-process inspection and a dedicated `Managed` service editor for user-authored launch definitions
- view-specific pages for port registry, monitor, and automation workflows
- a cleaner Automation page that surfaces latest activity and runtime source inline instead of keeping a bulky secondary state column
- a ports registry table with a wider target column and wrapping behavior for longer bind addresses
- a monitor view that now includes GPU telemetry when available and suppresses noisy process command text behind expandable detail panels
- local state transitions that coordinate with the live Electron runtime bridge
- workspace persistence for the active view, filters, expanded cards, selected process, alerts, and automation state
- loading, empty, and error states for runtime hydration and filtered views

### `src/components/ui.tsx`

Contains reusable presentation components used throughout the app:

- `StatusPill`
- `ShinyButton`
- `SugarCard`
- `CandyInput`
- `SweetToggle`
- `HologramProgress`
- `SignalBars`

The shared UI layer also now supports:

- a `starting` status tone for booting services
- interactive action buttons with `onClick` and disabled states
- neutral glass surfaces, accent glows, and compact operational density

### `src/data/runtime.ts`

Holds the shared TypeScript runtime contract used by both the renderer and the Electron bridge:

- managed processes with command, cwd, PID, ports, and resource usage
- structured stdout and stderr tails for each managed process
- port registry bindings with exposure and conflict state
- alerts and incident feed entries
- monitor metrics
- optional GPU telemetry metadata, including availability and display labels for hosts without readable GPU counters
- automation rules
  This file is the current contract surface for the live Electron adapter.

### `src/runtime/provider.ts`

Defines the runtime source boundary that the renderer now uses for hydration and reset flows.

The provider currently:

- requires `window.mewlHost` when Mewl is hosted inside Electron
- documents Electron as the chosen host layer for process control, port discovery, host metrics, and secure command execution
- keeps the UI-facing `RuntimeSnapshot` contract stable while the Electron bridge evolves

### `electron/runtime.cjs`

Provides the first live native runtime collector for the Electron host shell.

The current implementation:

- scans the current user's processes with `ps`
- scans bound TCP and UDP ports with `lsof`, with `ss` as a host-command fallback
- samples CPU, memory, disk, and network pressure from the local machine
- samples GPU pressure when the host exposes it through `nvidia-smi` or DRM sysfs counters, and falls back to an unavailable state when it does not
- maps the live host snapshot into the existing renderer-facing `RuntimeSnapshot` shape
- loads `mewl.services.json` and manages only the services explicitly registered there
- stores the managed-service config in a per-user app-data location (`~/.config/mewl/mewl.services.json` on Linux) so packaged builds do not depend on the repo checkout
- starts, stops, and restarts managed services through child-process ownership in the Electron main process
- reattaches matching managed services that are already running on the host so stop and restart still work after Mewl reconnects
- now treats managed services as explicit saved definitions with a start command plus optional stop and restart commands
- now filters helper subprocesses such as Chromium and Electron `--type=...` workers out of the discovered-process grid so the renderer shows app-level rows instead of every child process
- now stores optional managed-service title colors and icon choices alongside command metadata
- persists managed `autoStart` and `watchPorts` changes back into `mewl.services.json` through the preload bridge
- applies enabled startup profiles on Electron boot and lets the Automation view trigger grouped start/stop presets
- validates managed commands before spawn by tokenizing plain command strings, requiring a real executable token, and checking available reserved ports
- still normalizes older config records on load so earlier command-and-args entries migrate into the newer explicit command schema before the runtime snapshot is built
- now persists review metadata for legacy-managed entries so the renderer can explain what was normalized and let users mark the cleanup as complete
- keeps discovered host processes read-only so Mewl does not send lifecycle signals to processes it does not own
- now exposes a separate observed kill path that can terminate a live pid only when it is not already claimed by a managed service

### `electron/main.cjs`

Owns the Electron window boot flow for both development and production:

- loads the Vite dev server when `MEWL_RENDERER_URL` is present
- loads `dist/index.html` in production mode
- now logs `did-fail-load` and renderer-crash events so blank-window failures are easier to diagnose
- quits the app when the main window closes so the desktop dev shell does not leave the paired Vite server stranded in the background

### `vite.config.ts`

Defines the renderer build and development server behavior:

- uses a relative `base` so production assets load correctly from Electron's `file://` path
- binds both dev and preview to `127.0.0.1:29463` so Electron and Vite agree on the same loopback address during desktop development

### `src/styles.css`

Holds the visual system outside component logic:

- Google font imports
- Tailwind import
- dark ambient background gradients
- dotted pattern overlay
- SVG noise overlay
- frosted glass panel styling
- animation keyframes

## Layout Model

The current app is organized into six major workspace zones:

1. Left navigation rail
2. Sidebar host health plus compact machine snapshot
3. Workspace header with search, scan, and alert tray
4. Overview summary cards
5. Dashboard preview panels for processes and port bindings
6. Dedicated full pages for processes, managed services, ports, monitoring, and automation

This structure keeps the app close to the original mockup mood while making the main surface useful for real local-ops workflows.

## Interaction Model

- search input uses `useDeferredValue` to keep filtering responsive
- workspace changes use `startTransition` to keep view switching lightweight
- lifecycle actions use `useTransition` to coordinate non-blocking start, stop, restart, save, remove, and scan operations with the Electron bridge
- the workspace hydrates from the runtime contract and restores saved session state from local storage on boot
- the sidebar can collapse to icon-only navigation for a roomier workspace
- process cards can expand in place for more detail before the full inspector is needed
- managed-service editor changes and automation toggles round-trip through the Electron bridge
- managed lifecycle actions and explicit command hooks append to stdout/stderr log tails from the live runtime
- observed-process draft creation jumps directly into the Managed workspace with a review banner and prefilled launch details
- observed-process termination is framed as a live pid action rather than a managed-service edit
- button glow behavior follows Sparklebots interaction patterns
- progress indicators and animated signal bars add motion without crowding the layout
- the monitor page now keeps noisy service command details collapsed until explicitly expanded
- alert visibility uses local `useState` and conditional rendering for the top-right tray
- the top command bar now owns a higher stacking layer so the alerts tray stays above the dashboard cards

## Current Limitations

- Electron is the required runtime host, and lifecycle plus managed settings currently cover only services and startup profiles registered in `mewl.services.json`
- config persistence now assumes a per-user desktop install path rather than a repo-local JSON file
- shell operators such as pipes, redirects, and compound command chains are still intentionally unsupported in the managed command parser
- Docker-style helper commands can now be saved explicitly, but richer container-aware state and port introspection still need a future pass
- richer bulk-import tooling is still pending, but legacy `mewl.services.json` entries can now be reviewed and cleared from the Managed editor
- no auth, multi-user roles, or workspace sync
- no testing suite yet
- no packaging for desktop delivery yet
- the local terminal environment used for automated verification still reports an Electron bootstrap issue before the app process fully initializes, so the fix here was validated by build output and runtime-path inspection rather than a successful interactive Electron launch in-tool

## Extension Points

- keep expanding the Electron-backed adapter exposed through the runtime provider
- expand lifecycle control beyond the starter managed-service config and add richer service definitions, environment handling, and exit diagnostics
- continue splitting observed runtime inspection from managed-service authoring, including import cleanup for older inferred configs and richer review ergonomics for prefilled drafts
- keep evolving the managed editor with richer validation, script/Docker ergonomics, and more complete runtime reconciliation
- add live port discovery and collision detection from the host machine
- persist workspace profiles, startup groups, and automation presets beyond the single local session model
- add richer charts, searchable logs, streaming tails, and deeper process detail panes
