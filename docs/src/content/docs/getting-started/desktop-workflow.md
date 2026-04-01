---
title: Desktop workflow
description: Understand how Mewl organizes local operations into Observed, Managed, Logs, Ports, and Monitor workspaces.
---

## The mental model

Mewl is easiest to use when you treat it as a runtime cockpit instead of a generic dashboard.

- `Observed` answers: what is running right now?
- `Managed` answers: what should Mewl control for me?
- `Logs` answers: what just happened, and where did it come from?
- `Ports` answers: what is bound, watched, conflicted, or exposed?
- `Monitor` answers: what is pressuring the host over time?

## A practical first session

If you are opening Mewl for the first time, this flow works well:

1. Start on `Overview` and scan the high-level health cards.
2. Open `Processes` and inspect what is already live on the machine.
3. Promote only the services you actually want Mewl to manage into `Managed`.
4. Add notes, stop behavior, and restart policy in the managed editor so the definition is explicit.
5. Use `Logs` and `Ports` during troubleshooting instead of guessing from terminal output alone.
6. Keep `Monitor` open when you suspect resource pressure or runtime spikes.

## Observed

The Processes workspace shows live host processes without pretending Mewl owns them. That means you can inspect, expand, and review them without accidentally turning helper subprocess noise into long-term service definitions.

![Mewl processes workspace](/screenshots/Screenshot2.png)

## Managed

Use the Managed workspace for services you want Mewl to own intentionally. These are explicit saved definitions with launch metadata, optional teardown commands, restart policy, notes, and visual tags.

![Mewl managed services view](/screenshots/Screenshot3.png)

Saved services can be plain commands, direct scripts, or Docker-oriented flows. That flexibility matters because local environments often mix package scripts, shell wrappers, Python workers, and container-backed tools in one stack.

## Logs

The Logs workspace brings together:

- Mewl internal diagnostics
- managed process stdout and stderr
- Docker-derived container logs where possible
- Linux host logs through journald

The result is one feed that still preserves source, severity, and category so filtering stays fast.

![Mewl logs workspace](/screenshots/Screenshot4.png)

When something breaks, `Logs` is usually the fastest second stop after `Managed`.

## Ports and monitor

Ports and Monitor work together. Ports tells you *where* something is bound and whether a reservation is in conflict. Monitor tells you *how hard* the host is working across CPU, memory, disk, network, and GPU samples.

![Mewl monitor workspace](/screenshots/Screenshot7.png)

Together, those two views help separate "the command failed to bind" from "the machine is under pressure" without leaving the app.
