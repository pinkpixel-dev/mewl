# Mewl

Mewl is a local operations cockpit for managing running services, watched ports, quick lifecycle actions, and host pressure from one workspace.

## What It Does Today

- Search a managed local runtime made up of services, workers, tooling, and data processes
- Start, stop, restart, and scan the selected service from a compact top command strip
- Use a cleaner overview dashboard with summary cards plus side-by-side process and port previews
- Jump from dashboard previews into dedicated Processes and Ports pages with `See all` actions
- Browse the Processes page as expandable three-column cards with the full inspector shown below
- Review a port registry with exposure, conflict, and watched-binding states
- Track host CPU, memory, disk, and network pressure from the sidebar and monitor view
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

- The UI is interactive and stateful, but process control is still powered by a mock front-end runtime model in [`src/data/runtime.ts`](/home/sizzlebop/PINKPIXEL/PROJECTS/CURRENT/mewl/src/data/runtime.ts).
- Real OS process launching, killing, port discovery, and machine telemetry will require a local bridge layer such as Electron, Tauri, or a small local daemon/API.
- The app is already structured around that future workflow, so the next step is wiring the current actions to a real runtime adapter.

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
|   |-- App.tsx
|   |-- main.tsx
|   |-- styles.css
|   `-- vite-env.d.ts
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
- The current implementation is a polished local-ops foundation with mock runtime data and no native system bridge yet.
