# Changelog

All notable changes to this project will be documented in this file.

[Unreleased]

## 2026-03-31 22:53 EDT

- added a Linux packaging pipeline with `electron-builder`, including `npm run package:linux` plus Linux targets for AppImage, `.deb`, and `.rpm`
- generated packaging icons from `public/icon.png` through a reusable `scripts/generate-icons.mjs` flow, producing Linux icon sizes and future-facing `.ico` groundwork
- added a manual GitHub Actions workflow for Linux package builds and artifact upload
- verified Linux packaging locally by producing `release/Mewl-0.1.0-x86_64.AppImage`, `release/mewl_0.1.0_amd64.deb`, and `release/mewl-0.1.0.x86_64.rpm`
- refreshed the README, overview, and roadmap to document the Linux-first packaging flow and marked desktop delivery complete for the current Linux target scope

## 2026-03-31 22:27 EDT

- removed the redundant `managed` ownership pill from cards on the Managed page so saved service cards focus on status and service mode instead
- refreshed the README and overview to document the tighter Managed card presentation

## 2026-03-31 22:17 EDT

- added explicit managed service modes for `command`, `script`, and `docker`, including mode-specific editor labels, guidance, and saved runtime metadata
- restored working-directory and restart-policy controls inside the Managed modal so roadmap-promised service definitions are editable again from the UI
- taught the Electron runtime to launch direct script paths through interpreter-aware resolution for common shell, Python, and Node script extensions
- added Docker-aware fallback stop derivation for common `docker compose up ...` and named `docker run ...` managed services when no explicit stop command is saved
- refreshed the README, overview, and roadmap to document the completed script-first and Docker-first managed-service slice
- revalidated the app with a successful `npm run build`

## 2026-03-31 20:45 EDT

- removed the always-visible helper text under the managed-card `autostart` and `watch ports` toggles and moved that guidance into hover text instead
- refreshed the README, overview, and roadmap to document the tighter managed-card toggle treatment

## 2026-03-31 20:26 EDT

- removed the standalone Automation page and folded the service-level `autostart` and `watch ports` controls into each managed service card
- kept the underlying automation history and runtime behavior intact while trimming the UI down to the controls that actually matter in the Managed workspace
- refreshed the README, overview, and roadmap to document the five-view navigation and the new managed-card toggle flow

## 2026-03-31 20:10 EDT

- moved the Runtime Pulse card out of the sidebar and into the open sixth Trend Canvas slot so the monitor grid fills the desktop space more cleanly
- removed the monitor-only sidebar waveform so Host Health stays focused on machine state while Runtime Pulse remains part of the main monitoring canvas
- refreshed the README, overview, and roadmap to document the in-grid Runtime Pulse placement

## 2026-03-31 20:07 EDT

- rearranged the Monitor page into horizontal bands so the trend canvas spans the workspace, the snapshot lane reads across the page, and the noisy-service cards sit in a two-column grid instead of a tall first column
- moved the Runtime Pulse waveform into the sidebar under Host Health while the Monitor view is active, giving the main monitoring surface more room for trend and service cards
- refreshed the README, overview, and roadmap to document the new monitor layout pass

## 2026-03-31 14:58 EDT

- added rolling monitor visuals for CPU, memory, disk, network, and GPU by introducing a live metric-history buffer in the Electron runtime and a new SVG trend-chart component in the shared UI layer
- reshaped the Monitor page into a stronger composed surface with a trend canvas, snapshot lane, and the existing noisy-service context instead of relying on standalone progress bars alone
- refreshed the README, overview, and roadmap to document the new monitoring visual system and marked the remaining Phase 4 chart item complete
- revalidated the app with a successful `npm run build`

## 2026-03-31 14:54 EDT

- added alert-center filtering in the tray for severity, service, and time window without pushing the workflow into a separate full-page view
- expanded the Electron alert builder to flag crash loops, reserved-port drift, and unhealthy managed-service CPU or memory spikes alongside the existing host-level alerts
- refreshed the README, overview, and roadmap to document the richer alerts model and marked the remaining Phase 4 alert items complete
- revalidated the app with a successful `npm run build`

## 2026-03-31 14:37 EDT

