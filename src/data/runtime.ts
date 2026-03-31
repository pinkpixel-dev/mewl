export type WorkspaceView = "overview" | "processes" | "ports" | "monitor" | "automation";

export type ProcessStatus = "running" | "starting" | "degraded" | "stopped";

export type PortStatus = "bound" | "booting" | "standby" | "conflict";

export type AlertSeverity = "info" | "warning" | "critical";

export type ProcessLogLevel = "info" | "debug" | "warning" | "error";

export type ProcessLogEntry = {
  id: string;
  stamp: string;
  level: ProcessLogLevel;
  text: string;
};

export type ProcessLogs = {
  stdout: ProcessLogEntry[];
  stderr: ProcessLogEntry[];
};

export type ManagedProcess = {
  id: string;
  name: string;
  group: string;
  description: string;
  command: string;
  cwd: string;
  runtime: string;
  status: ProcessStatus;
  pid: number | null;
  ports: number[];
  cpu: number;
  memory: number;
  network: number;
  uptime: string;
  restarts: number;
  lastExit: string;
  lastHeartbeat: string;
  autoStart: boolean;
  watchPorts: boolean;
  managed: boolean;
  logs: ProcessLogs;
};

export type PortBinding = {
  id: string;
  port: number;
  protocol: string;
  serviceId: string;
  service: string;
  target: string;
  exposure: "public" | "local" | "internal";
  status: PortStatus;
  note: string;
};

export type AlertRecord = {
  id: string;
  title: string;
  detail: string;
  severity: AlertSeverity;
  stamp: string;
};

export type MonitorMetric = {
  id: string;
  label: string;
  value: number;
  detail: string;
};

export type AutomationRule = {
  id: string;
  title: string;
  detail: string;
  cadence: string;
  enabled: boolean;
};

export type RuntimeSnapshot = {
  processes: ManagedProcess[];
  ports: PortBinding[];
  alerts: AlertRecord[];
  monitorMetrics: MonitorMetric[];
  automationRules: AutomationRule[];
};

export const mockRuntimeBootDelayMs = 420;

const stdout = (...entries: ProcessLogEntry[]): ProcessLogEntry[] => entries;

const stderr = (...entries: ProcessLogEntry[]): ProcessLogEntry[] => entries;

