# Overview

## Purpose

Mewl is a local process and port management app for Pink Pixel. This pass pushes the project from a visual scaffold into a more functional product shell by restoring workspace state, surfacing structured process logs, and handling runtime loading and failure states more deliberately.

The latest iteration chooses Electron as the native host direction, introduces a runtime-provider seam so the renderer no longer depends directly on the mock boot helpers, adds a live host snapshot path through Electron preload IPC, and wires real lifecycle control for Mewl-owned services.

## Technical Summary

- Framework: React 19
- Language: TypeScript
- Bundler: Vite 8
- Styling: Tailwind CSS 4 plus custom CSS tokens and effects
- Icons: lucide-react
- Asset strategy: static assets served from `public/`
- Dev server port: `29463`

## Application Structure

### `src/App.tsx`

Defines the main product shell, workspace views, action handlers, search/filter state, alerts tray, process-selection workflow, runtime hydration flow, and local session persistence.

The current implementation includes:

- a collapsible left navigation rail for overview, processes, ports, monitor, and automation
- a compact action/search header with no large banner copy
- a clean dashboard made of summary cards plus short process and port preview lists
- a dedicated Processes page with expandable cards and a full inspector surface
- view-specific pages for port registry, monitor, and automation workflows
- local state transitions that simulate lifecycle actions before a real runtime bridge exists
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

Holds the mock runtime model that currently powers the interface:

- managed processes with command, cwd, PID, ports, and resource usage
- structured stdout and stderr tails for each managed process
- port registry bindings with exposure and conflict state
- alerts and incident feed entries
- monitor metrics
- automation rules
- helper functions for cloning and hydrating the runtime snapshot

This file is the current contract surface for the future backend/native adapter.

### `src/runtime/provider.ts`

Defines the runtime source boundary that the renderer now uses for hydration and reset flows.

The provider currently:

- falls back to the mock runtime contract in the browser build
- detects `window.mewlHost` when Mewl is hosted inside Electron
- documents Electron as the chosen host layer for process control, port discovery, host metrics, and secure command execution
- keeps the UI-facing `RuntimeSnapshot` contract stable while the native bridge is implemented

### `electron/runtime.cjs`

Provides the first live native runtime collector for the Electron host shell.

The current implementation:

- scans the current user's processes with `ps`
- scans bound TCP and UDP ports with `lsof`, with `ss` as a host-command fallback
- samples CPU, memory, disk, and network pressure from the local machine
- maps the live host snapshot into the existing renderer-facing `RuntimeSnapshot` shape
- loads `mewl.services.json` and manages only the services explicitly registered there
- starts, stops, and restarts managed services through child-process ownership in the Electron main process
- persists managed `autoStart` and `watchPorts` changes back into `mewl.services.json` through the preload bridge
- applies enabled startup profiles on Electron boot and lets the Automation view trigger grouped start/stop presets
- validates managed commands before spawn by requiring a single executable token, a workspace-safe cwd, an explicit inherited environment, and available reserved ports
- keeps discovered host processes read-only so Mewl does not send lifecycle signals to processes it does not own

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
3. Workspace header with alert tray and lifecycle actions
4. Overview summary cards
5. Dashboard preview panels for processes and port bindings
6. Dedicated full pages for processes, ports, monitoring, and automation

This structure keeps the app close to the original mockup mood while making the main surface useful for real local-ops workflows.

## Interaction Model

- search input uses `useDeferredValue` to keep filtering responsive
- workspace changes use `startTransition` to keep view switching lightweight
- lifecycle actions use `useTransition` to simulate non-blocking start, stop, restart, and scan operations
- the workspace hydrates from the runtime contract and restores saved session state from local storage on boot
- the sidebar can collapse to icon-only navigation for a roomier workspace
- process cards can expand in place for more detail before the full inspector is needed
- toggles mutate selected-service and automation state locally until a backend exists
- inspector toggles and lifecycle actions append to stdout/stderr log tails so the mock runtime leaves useful history behind
- button glow behavior follows Sparklebots interaction patterns
- progress indicators and animated signal bars add motion without crowding the layout
- alert visibility uses local `useState` and conditional rendering for the top-right tray
- the top command bar now owns a higher stacking layer so the alerts tray stays above the dashboard cards

## Current Limitations

- no native process bridge yet, so OS process control is not live
- Electron is chosen as the host layer, and lifecycle plus managed settings now cover services and startup profiles registered in `mewl.services.json`
- no auth, multi-user roles, or workspace sync
- no testing suite yet
- no packaging for desktop delivery yet

## Extension Points

- replace the browser fallback path with the real Electron-backed adapter exposed through the runtime provider
- replace the remaining temporary browser mock fallback once the desktop bridge owns the full product path
- implement the Electron preload and main-process bridge behind the runtime provider
- expand lifecycle control beyond the starter managed-service config and add richer service definitions, environment handling, and exit diagnostics
- add live port discovery and collision detection from the host machine
- persist workspace profiles, startup groups, and automation presets beyond the single local session model
- add richer charts, searchable logs, streaming tails, and deeper process detail panes