- added managed-service restart policies with bounded retry limits, including `manual`, `on-failure`, and `always` modes in the Managed editor
- extended the Electron runtime to record persisted automation history for manual actions, runtime boot flows, profile runs, policy retries, and failure paths
- refreshed the Automation page with policy counts, failure summaries, and a real history feed instead of only showing toggle rows
- refreshed the README, overview, roadmap, and project instructions to document restart policies and automation history
- revalidated the app with a successful `npm run build`

## 2026-03-31 14:30 EDT

- added a Managed cleanup flow for legacy `mewl.services.json` entries, including persisted review metadata from the Electron normalization layer and in-app confirmation actions
- surfaced cleanup-only filtering, per-card review badges, and editor-side review notes so imported service definitions can be corrected intentionally instead of silently rewritten
- refreshed the README, overview, roadmap, and project instructions to document the new legacy-config cleanup path
- revalidated the app with a successful `npm run build`

## 2026-03-31 14:25 EDT

- audited the shipped app against the roadmap and marked the already-landed Observed-versus-Managed milestones as complete, including runtime metadata hydration, observed/runtime separation, and legacy managed-config normalization
- corrected the project docs and instruction files so they now reflect the six-view workspace model with the dedicated `Managed` page
- revalidated the docs-only alignment pass against the current code structure before the next feature slice

## 2026-03-31 13:48 EDT

- tightened the Processes page card layout so long process names, descriptions, commands, and working-directory paths now wrap inside expanded cards instead of spilling past the edge
- refreshed the README, overview, and roadmap to document the Processes card readability pass
- revalidated the app with a successful `npm run build`

## 2026-03-31 13:35 EDT

- added a guided create-from-observed flow that opens the Managed editor with a prefilled draft banner, carrying over the observed command, working directory, and watch-port hint before anything is saved
- added a dedicated observed-only kill action in the Processes page and inspector, with copy that makes it explicit that Mewl is terminating the live pid rather than editing the managed service catalog
- extended the Electron runtime bridge with a real observed-process termination path that rejects managed-service pids and refreshes the live runtime snapshot afterward
- refreshed the README, overview, and roadmap to document the new observed-to-managed review flow and clearer observed kill behavior
- revalidated the app with a successful `npm run build`

## 2026-03-31 11:47 EDT

- added a dedicated `Managed` workspace for user-authored service definitions, including editable start, stop, and restart commands, working directory, notes, autostart and watch-port toggles, title colors, and icon choices
- removed the old `Manage` / `Observe` and lifecycle controls from the live Processes cards so that page now stays focused on expandable runtime inspection instead of service authoring
- updated the Electron bridge and config layer so managed services are explicit saved definitions with command-string parsing, optional stop and restart hooks, and in-app create, update, and remove actions
- refreshed the README, overview, and roadmap to document the new Managed workspace and the lighter live-process model
- revalidated the app with a successful `npm run build`

## 2026-03-31 11:05 EDT

- expanded the roadmap into a detailed `Observed` versus `Managed` product slice so future work can be planned as a clean split between live inspection and explicit service definitions
- documented the manual managed-service editor direction, including launch commands, renameable cards, metadata, and script/Docker-friendly start and stop flows
- refreshed the README and overview to match the roadmap language so the product direction stays aligned across the docs

## 2026-03-31 10:40 EDT

- fixed the Processes view so helper subprocesses like Chromium and Electron `--type=...` workers no longer flood the grid as separate app cards
- hardened `Manage` promotion by walking helper-child selections back to the launchable parent process before saving a managed service
- normalized helper-derived managed-service entries on config load so repeated accidental `Manage` clicks collapse back into one saved service instead of multiple broken duplicates
- refreshed the README, overview, and roadmap to document the cleaner observed-process model and the planned split between observed and manually managed workspaces
- revalidated the app with a successful `npm run build` and a direct Electron runtime hydration check against the live host snapshot

## 2026-03-31 09:31 EDT

