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

Defines the dashboard layout, page sections, sample server data, activity feed, and interactive state. The current composition keeps the command strip directly under the workspace label, uses balanced content columns, and keeps the sidebar rail compact.

### `src/components/ui.tsx`

Contains reusable presentation components used throughout the app:

- `StatusPill`
- `ShinyButton`
- `SugarCard`
- `CandyInput`
- `SweetToggle`
- `HologramProgress`
- `SignalBars`

The shared UI layer now also supports width-aware button and signal-bar composition so tighter regions such as the sidebar can reuse the same components without overflow.

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
2. Active workspace command strip
3. Current deck and live pulse summary row
4. Metrics overview row
5. Fleet management plus automation controls
6. Activity thread companion rail

This structure was chosen to stay close to the composition of `mockup.png`, which reads more like an operational control surface than a marketing page.

The latest layout pass focused on three things:

- keeping the command buttons and search field on one visual line on desktop
- reducing dead air under the workspace heading so key surfaces start sooner
- making the sidebar flow-health chart responsive within the fixed-width rail

## Interaction Model

- search input uses `useDeferredValue` to keep filtering responsive
- toggles allow the scaffold to demonstrate state changes without backend wiring
- button glow behavior follows Sparklebots interaction patterns
- progress indicators and animated signal bars add motion without crowding the layout
- the signal bar helper can now expand to fill its container instead of depending on fixed bar widths

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
