# Roadmap

## Phase 1: Visual Foundation

- [x] Scaffold the application shell
- [x] Apply Pink Pixel branding and icon usage
- [x] Build dotted dark background and frosted glass surfaces
- [x] Add Sparklebots-inspired UI primitives
- [x] Match the general layout direction of `mockup.png`
- [x] Tighten dashboard spacing and align the workspace command strip
- [x] Make the sidebar telemetry card responsive within the fixed navigation rail
- [x] Shift the visual system to neutral slate surfaces with accent-only color
- [x] Replace the bottom activity panel with a top-right notifications tray

## Phase 2: Local Ops Cockpit

- [x] Reframe the scaffold around local processes, ports, and host monitoring
- [x] Replace the fantasy server copy with a process-oriented runtime model
- [x] Add quick lifecycle actions for start, stop, restart, and port scanning
- [x] Clean the overview dashboard into summary cards plus short preview lists
- [x] Move the full inspector off the dashboard and onto the Processes page
- [x] Build expandable three-column process cards for the dedicated Processes page
- [x] Add focused workspace modes for overview, processes, ports, monitor, and automation
- [x] Add a collapsible sidebar with host snapshot details
- [x] Keep the notifications tray readable above the dashboard surfaces
- [x] Move the dev server off `5173` to a dedicated fixed port (`29463`)
- [x] Add per-process log tails and structured stdout/stderr panes
- [x] Add empty, loading, and error states for future live runtime sources
- [x] Persist filters, selected views, and workspace preferences
- [x] Tune the Ports registry column sizing so longer target bindings stay readable
- [x] Align the shared search field accent with the Pink Pixel rose brand color
- [x] Move long process command text into the expanded card state to keep the grid compact

## Phase 3: Native Runtime Bridge

- [x] Choose the host integration layer: Electron, Tauri, or a local daemon/API
- [x] Replace mock lifecycle actions with real process spawning and termination
- [x] Discover live ports and reconcile them against reserved bindings
- [x] Pull real CPU, memory, disk, and network metrics from the host system
- [x] Add permission-safe command execution and process environment handling

### Phase 3 Notes

- Electron is the selected host layer for the native bridge.
- The renderer now loads runtime state through `src/runtime/provider.ts` and requires the live Electron bridge.
- The desktop shell now includes `electron/main.cjs`, `electron/preload.cjs`, and `electron/runtime.cjs` for a first live host scan.
- The production renderer now builds with relative asset URLs so `npm run desktop` can load `dist/index.html` inside Electron without a blank file-protocol window.
- The development desktop flow now pins Vite to `127.0.0.1:29463` so Electron no longer races into a `localhost` versus `127.0.0.1` mismatch.
- Closing the main desktop window now quits Electron cleanly in development so `dev:desktop` does not leave the Vite port occupied in the background.
- `mewl.services.json` now defines Mewl-owned services that can be started, stopped, and restarted through the Electron bridge.
- Managed autostart and watch-port settings now persist through the Electron bridge and drive the Automation view.
- Startup profiles and quiet-mode presets can now control grouped managed services, and enabled boot profiles are applied on Electron hydration.
- Managed launches now enforce explicit env inheritance, repo-bound working directories, executable validation, and reserved-port availability checks.
- Browser access now stops at the desktop-required state instead of exposing a runtime fallback.

## Phase 4: Monitoring and Automation

- [ ] Add restart policies
- [x] Add grouped startup profiles and quiet-mode presets
- [ ] Add alerts center filtering by severity, service, and time window
- [ ] Surface process crash loops, orphaned ports, and unhealthy resource spikes
- [ ] Add richer charts for CPU, memory, network, and disk trends
- [ ] Add automation history for what started, stopped, or failed and why

## Phase 5: Quality and Delivery

- [ ] Add component and interaction tests
- [ ] Add linting and formatting automation
- [ ] Add CI build validation
- [ ] Add accessibility pass for keyboard and reduced-motion behavior
- [ ] Package the app for desktop delivery
