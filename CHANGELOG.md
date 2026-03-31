# Changelog

All notable changes to this project will be documented in this file.

[Unreleased]

## 2026-03-31 06:54 EDT

- chose Electron as Mewl's native host integration layer and documented the decision across the roadmap and technical docs
- added `src/runtime/provider.ts` so the renderer now hydrates through a runtime-source boundary instead of calling the mock boot helpers directly
- typed a future `window.mewlHost` preload bridge in `src/vite-env.d.ts` so the app can adopt an Electron preload API without reshaping the UI contract
- updated `index.html` metadata to describe Mewl as a local ops cockpit instead of the older server-manager scaffold wording
- revalidated the application with a successful `npm run build`

## 2026-03-31 06:33 EDT

- hydrated the workspace from the runtime contract on boot and persisted local session state for views, filters, selected process, expanded cards, alerts, and automation changes
- added structured per-process stdout and stderr panes in the inspector and appended lifecycle and settings changes into the mock log history
- introduced runtime loading, empty, and error states plus a local session reset path so the shell behaves cleanly when no filtered data matches or saved state fails to load
- revalidated the application with a successful `npm run build`

## 2026-03-31 06:05 EDT

- raised the top command bar and alerts tray stacking order so the notifications popover stays readable above the dashboard cards

## 2026-03-31 05:58 EDT

- removed the large dashboard banner copy and extra sidebar subtitle to keep the shell cleaner and more utility-focused
- replaced the overview workspace cards with a tighter three-card summary row plus matching side-by-side process and port preview panels
- moved the full inspector off the dashboard and onto the Processes page
- rebuilt the Processes page around expandable three-column service cards with the inspector shown below the grid
- added a collapsible sidebar and moved the host snapshot into the rail below host health
- kept the Ports and Monitor views as dedicated pages while leaving only the basics on the overview dashboard

## 2026-03-31 05:31 EDT

- turned the original server-themed scaffold into a local process-management workspace for services, ports, automation, and host monitoring
- added a real front-end runtime model in `src/data/runtime.ts` to drive processes, port bindings, alerts, monitor metrics, and automation rules
- replaced the placeholder fleet table and cards with a searchable managed-runtime table, selected-service inspector, port registry, and monitor-focused secondary views
- wired interactive quick actions for start, stop, restart, and port scanning using React deferred and transition-friendly state patterns
- extended the shared UI primitives to support button click handlers, disabled states, and a dedicated `starting` status tone
- moved the Vite dev and preview server to a fixed dedicated port at `29463`
- refreshed the project documentation and roadmap around the real app goal: local process orchestration with a future native runtime bridge

## 2026-03-31 05:02 EDT

- replaced the pink-purple page backdrop with a dark slate background, dotted texture, and neutral glass surfaces
- converted colored cards to gray cards with accent glows so color now lives in controls, icons, charts, and progress
- redistributed accent usage across rose, purple, cyan, green, and amber Sparklebots components
- removed scaffold-style explanatory copy from the main dashboard cards, metrics, and activity surfaces
- replaced the old bottom activity thread card with a top-right bell button that opens a compact notifications tray
- removed leftover footer scaffolding and simplified the fleet table and guardrails panel for a cleaner production-style UI
- revalidated the refresh with a successful production build and headless browser screenshots of the closed and open alerts states

## 2026-03-31 04:50 EDT

- tightened the main dashboard spacing so the workspace controls sit directly under `Active Workspace`
- moved the action buttons to the left of the search field for a cleaner desktop command strip
- rebalanced the top summary grid and lower workspace columns to keep cards aligned with less dead space
- fixed the sidebar Flow Health card by making its signal bars scale to the available rail width
- extended the shared `ShinyButton` and `SignalBars` components to support more flexible layout composition
- revalidated the UI with a successful production build and a headless browser screenshot pass

## 2026-03-31 04:20 EDT

- scaffolded Mewl as a React + TypeScript + Vite application
- added Tailwind CSS 4 through the official Vite plugin
- created a server manager dashboard layout inspired by `mockup.png`
- integrated the provided icon asset into the app shell and favicon
- implemented frosted glass surfaces, dotted texture, ambient glows, and Pink Pixel color direction
- added Sparklebots-inspired reusable UI components for buttons, cards, toggles, progress bars, status pills, and signal bars
- verified the UI with a successful production build and desktop/mobile browser smoke checks
- created baseline project documentation and an Apache 2.0 license
