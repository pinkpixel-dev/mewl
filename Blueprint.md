# Blueprint

This is a **modern, practical blueprint** for building a unified live logging system in **Node.js + TypeScript** that combines:

- Docker container logs
- PM2 process logs
- Linux system logs (journald)
- One real-time stream to a web dashboard

---

## 1) Architecture

### A) Log Sources (adapters)

Each source is implemented as an adapter with a common interface:

- **Docker adapter**: tails logs from selected/all containers via Docker API
- **PM2 adapter**: tails logs for PM2-managed apps
- **Journald adapter** (Linux): streams system logs via `journalctl -f -o json`

All adapters emit the same normalized log event shape.

### B) Log Broker (aggregation layer)

A central in-memory event bus that:

- Receives events from all adapters
- Normalizes/enriches metadata
- Applies filters
- Broadcasts to subscribed clients (WebSocket/SSE)

### C) API + Realtime Gateway

- REST endpoints for source control (start/stop/list containers/processes)
- WebSocket endpoint for live logs
- Optional auth + tenant/scope filtering

### D) Frontend Dashboard

- Connects via WebSocket
- Renders virtualized log list
- Filters by source/service/level
- ANSI color + timestamps + pause/resume

---

## 2) Tech stack recommendation

- **Backend:** Fastify + TypeScript
- **Realtime:** `ws` (or Socket.IO if you prefer rooms/acks)
- **Docker:** `dockerode`
- **PM2:** `pm2` package API
- **Process execution:** `execa` (for `journalctl`)
- **Validation:** `zod`
- **Frontend:** React + Vite + Tailwind + TanStack Virtual

---

## 3) Unified log event contract

Use one schema for everything:

```ts name=types/log-event.ts
export type LogSource = "docker" | "pm2" | "journald";

export interface LogEvent {
  id: string; // ulid/uuid
  ts: string; // ISO timestamp
  source: LogSource;
  stream?: "stdout" | "stderr" | "system";
  service: string; // container name / pm2 app / unit
  message: string;
  level?: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  host?: string;
  containerId?: string;
  processId?: number;
  unit?: string; // systemd unit
  raw?: unknown; // original payload if needed
}
```

---

## 4) Common adapter interface

```ts name=src/adapters/types.ts
import { LogEvent } from "../../types/log-event";

export interface LogAdapter {
  name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  onEvent(cb: (event: LogEvent) => void): void;
}
```

---

## 5) Example implementation (minimal but real)

## 5.1 Docker adapter

```ts name=src/adapters/docker-adapter.ts
import Docker from "dockerode";
import { randomUUID } from "node:crypto";
import { LogAdapter } from "./types";
import { LogEvent } from "../../types/log-event";

type EventCb = (event: LogEvent) => void;

export class DockerAdapter implements LogAdapter {
  name = "docker";
  private docker: Docker;
  private cb: EventCb = () => {};
  private streams: Array<{ destroy: () => void }> = [];

  constructor(socketPath = "/var/run/docker.sock") {
    this.docker = new Docker({ socketPath });
  }

  onEvent(cb: EventCb) {
    this.cb = cb;
  }

  async start() {
    const containers = await this.docker.listContainers();
    for (const c of containers) {
      const container = this.docker.getContainer(c.Id);
      const stream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        timestamps: true,
        tail: 200,
      });

      // docker multiplexed stream parsing (8-byte header frames)
      stream.on("data", (chunk: Buffer) => {
        // Naive split fallback; for production use strict frame parsing/demux
        const text = chunk.toString("utf8");
        for (const line of text.split("\n").filter(Boolean)) {
          this.cb({
            id: randomUUID(),
            ts: new Date().toISOString(),
            source: "docker",
            stream: "stdout",
            service: c.Names?.[0]?.replace("/", "") || c.Id.slice(0, 12),
            message: line,
            containerId: c.Id,
          });
        }
      });

      stream.on("error", () => {});
      this.streams.push({ destroy: () => stream.destroy() });
    }
  }

  async stop() {
    for (const s of this.streams) s.destroy();
    this.streams = [];
  }
}
```

---

## 5.2 PM2 adapter

