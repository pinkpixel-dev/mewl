---
title: Managed services
description: Define services Mewl can own with command, script, or Docker-based launch flows.
---

## What a managed service is

A managed service is a saved launch definition that Mewl can start, stop, restart, and reconcile with the live host runtime.

![Mewl managed editor and service cards](/screenshots/Screenshot3.png)

Each service can include:

- a display name
- a service mode: `command`, `script`, or `docker`
- a start command
- optional stop and restart commands
- a working directory
- notes
- color and icon metadata
- restart policy settings
- watched ports and autostart flags

## A good managed-service definition

The best managed definitions are explicit and boring in a good way. Mewl works best when the service record answers:

- what should be launched
- where it should be launched from
- how it should be stopped
- whether it should retry after failure
- which ports matter

If that information only exists in your head or in one shell history line, use the editor to make it durable.

## Service modes

### Command

Use `command` for standard binaries, package scripts, workers, and local daemons.

### Script

Use `script` when the real source of truth is a launch script such as `./scripts/dev.sh` or `./workers/boot.py`.

### Docker

Use `docker` for Docker-aware start and stop flows. Mewl can derive a Docker-friendly stop command for common patterns when no explicit stop command is saved.

## Restart policy

Mewl supports three broad restart behaviors:

- `manual`
- `on-failure`
- `always`

Bounded retry counts keep automatic restarts explainable instead of opaque.

## Observed to managed flow

If a useful process is already running, Mewl can prefill a managed draft from the observed runtime. That gives you a faster starting point without silently saving a weak definition.

Review that draft carefully before saving it. Observed runtime facts are a strong starting point, but the saved launch definition should still reflect the command you actually trust for future runs.
