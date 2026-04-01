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
- [x] Keep expanded Processes cards readable by wrapping long commands and working-directory paths inside the card bounds

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
- Managed launches now enforce explicit env inheritance, command validation, and reserved-port availability checks.
- Browser access now stops at the desktop-required state instead of exposing a runtime fallback.

## Phase 4: Monitoring and Automation

- [x] Add restart policies
- [x] Add grouped startup profiles and quiet-mode presets
- [x] Add GPU telemetry to the monitor and sidebar health surfaces with graceful unavailable handling
- [x] Simplify the Automation page by folding the old state column into lighter inline status panels
- [x] Make the monitor resource-draw cards expandable so long command text stays out of the default layout
- [x] Add process-level lifecycle controls and host-reattachment so managed services can be reclaimed and controlled after reconnects
- [x] Move lifecycle actions off the shared header and onto process surfaces so service controls stay in context
- [x] Replace observed-process warning copy with simple managed/observed ownership tags
- [x] Move managed-service config to a per-user app-data location and add UI actions to promote or demote processes
- [x] Collapse helper subprocesses from the observed grid and dedupe bad helper-derived managed entries so one app no longer appears as several confusing cards
- [x] Add alerts center filtering by severity, service, and time window
- [x] Surface process crash loops, orphaned ports, and unhealthy resource spikes
- [x] Add richer charts for CPU, memory, network, and disk trends
- [x] Add automation history for what started, stopped, or failed and why
- [x] Replace the single mixed Processes workspace with a two-part model: `Observed` for live host processes and `Managed` for services Mewl should control intentionally

### Phase 4 Planned Product Slice: Observed + Managed Runtime

This is the main UX split the product now points toward:

- `Observed` = live host inspection, with no long-term ownership assumptions
- `Managed` = explicit user-authored service definitions that Mewl can reliably start, stop, and restart

#### 4.1 Observed workspace

- [x] Simplify the live `Processes` workspace so it focuses on what is running right now, with expandable inspection and no lifecycle or manage/observe buttons on the cards
- [x] Keep `Observed` actions intentionally lightweight: inspect, focus, expand details, and kill the running process when the user explicitly chooses to do so
- [x] Keep the observed page read-only with respect to long-term service definitions so helper children and wrapper processes never become accidental managed services
- [x] Preserve the useful runtime facts on observed rows, such as detected pid, live ports, current status, and last heartbeat, without implying that Mewl owns the launch definition
- [x] Make the observed kill action clearly communicate that it is terminating the live process, not editing the managed service catalog

#### 4.2 Managed workspace

- [x] Add a dedicated `Managed` workspace or tab in the sidebar for user-defined services
- [x] Let users create a managed-service card manually instead of relying on process promotion alone
- [x] Support explicit fields for managed services: display name, start command, optional start args, working directory, optional stop command, and optional restart command or flow
- [x] Support fallback stop behavior when no stop command is defined by using process termination for the tracked pid
- [x] Add restart behavior that prefers explicit restart or stop/start flows instead of guessing from a discovered process
- [x] Keep automatic metadata hydration where it is safe: detected pid, detected ports, runtime family, last heartbeat, and current status
- [x] Allow users to rename managed services without changing the underlying command definition
- [x] Allow optional visual metadata for managed services such as color coding and a small image or icon
- [x] Add service notes or description fields so users can document what each managed card is for
- [x] Add validation that makes the managed editor honest about what Mewl can and cannot reliably start or stop
- [x] Show a clearer difference between `running now` and `managed by Mewl` in both the sidebar and card badges

#### 4.3 Manual create and migration flow

- [x] Add a guided flow to create a managed service from an observed process by pre-filling a new managed card instead of silently promoting the live row as-is
- [x] Let the guided flow capture the launch command, cwd, ports, and runtime hints while still requiring the user to confirm the final managed definition
- [x] Add import and cleanup affordances for existing `mewl.services.json` entries so old inferred configs can be reviewed and corrected in the new managed editor
- [x] Normalize older inferred services into the new explicit schema so the app can clearly separate remembered service definitions from current host processes

#### 4.4 Script, wrapper, and Docker support

- [ ] Support script-first and Docker-friendly service definitions so managed entries can launch through wrapper scripts, compose commands, container helpers, or custom stop hooks
- [ ] Treat Docker start and stop flows as first-class managed actions instead of edge cases hidden behind generic command fields
- [ ] Allow managed services to declare the exact launch and teardown scripts they need, with `pkill` or tracked-pid termination only as a fallback path
- [ ] Make the editor flexible enough for shell scripts, package scripts, long-running workers, local daemons, and container-backed tools

#### 4.5 Mental model and labels

- [x] Keep observed process killing separate from managed lifecycle controls so users always know whether they are stopping a live pid or invoking a saved service definition
- [x] Make the sidebar and cards visually reinforce the split between `what is running` and `what Mewl can manage`
- [x] Keep ports, status, and heartbeat auto-filled from runtime scans where possible, but keep the authoritative launch command and stop behavior user-authored in `Managed`
- [ ] Treat Docker, scripts, and custom wrappers as first-class managed-service inputs rather than edge cases

### Phase 4 Planned UX Notes

- `Observed` should answer: "What is running right now?"
- `Managed` should answer: "What should Mewl know how to control for me?"
- The same app can appear in both places, but for different reasons: observed because it is currently live, managed because the user saved a real launch definition
- Ports, status, and heartbeat should auto-fill from runtime scans where possible, but commands should come from the user in the Managed workspace
- The simplest fallback stop path is `pkill` or pid termination, but that should never replace explicit stop hooks when the user defines them
- Docker, scripts, and custom wrappers should be treated as first-class managed-service inputs rather than edge cases

### Phase 4 Progress Notes

- The first `Managed` workspace slice is now live: user-authored service cards can be created and edited directly in the app with start, stop, and restart command fields plus notes, colors, and icon choices.
- The live `Processes` page is now the shipped `Observed` runtime surface, and it stays visually lighter and inspection-first with lifecycle and manage/observe controls removed from those cards and their inspector.
- The guided create-from-observed review flow and the clearer observed-only kill action are now live.
- Managed cards now hydrate pid, ports, status, runtime, and heartbeat details directly from the host scan while keeping the saved launch definition user-authored.
- Older inferred managed config entries now normalize into the explicit command schema on load, and the Managed workspace can surface cleanup reasons plus let users confirm the migrated definition in-app.
- Managed services can now define restart policies with retry limits, and the Electron bridge records automatic retries plus exits in a persisted automation history feed.
- The alerts tray can now filter by severity, service, and time window, and the runtime raises richer alerts for crash loops, orphaned reserved ports, and unhealthy managed-service spikes.
- The Monitor page now renders rolling trend visuals for CPU, memory, disk, network, and GPU using a live sample buffer instead of only one-off pressure bars.
- The Monitor page now uses a wider banded layout, with the runtime waveform occupying the open sixth monitor tile so the primary workspace stays visually balanced on desktop.
- The Managed workspace now uses a denser two-column card grid with modal editing, reducing the always-on form chrome and focusing the editor on the core command fields.
- The old Automation page has now been collapsed back into Managed, with `autostart` and `watch ports` toggles living directly on each managed service card.
- Managed-card automation toggles now keep their explanatory copy in hover text so the service grid stays tighter.

## Phase 5: Quality and Delivery

- [ ] Add component and interaction tests
- [ ] Add linting and formatting automation
- [ ] Add CI build validation
- [ ] Add accessibility pass for keyboard and reduced-motion behavior
- [ ] Package the app for desktop delivery