```ts name=src/adapters/pm2-adapter.ts
import pm2 from "pm2";
import { createInterface } from "node:readline";
import { createReadStream, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { LogAdapter } from "./types";
import { LogEvent } from "../../types/log-event";

type EventCb = (event: LogEvent) => void;

export class Pm2Adapter implements LogAdapter {
  name = "pm2";
  private cb: EventCb = () => {};
  private cleanupFns: Array<() => void> = [];

  onEvent(cb: EventCb) {
    this.cb = cb;
  }

  async start() {
    await new Promise<void>((res, rej) =>
      pm2.connect((err) => (err ? rej(err) : res())),
    );
    const list = await new Promise<pm2.ProcessDescription[]>((res, rej) =>
      pm2.list((err, procs) => (err ? rej(err) : res(procs))),
    );

    for (const proc of list) {
      const name = proc.name ?? `pm2-${proc.pm_id}`;
      const out = proc.pm2_env?.pm_out_log_path;
      const err = proc.pm2_env?.pm_err_log_path;

      for (const [file, streamType] of [
        [out, "stdout"],
        [err, "stderr"],
      ] as const) {
        if (!file || !existsSync(file)) continue;

        const rl = createInterface({
          input: createReadStream(file, { encoding: "utf8", flags: "r" }),
        });

        rl.on("line", (line) => {
          this.cb({
            id: randomUUID(),
            ts: new Date().toISOString(),
            source: "pm2",
            stream: streamType,
            service: name,
            message: line,
            processId: proc.pid,
          });
        });

        this.cleanupFns.push(() => rl.close());
      }
    }
  }

  async stop() {
    for (const fn of this.cleanupFns) fn();
    this.cleanupFns = [];
    pm2.disconnect();
  }
}
```

---

## 5.3 Journald adapter (Linux)

```ts name=src/adapters/journald-adapter.ts
import { execa, ExecaChildProcess } from "execa";
import { randomUUID } from "node:crypto";
import { LogAdapter } from "./types";
import { LogEvent } from "../../types/log-event";

type EventCb = (event: LogEvent) => void;

export class JournaldAdapter implements LogAdapter {
  name = "journald";
  private cb: EventCb = () => {};
  private child?: ExecaChildProcess;

  onEvent(cb: EventCb) {
    this.cb = cb;
  }

  async start() {
    this.child = execa("journalctl", ["-f", "-n", "200", "-o", "json"], {
      all: true,
    });

    this.child.all?.on("data", (buf: Buffer) => {
      const lines = buf.toString("utf8").split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const j = JSON.parse(line);
          this.cb({
            id: randomUUID(),
            ts: new Date().toISOString(),
            source: "journald",
            stream: "system",
            service: j.SYSLOG_IDENTIFIER || j._SYSTEMD_UNIT || "system",
            message: j.MESSAGE || "",
            unit: j._SYSTEMD_UNIT,
            raw: j,
          });
        } catch {
          // ignore parse errors from partial chunks
        }
      }
    });
  }

  async stop() {
    this.child?.kill("SIGTERM");
  }
}
```

---

## 5.4 Broker + WebSocket server

```
name=src/server.ts
import Fastify from "fastify";
import { WebSocketServer } from "ws";
import { DockerAdapter } from "./adapters/docker-adapter";
import { Pm2Adapter } from "./adapters/pm2-adapter";
import { JournaldAdapter } from "./adapters/journald-adapter";
import { LogEvent } from "../types/log-event";

const app = Fastify({ logger: true });
const adapters = [new DockerAdapter(), new Pm2Adapter(), new JournaldAdapter()];

// basic ring buffer
const MAX = 5000;
const buffer: LogEvent[] = [];

function pushEvent(e: LogEvent, wss: WebSocketServer) {
  buffer.push(e);
  if (buffer.length > MAX) buffer.shift();
  const payload = JSON.stringify({ type: "log", data: e });
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(payload);
  }
}

async function main() {
  const server = await app.listen({ port: 8787, host: "0.0.0.0" });
  const wss = new WebSocketServer({ port: 8788 });

  wss.on("connection", (ws) => {
    ws.send(JSON.stringify({ type: "snapshot", data: buffer.slice(-500) }));
  });

  for (const a of adapters) {
    a.onEvent((e) => pushEvent(e, wss));
    await a.start();
  }

  app.get("/health", async () => ({ ok: true, adapters: adapters.map(a => a.name) }));

  process.on("SIGINT", async () => {
    for (const a of adapters) await a.stop();
    wss.close();
    await app.close();
    process.exit(0);
  });

  app.log.info(`API: ${server}, WS: ws://localhost:8788`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

---

## 6) Frontend sketch (React)

Client connects to ws://localhost:8788 and appends incoming events to state (bounded).
Use virtualized list for performance and filter controls for:

- source: docker/pm2/journald
- service
- level text search
- pause/resume auto-scroll

---

## 7) Production hardening checklist

- **Auth**: never expose raw logs publicly
- **RBAC**: scope which services each user can view
- **Backpressure**: bounded queues per client
- **Parsing**: proper Docker stream demux
- **Reconnect**: resume with `since`
- **Retention**: ship to Loki/Elastic/ClickHouse for history
- **Redaction**: scrub secrets/tokens
- **TLS**: secure transport
- **Observability**: metrics on dropped messages, lag, throughput

---

## 8) What to use when

- Want Docker-live-like experience: **dockerode + ws**
- Want app process supervision: **pm2**
- Want true Linux host logs: **journald adapter**
- Want all together: **adapter pattern + broker**

---

This blueprint gives you a solid foundation to build a unified live logging system that can be extended with more sources, advanced filtering, and richer frontend features as needed.
