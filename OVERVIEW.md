# Overview

## Purpose

Mewl is a server manager interface scaffold designed for Pink Pixel. The goal of this first pass is to establish a strong visual and architectural base that matches the provided mockup mood while keeping the implementation lightweight and easy to extend.

## Technical Summary

- Framework: React 19
- Language: TypeScript
- Bundler: Vite 8
- Styling: Tailwind CSS 4 plus custom CSS tokens and effects
- Icons: lucide-react
- Asset strategy: static assets served from `public/`

## Application Structure

### `src/App.tsx`

Defines the dashboard layout, page sections, sample server data, notification tray, and interactive state. The current composition keeps the command strip directly under the workspace label, places alerts behind a top-right bell trigger, and removes longer scaffold copy from the main surfaces.

### `src/components/ui.tsx`

Contains reusable presentation components used throughout the app:

- `StatusPill`
- `ShinyButton`
- `SugarCard`
- `CandyInput`
- `SweetToggle`
- `HologramProgress`
- `SignalBars`

The shared UI layer now also supports width-aware button and signal-bar composition, neutral slate surfaces, and optional minimal card copy so tighter regions such as the sidebar can reuse the same components without overflow or filler text.

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

The current scaffold is organized into five major workspace zones:

1. Left navigation rail
2. Active workspace header with alert trigger
3. Command strip and search row
4. Metrics overview row
5. Fleet management plus automation controls
6. Inline notification tray anchored to the top-right bell

This structure was chosen to stay close to the composition of `mockup.png`, which reads more like an operational control surface than a marketing page.

The latest layout pass focused on three things:

- replacing the colorful page backdrop with a near-black slate canvas and dotted texture
- keeping cards gray while moving color into glows, icons, charts, toggles, and progress
- removing descriptive scaffold copy so the interface reads as labels, values, and actions

## Interaction Model

- search input uses `useDeferredValue` to keep filtering responsive
- toggles allow the scaffold to demonstrate state changes without backend wiring
- button glow behavior follows Sparklebots interaction patterns
- progress indicators and animated signal bars add motion without crowding the layout
- the signal bar helper can now expand to fill its container instead of depending on fixed bar widths
- alert visibility uses local `useState` and conditional rendering for the top-right tray

## Current Limitations

- no backend or live server management API
- no persistence for settings or filters
- no auth, routing, or role management
- no testing suite yet
- no data visualization beyond lightweight decorative indicators

## Extension Points

- replace in-file mock data with an API client layer
- add React Router for multi-screen management
- introduce authenticated workspaces and environment switching
- connect deployment activity to real logs and job states
- add charts, filters, and server detail drawers
