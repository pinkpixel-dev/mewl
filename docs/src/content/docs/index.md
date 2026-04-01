---
title: Mewl Docs
description: Local process control, managed services, ports, and diagnostics from one Pink Pixel workspace.
template: splash
hero:
  title: Mewl docs for the live desktop workflow
  tagline: Run local services, inspect live processes, watch ports, and follow diagnostics through a docs site styled to feel like the app itself.
  image:
    alt: Mewl logo
    file: ../../assets/logo.png
  actions:
    - text: Get started
      link: /getting-started/installation/
      icon: right-arrow
      variant: primary
    - text: Open workflow guide
      link: /getting-started/desktop-workflow/
      icon: right-arrow
    - text: Pink Pixel
      link: https://pinkpixel.dev
      icon: external
      variant: minimal
---

## Why Mewl

Mewl gives Pink Pixel's local-ops workflow one focused desktop surface for process visibility, managed-service control, watched ports, automation history, and a live diagnostics stream.

![Mewl overview workspace](/screenshots/Screenshot1.png)

### What you can do here

- Launch the desktop shell against the Electron runtime bridge.
- Create and edit managed services for commands, scripts, and Docker-backed flows.
- Review unified diagnostics across Mewl internals, processes, containers, and Linux system logs.
- Understand where runtime state lives and how Mewl's per-user config file behaves.

## Product shape

Mewl intentionally splits runtime thinking into two lanes:

- `Observed` is for what is running right now on the host.
- `Managed` is for what Mewl should know how to start, stop, and restart on purpose.

That split keeps the app honest. The docs use the same model so setup, reference, and operational guides map directly to the actual UI.

![Mewl managed workspace](/screenshots/Screenshot3.png)

## Start with these pages

- [Install and run Mewl](/getting-started/installation/) to boot the docs and desktop shell locally.
- [Desktop workflow](/getting-started/desktop-workflow/) for the day-to-day model of Observed, Managed, Logs, Ports, and Monitor.
- [Managed services guide](/guides/managed-services/) for launch definitions, restart policy, and runtime ownership.
- [Config file reference](/reference/config-file/) for `mewl.services.json` structure and storage paths.