- added a UI-backed `Manage` / `Observe` flow so processes can be promoted into or removed from managed service control without hand-editing JSON
- moved the live managed-service config to a per-user app-data location, using `~/.config/mewl/mewl.services.json` on Linux and platform-equivalent paths elsewhere
- reset the repo copy of `mewl.services.json` to an empty baseline so new installs do not start with fake sample services
- refreshed the README, overview, and roadmap to document the new config location and process-management flow
- revalidated the app with a successful `npm run build` and a direct runtime script that promoted an observed process to managed and then demoted it back

## 2026-03-31 09:21 EDT

- removed the extra warning copy from observed process cards and inspector states so those surfaces stay visually clean
- added simple `managed` and `observed` ownership tags anywhere process status is shown
- refreshed the README, overview, and roadmap to document the cleaner process labeling
- revalidated the app with a successful `npm run build`

## 2026-03-31 09:14 EDT

- removed the confusing shared header start, stop, and restart buttons that could appear disabled when the current selection was not a managed service
- moved lifecycle actions onto process surfaces so managed services can be controlled directly from their cards and inspector without scrolling back to the top bar
- refreshed the README, overview, and roadmap to document the process-first interaction model
- revalidated the app with a successful `npm run build`

## 2026-03-31 09:04 EDT

- fixed managed start, stop, and restart actions by teaching the Electron runtime to reattach matching services that were already running on the host before Mewl connected
- added process-level lifecycle controls to expanded process cards and the full inspector so service actions no longer depend only on the global top command strip
- kept observed host processes read-only in the UI, with clearer messaging when a process is not managed through `mewl.services.json`
- refreshed the README, overview, and roadmap to document the lifecycle-control pass
- revalidated the app with a successful `npm run build` and a direct Electron runtime action script covering stop, start, and restart

## 2026-03-31 08:56 EDT

- added GPU telemetry sampling to the Electron runtime, with `nvidia-smi` and DRM sysfs fallbacks plus a clean unavailable state when the host exposes no readable GPU counters
- surfaced GPU pressure on the Monitor page and in the sidebar Host Health card without crowding the existing layout
- removed the bulky Automation page state column and folded its useful status into compact inline panels above the rule list
- rebuilt the Monitor page `Top Resource Draw` cards so long process command text stays collapsed until expanded, fixing the text overflow issue
- refreshed the README, overview, and roadmap to document the monitoring and automation cleanup
- revalidated the app with a successful `npm run build`

## 2026-03-31 08:43 EDT

- tightened the Processes page cards by removing long command text from the collapsed state
- moved the full command and working directory details into the expanded process panel so uneven cards no longer stretch the whole grid
- refreshed the README, overview, and roadmap to document the cleaner process-card layout

## 2026-03-31 08:40 EDT

- changed the Electron main window shutdown flow so closing the app quits the process cleanly instead of leaving the desktop dev shell running in the background
- removed the automatic detached DevTools launch in development, which was keeping the Electron session alive after the main window closed
- refreshed the README, overview, and roadmap to document the desktop shutdown fix

## 2026-03-31 08:38 EDT

- changed the shared workspace search field to use the Pink Pixel rose accent instead of green for both the search icon and focus glow
- refreshed the README, overview, and roadmap to keep the branded search treatment documented

## 2026-03-31 08:33 EDT

- widened the Ports registry table layout so the `Target` column gets more room in the desktop shell
- updated the service and target cells to wrap longer values instead of clipping bind targets at the card edge
- refreshed the README, overview, and roadmap to note the port-table readability fix

## 2026-03-31 08:27 EDT

- fixed the Electron development renderer path by binding Vite and preview explicitly to `127.0.0.1`, matching the `MEWL_RENDERER_URL` used by `npm run dev:desktop`
- documented that Electron's insecure CSP warning is expected in Vite-powered development and was not the black-screen root cause
- refreshed the README, overview, and roadmap with the loopback-host alignment change

## 2026-03-31 08:25 EDT

- fixed the Electron production renderer path by setting Vite `base` to `./`, so built assets resolve correctly when `dist/index.html` is loaded over `file://`
- changed `npm run desktop` to rebuild the renderer before launching Electron, which avoids stale desktop bundles after UI changes
- added `did-fail-load` and renderer-exit diagnostics in `electron/main.cjs` so future blank-window regressions surface useful console output
- refreshed the project docs to describe the Electron asset-path fix and the updated desktop launch flow

## 2026-03-31 08:20 EDT

