---
title: Installation
description: Download a packaged Mewl release for Linux and install it without building from source.
---

## Download Mewl

Mewl `1.0.0` is currently packaged as a Linux-first desktop app.

Choose the package format that matches your system:

- [AppImage](https://pub-2634147a32ee4044bd80cbdd0918010c.r2.dev/Mewl-1.0.0-x86_64.AppImage)
- [DEB package](https://pub-2634147a32ee4044bd80cbdd0918010c.r2.dev/mewl_1.0.0_amd64.deb)
- [RPM package](https://pub-2634147a32ee4044bd80cbdd0918010c.r2.dev/mewl-1.0.0.x86_64.rpm)

You can also browse the published release details on GitHub:

- [GitHub release page](https://github.com/pinkpixel-dev/mewl/releases/tag/1.0.0)
- [All releases](https://github.com/pinkpixel-dev/mewl/releases)

## Which package should you use?

- `AppImage` is the quickest no-install option for many Linux desktops.
- `DEB` is the best fit for Debian, Ubuntu, and related distributions.
- `RPM` is the best fit for Fedora, RHEL-family systems, and other RPM-based distributions.

## Install on Linux

### AppImage

Download the file, mark it executable, and run it:

```bash
chmod +x Mewl-1.0.0-x86_64.AppImage
./Mewl-1.0.0-x86_64.AppImage
```

### DEB

Install it with:

```bash
sudo dpkg -i mewl_1.0.0_amd64.deb
```

If Debian-based package dependencies need to be repaired afterward:

```bash
sudo apt-get install -f
```

### RPM

Install it with:

```bash
sudo rpm -i mewl-1.0.0.x86_64.rpm
```

## After installation

When you first open Mewl, start in this order:

1. Open `Overview` to confirm the machine snapshot and current runtime state.
2. Visit `Processes` to see what is already running on the host.
3. Use `Managed` to save the services you want Mewl to control intentionally.
4. Use `Logs`, `Ports`, and `Monitor` when you need diagnostics, binding visibility, or host-pressure context.

## Current scope

Mewl is Linux-first right now. The runtime bridge relies on Linux host-inspection commands and paths for process, port, system-log, disk, network, and GPU integrations.
