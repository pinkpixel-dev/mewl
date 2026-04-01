export type WorkspaceView =
  | "overview"
  | "processes"
  | "managed"
  | "logs"
  | "ports"
  | "monitor";

export type ProcessStatus = "running" | "starting" | "degraded" | "stopped";

export type PortStatus = "bound" | "booting" | "standby" | "conflict";

export type AlertSeverity = "info" | "warning" | "critical";

export type ProcessLogLevel = "info" | "debug" | "warning" | "error";

export type ProcessLogEntry = {
  id: string;
  stamp: string;
  timestamp?: string;
  level: ProcessLogLevel;
  text: string;
};

export type ProcessLogs = {
  stdout: ProcessLogEntry[];
  stderr: ProcessLogEntry[];
};

export type ManagedServiceColor = "default" | "rose" | "purple" | "cyan" | "green" | "amber";

export type ManagedServiceIcon =
  | "server"
  | "terminal"
  | "globe"
  | "database"
  | "bot"
  | "workflow"
  | "sparkles";

export type ManagedServiceKind = "command" | "script" | "docker";

export type ManagedServiceReview = {
  needsReview: boolean;
  source: "legacy-config";
  reasons: string[];
};

export type RestartPolicy = "manual" | "on-failure" | "always";

export type AutomationHistoryOutcome = "success" | "warning" | "error";

export type AutomationHistoryEntry = {
  id: string;
  stamp: string;
  title: string;
  detail: string;
  outcome: AutomationHistoryOutcome;
  serviceId?: string;
  serviceName?: string;
  source: "manual" | "runtime" | "policy" | "profile";
};

export type ManagedProcess = {
  id: string;
  name: string;
  group: string;
  description: string;
  command: string;
  cwd: string;
  runtime: string;
  kind: ManagedServiceKind;
  startCommand?: string;
  stopCommand?: string | null;
  restartCommand?: string | null;
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
  restartPolicy: RestartPolicy;
  restartLimit: number;
  managed: boolean;
  titleColor?: ManagedServiceColor;
  icon?: ManagedServiceIcon;
  review?: ManagedServiceReview | null;
  logs: ProcessLogs;
};

export type ManagedServiceDraft = {
  name: string;
  description: string;
  kind: ManagedServiceKind;
  startCommand: string;
  stopCommand: string;
  restartCommand: string;
  cwd: string;
  autoStart: boolean;
  watchPorts: boolean;
  restartPolicy: RestartPolicy;
  restartLimit: number;
  titleColor: ManagedServiceColor;
  icon: ManagedServiceIcon;
};

export type ManagedServiceUpdate = Partial<ManagedServiceDraft> & {
  clearReview?: boolean;
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
  serviceId?: string;
  serviceName?: string;
  category?: "runtime" | "ports" | "automation" | "resources";
};

export type MonitorMetric = {
  id: string;
  label: string;
  value: number;
  detail: string;
  displayValue?: string;
  available?: boolean;
};

export type MonitorHistorySeries = {
  id: string;
  label: string;
  detail: string;
  values: number[];
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

export type UnifiedLogLevel =
  | "fatal"
  | "error"
  | "warn"
  | "log"
  | "info"
  | "success"
  | "debug"
  | "trace";

export type UnifiedLogCategory =
  | "managed-stdout"
  | "managed-stderr"
  | "container"
  | "automation"
  | "alert"
  | "internal"
  | "system";

export type UnifiedLogEvent = {
  id: string;
  timestamp: string;
  level: UnifiedLogLevel;
  source: string;
  sourceLabel: string;
  category: UnifiedLogCategory;
  message: string;
  serviceId?: string;
  serviceName?: string;
  stream?: "stdout" | "stderr" | "system";
};

export type RuntimeSnapshot = {
  processes: ManagedProcess[];
  ports: PortBinding[];
  alerts: AlertRecord[];
  monitorMetrics: MonitorMetric[];
  monitorHistory: MonitorHistorySeries[];
  automationRules: AutomationRule[];
  automationHistory: AutomationHistoryEntry[];
  logs: UnifiedLogEvent[];
};