export const initialProcesses: ManagedProcess[] = [
  {
    id: "web-ui",
    name: "web-ui",
    group: "frontend",
    description: "Main React control surface for the local workspace.",
    command: "npm run dev",
    cwd: "apps/web-ui",
    runtime: "vite",
    status: "running",
    pid: 29463,
    ports: [29463],
    cpu: 16,
    memory: 612,
    network: 18,
    uptime: "1h 18m",
    restarts: 1,
    lastExit: "Clean exit before current boot",
    lastHeartbeat: "8s ago",
    autoStart: true,
    watchPorts: true,
    managed: true,
    logs: {
      stdout: stdout(
        {
          id: "web-ui-out-1",
          stamp: "06:03:14",
          level: "info",
          text: "Vite dev server accepted the dedicated Mewl workspace port 29463.",
        },
        {
          id: "web-ui-out-2",
          stamp: "06:03:28",
          level: "debug",
          text: "Hot module graph settled after the latest shell layout refresh.",
        },
        {
          id: "web-ui-out-3",
          stamp: "06:04:02",
          level: "info",
          text: "Workspace search and command strip are responsive after hydration.",
        },
      ),
      stderr: stderr(),
    },
  },
  {
    id: "api-core",
    name: "api-core",
    group: "services",
    description: "Primary API server with a debugger sidecar for local work.",
    command: "pnpm api:dev",
    cwd: "apps/api",
    runtime: "node",
    status: "degraded",
    pid: 4812,
    ports: [4000, 9229],
    cpu: 42,
    memory: 894,
    network: 54,
    uptime: "43m",
    restarts: 3,
    lastExit: "Recovered after EADDRINUSE on 4010",
    lastHeartbeat: "14s ago",
    autoStart: true,
    watchPorts: true,
    managed: true,
    logs: {
      stdout: stdout(
        {
          id: "api-core-out-1",
          stamp: "05:52:09",
          level: "info",
          text: "HTTP listener bound on 127.0.0.1:4000 with debugger sidecar enabled.",
        },
        {
          id: "api-core-out-2",
          stamp: "05:52:16",
          level: "debug",
          text: "Schema cache warmed from the local Postgres snapshot in 182ms.",
        },
        {
          id: "api-core-out-3",
          stamp: "05:53:41",
          level: "warning",
          text: "Shadow process detection left the reserved 4010 handoff port in watch mode.",
        },
      ),
      stderr: stderr(
        {
          id: "api-core-err-1",
          stamp: "05:53:39",
          level: "error",
          text: "listen EADDRINUSE: address already in use 127.0.0.1:4010",
        },
        {
          id: "api-core-err-2",
          stamp: "05:53:40",
          level: "warning",
          text: "Fallback drain sequence kept the primary API listener healthy on 4000.",
        },
      ),
    },
  },
  {
    id: "queue-worker",
    name: "queue-worker",
    group: "workers",
    description: "Background jobs, schedulers, and webhook fan-out.",
    command: "pnpm worker:start",
    cwd: "apps/worker",
    runtime: "node",
    status: "running",
    pid: 5124,
    ports: [],
    cpu: 23,
    memory: 528,
    network: 26,
    uptime: "2h 05m",
    restarts: 0,
    lastExit: "No recent exit",
    lastHeartbeat: "5s ago",
    autoStart: true,
    watchPorts: false,
    managed: true,
    logs: {
      stdout: stdout(
        {
          id: "queue-worker-out-1",
          stamp: "05:47:11",
          level: "info",
          text: "Webhook fan-out queue resumed with 12 pending deliveries.",
        },
        {
          id: "queue-worker-out-2",
          stamp: "05:48:02",
          level: "debug",
          text: "Scheduler sweep completed with no retry backlog.",
        },
      ),
      stderr: stderr(),
    },
  },
  {
    id: "postgres-local",
    name: "postgres-local",
    group: "data",
    description: "Local database used by the full dev stack.",
    command: "docker compose up postgres",
    cwd: "infra/local",
    runtime: "docker",
    status: "running",
    pid: 1887,
    ports: [5432],
    cpu: 9,
    memory: 430,
    network: 8,
    uptime: "5h 11m",
    restarts: 0,
    lastExit: "No recent exit",
    lastHeartbeat: "11s ago",
    autoStart: true,
    watchPorts: true,
    managed: true,
    logs: {
      stdout: stdout(
        {
          id: "postgres-out-1",
          stamp: "05:40:17",
          level: "info",
          text: "Database accepted the latest snapshot replay with zero checksum drift.",
        },
        {
          id: "postgres-out-2",
          stamp: "05:41:03",
          level: "debug",
          text: "WAL activity remains inside the expected local development window.",
        },
      ),
      stderr: stderr(),
    },
  },
  {
    id: "mailcatcher",
    name: "mailcatcher",
    group: "tooling",
    description: "Preview inbox for auth, receipt, and invite flows.",
    command: "mailhog",
    cwd: "tools/mail",
    runtime: "binary",
    status: "stopped",
    pid: null,
    ports: [1025, 8025],
    cpu: 0,
    memory: 72,
    network: 0,
    uptime: "stopped",
    restarts: 4,
    lastExit: "Exited after manual shutdown",
    lastHeartbeat: "idle",
    autoStart: false,
    watchPorts: true,
    managed: true,
    logs: {
      stdout: stdout(
        {
          id: "mailcatcher-out-1",
          stamp: "05:18:51",
          level: "info",
          text: "SMTP sink drained cleanly before the tooling profile was parked.",
        },
      ),
      stderr: stderr(),
    },
  },
  {
    id: "storybook",
    name: "storybook",
    group: "frontend",
    description: "Component lab for validating UI states before release.",
    command: "pnpm storybook",
    cwd: "apps/web-ui",
    runtime: "node",
    status: "starting",
    pid: 6405,
    ports: [6006],
    cpu: 14,
    memory: 388,
    network: 11,
    uptime: "booting",
    restarts: 2,
    lastExit: "Restarting after package refresh",
    lastHeartbeat: "booting",
    autoStart: false,
    watchPorts: false,
    managed: true,
    logs: {
      stdout: stdout(
        {
          id: "storybook-out-1",
          stamp: "06:02:19",
          level: "info",
          text: "Storybook boot requested after the component skin refresh.",
        },
        {
          id: "storybook-out-2",
          stamp: "06:02:34",
          level: "debug",
          text: "Dependency graph is rebuilding the preview iframe bundle.",
        },
      ),
      stderr: stderr(
        {
          id: "storybook-err-1",
          stamp: "06:02:41",
          level: "warning",
          text: "Cold boot exceeded the recent average while package metadata was refreshed.",
        },
      ),
    },
  },
];

