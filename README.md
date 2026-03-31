# Mewl

Mewl is a server manager app scaffold for Pink Pixel. It pairs a dark textured backdrop with frosted glass surfaces, Sparklebots-inspired controls, and a layout direction based on `mockup.png`.

## Highlights

- React + TypeScript + Vite app scaffold
- Tailwind CSS 4 wired through the Vite plugin
- Pink Pixel branding with the provided `icon.png` used for app identity and favicon
- Dotted dark background with subtle noise and ambient color glow
- Frosted glass panels for navigation, command surfaces, and utility modules
- Sparklebots-style buttons, stat cards, toggles, and progress bars
- Header actions now align to the left of search for a tighter command strip on desktop
- Sidebar flow-health telemetry now scales cleanly inside the narrower rail
- Responsive desktop and mobile layout validation

## Stack

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- lucide-react

## Run Locally

```bash
npm install
npm run dev
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

The current scaffold is intentionally product-like rather than starter-like:

- left navigation rail with icon-led brand treatment
- compact operational header with actions first and search to the right
- compact metric cards with neon edge glow
- server table and automation controls as primary workspace surfaces
- evenly spaced workspace grids that keep major cards aligned without wasted vertical gaps
- dark dotted texture to echo the mockup instead of a flat black background

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
- The current scaffold is a polished UI foundation with tightened dashboard spacing and does not yet include real server APIs or authentication.
