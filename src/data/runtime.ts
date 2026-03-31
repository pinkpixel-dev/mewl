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
  displayValue?: string;
  available?: boolean;
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