export const initialPorts: PortBinding[] = [
  {
    id: "port-29463",
    port: 29463,
    protocol: "http",
    serviceId: "web-ui",
    service: "web-ui",
    target: "127.0.0.1:29463",
    exposure: "public",
    status: "bound",
    note: "Dedicated dev port for Mewl.",
  },
  {
    id: "port-4000",
    port: 4000,
    protocol: "http",
    serviceId: "api-core",
    service: "api-core",
    target: "127.0.0.1:4000",
    exposure: "local",
    status: "bound",
    note: "Main API listener.",
  },
  {
    id: "port-4010",
    port: 4010,
    protocol: "http",
    serviceId: "api-core",
    service: "api-core",
    target: "127.0.0.1:4010",
    exposure: "internal",
    status: "conflict",
    note: "Shadow instance still listening.",
  },
  {
    id: "port-5432",
    port: 5432,
    protocol: "tcp",
    serviceId: "postgres-local",
    service: "postgres-local",
    target: "127.0.0.1:5432",
    exposure: "local",
    status: "bound",
    note: "Primary local database socket.",
  },
  {
    id: "port-6006",
    port: 6006,
    protocol: "http",
    serviceId: "storybook",
    service: "storybook",
    target: "127.0.0.1:6006",
    exposure: "local",
    status: "booting",
    note: "Waiting for initial build to settle.",
  },
  {
    id: "port-8025",
    port: 8025,
    protocol: "http",
    serviceId: "mailcatcher",
    service: "mailcatcher",
    target: "127.0.0.1:8025",
    exposure: "local",
    status: "standby",
    note: "Web inbox is idle until mailcatcher boots.",
  },
  {
    id: "port-1025",
    port: 1025,
    protocol: "smtp",
    serviceId: "mailcatcher",
    service: "mailcatcher",
    target: "127.0.0.1:1025",
    exposure: "local",
    status: "standby",
    note: "SMTP sink is parked with the service offline.",
  },
  {
    id: "port-9229",
    port: 9229,
    protocol: "tcp",
    serviceId: "api-core",
    service: "api-core",
    target: "127.0.0.1:9229",
    exposure: "internal",
    status: "bound",
    note: "Debugger port is restricted to the host.",
  },
];

export const initialAlerts: AlertRecord[] = [
  {
    id: "alert-1",
    title: "Port conflict detected",
    detail: "api-core reported a shadow listener on 4010 during the last restart.",
    severity: "critical",
    stamp: "2m",
  },
  {
    id: "alert-2",
    title: "Storybook still booting",
    detail: "Dependency graph rebuild is taking longer than the recent average.",
    severity: "warning",
    stamp: "6m",
  },
  {
    id: "alert-3",
    title: "Mailcatcher parked",
    detail: "Tooling process was left stopped after the latest auth test pass.",
    severity: "info",
    stamp: "18m",
  },
  {
    id: "alert-4",
    title: "Postgres snapshot completed",
    detail: "The local backup archive finished with no checksum drift.",
    severity: "info",
    stamp: "34m",
  },
];

export const initialMonitorMetrics: MonitorMetric[] = [
  {
    id: "cpu",
    label: "Host CPU",
    value: 68,
    detail: "Burst pressure from API rebuilds and Storybook startup.",
  },
  {
    id: "memory",
    label: "Memory Pressure",
    value: 61,
    detail: "Several dev services are resident but within the safe window.",
  },
  {
    id: "disk",
    label: "Disk Activity",
    value: 39,
    detail: "Mostly cache and log writes during the current session.",
  },
  {
    id: "network",
    label: "Network Chatter",
    value: 27,
    detail: "Traffic is limited to local services and package metadata.",
  },
];

export const initialAutomationRules: AutomationRule[] = [
  {
    id: "boot-core",
    title: "Boot core workspace",
    detail: "Bring up web-ui, api-core, queue-worker, and postgres-local on launch.",
    cadence: "session start",
    enabled: true,
  },
  {
    id: "scan-ports",
    title: "Scan for port drift",
    detail: "Watch the reserved range and surface collisions before a restart loop begins.",
    cadence: "every 60s",
    enabled: true,
  },
  {
    id: "snapshot-logs",
    title: "Snapshot logs",
    detail: "Archive the most recent stdout tail when a process changes state.",
    cadence: "state change",
    enabled: false,
  },
  {
    id: "quiet-hours",
    title: "Quiet hours",
    detail: "Pause noisy tooling services when only the API and database are needed.",
    cadence: "manual profile",
    enabled: false,
  },
];

const cloneLogEntry = (entry: ProcessLogEntry): ProcessLogEntry => ({ ...entry });

const cloneLogs = (logs: ProcessLogs): ProcessLogs => ({
  stdout: logs.stdout.map(cloneLogEntry),
  stderr: logs.stderr.map(cloneLogEntry),
});

const cloneProcess = (process: ManagedProcess): ManagedProcess => ({
  ...process,
  ports: [...process.ports],
  logs: cloneLogs(process.logs),
});

const clonePort = (port: PortBinding): PortBinding => ({ ...port });

const cloneAlert = (alert: AlertRecord): AlertRecord => ({ ...alert });

const cloneMonitorMetric = (metric: MonitorMetric): MonitorMetric => ({ ...metric });

const cloneAutomationRule = (rule: AutomationRule): AutomationRule => ({ ...rule });

export function createInitialRuntimeSnapshot(): RuntimeSnapshot {
  return {
    processes: initialProcesses.map(cloneProcess),
    ports: initialPorts.map(clonePort),
    alerts: initialAlerts.map(cloneAlert),
    monitorMetrics: initialMonitorMetrics.map(cloneMonitorMetric),
    automationRules: initialAutomationRules.map(cloneAutomationRule),
  };
}

export async function hydrateMockRuntime(
  delayMs = mockRuntimeBootDelayMs,
): Promise<RuntimeSnapshot> {
  await new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, delayMs);
  });

  return createInitialRuntimeSnapshot();
}