- removed the remaining browser-side mock runtime fallback so `src/runtime/provider.ts` now requires the live Electron bridge
- updated the renderer reset and error flow to retry the Electron connection instead of rebuilding from a fake snapshot
- deleted the unused mock dataset and boot helpers from `src/data/runtime.ts`, leaving only the shared runtime contract types
- refreshed the docs and roadmap so Mewl is described as an Electron-first desktop dashboard with no runtime fallback path
- revalidated the app with a successful `npm run build`

## 2026-03-31 08:14 EDT

- hardened managed service launches in `electron/runtime.cjs` by validating executable tokens, constraining service working directories to the workspace, and resolving commands against the configured PATH
- changed managed environment handling so services only inherit explicitly listed variables from `inheritEnv` plus their declared `env` overrides
- added reserved-port checks before managed starts so Mewl refuses to boot a service when one of its watched ports is already occupied
- surfaced child-process startup errors into managed logs instead of letting one bad service crash the wider Electron hydration flow
- marked the roadmap's permission-safe command execution and environment-handling item complete and documented the new launch policy
- revalidated the web build with a successful `npm run build` and confirmed the hardened runtime still booted the managed services

## 2026-03-31 08:06 EDT

- extended `mewl.services.json` with startup profiles so grouped managed services can be booted or quieted through the Electron bridge
- taught the Electron runtime to apply enabled autostart services and boot profiles during hydration
- wired the Automation page to real profile actions so toggling quiet mode now parks the managed preview service instead of only changing UI state
- verified the grouped startup flow by hydrating the runtime, confirming both managed services booted, enabling quiet mode, and then restoring the config
- revalidated the web build with a successful `npm run build`

## 2026-03-31 07:39 EDT

- extended the Electron bridge so managed service settings can be updated from the renderer and persisted back to `mewl.services.json`
- wired the inspector `Autostart` and `Watch ports` toggles to the real desktop config for managed services instead of leaving them read-only in Electron mode
- generated live Electron automation rules from managed service settings so the Automation page now reflects and edits real config
- verified the managed-setting round trip by updating `workspace-sandbox`, confirming the snapshot changed, and restoring the config afterward
- revalidated the web build with a successful `npm run build`

## 2026-03-31 07:32 EDT

- added config-driven managed services in `mewl.services.json` so Electron lifecycle actions only target processes Mewl explicitly owns
- extended `electron/runtime.cjs` to start, stop, and restart managed services while continuing to scan the live host for discovered processes, ports, and metrics
- wired the preload and renderer bridge so desktop lifecycle buttons now execute real managed actions instead of staying disabled
- stopped restoring persisted runtime process data over the live Electron snapshot so the desktop shell shows current host state first
- marked discovered host processes as observed and left them read-only, including disabling unwired inspector toggles in Electron mode
- verified the managed-service loop by starting, scanning, and stopping `workspace-sandbox`, and revalidated the web build with `npm run build`

## 2026-03-31 07:21 EDT

- added an Electron desktop shell with `electron/main.cjs` and `electron/preload.cjs`
- implemented a first live host runtime collector in `electron/runtime.cjs` that scans real user processes, listening ports, and host metrics
- updated the React shell so Electron mode uses the live bridge for runtime hydration and refresh scans instead of the mock boot helpers
- disabled unfinished lifecycle buttons in live Electron mode so the app no longer pretends start, stop, and restart are wired when they are not
- added `dev:desktop` and related package scripts for running the Vite renderer and Electron shell together during development
- refreshed the docs to mark the remaining browser mock path as temporary and the long-term goal as a no-fallback live desktop runtime
- revalidated the web build with a successful `npm run build`

## 2026-03-31 06:54 EDT

- chose Electron as Mewl's native host integration layer and documented the decision across the roadmap and technical docs
- added `src/runtime/provider.ts` so the renderer now hydrates through a runtime-source boundary instead of calling the mock boot helpers directly
- typed a future `window.mewlHost` preload bridge in `src/vite-env.d.ts` so the app can adopt an Electron preload API without reshaping the UI contract
- updated `index.html` metadata to describe Mewl as a local ops dashboard instead of the older server-manager scaffold wording
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
