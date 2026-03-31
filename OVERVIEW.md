# Overview

## Purpose

Mewl is a local process and port management app for Pink Pixel. This pass moves the project from a visual scaffold into a front-end product shell for controlling services, reviewing port bindings, and monitoring machine pressure from a single workspace.

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

Defines the main product shell, workspace views, action handlers, search/filter state, alerts tray, and process-selection workflow.

The current implementation includes:

- a collapsible left navigation rail for overview, processes, ports, monitor, and automation
- a compact action/search header with no large banner copy
- a clean dashboard made of summary cards plus short process and port preview lists
- a dedicated Processes page with expandable cards and a full inspector surface
- view-specific pages for port registry, monitor, and automation workflows
- local state transitions that simulate lifecycle actions before a real runtime bridge exists

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
- port registry bindings with exposure and conflict state
- alerts and incident feed entries
- monitor metrics
- automation rules

This file is the current contract surface for the future backend/native adapter.

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
- the sidebar can collapse to icon-only navigation for a roomier workspace
- process cards can expand in place for more detail before the full inspector is needed
- toggles mutate selected-service and automation state locally until a backend exists
- button glow behavior follows Sparklebots interaction patterns
- progress indicators and animated signal bars add motion without crowding the layout
- alert visibility uses local `useState` and conditional rendering for the top-right tray

## Current Limitations

- no native process bridge yet, so OS process control is not live
- no real port inspection or system telemetry ingestion
- no persistence for settings, filters, or automation rules
- no auth, multi-user roles, or workspace sync
- no testing suite yet
- no packaging for desktop delivery yet

## Extension Points

- replace the mock runtime file with a real adapter backed by Electron, Tauri, or a local daemon
- wire lifecycle actions to spawn, kill, restart, and inspect real processes
- add live port discovery and collision detection from the host machine
- persist workspace profiles, startup groups, and automation presets
- add charts, logs, tails, and richer process detail panes
