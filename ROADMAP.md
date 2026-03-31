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
- [ ] Add per-process log tails and structured stdout/stderr panes
- [ ] Add empty, loading, and error states for future live runtime sources
- [ ] Persist filters, selected views, and workspace preferences

## Phase 3: Native Runtime Bridge

- [ ] Choose the host integration layer: Electron, Tauri, or a local daemon/API
- [ ] Replace mock lifecycle actions with real process spawning and termination
- [ ] Discover live ports and reconcile them against reserved bindings
- [ ] Pull real CPU, memory, disk, and network metrics from the host system
- [ ] Add permission-safe command execution and process environment handling

## Phase 4: Monitoring and Automation

- [ ] Add restart policies, grouped startup profiles, and quiet-mode presets
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
