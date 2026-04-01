import {
  type CSSProperties,
  startTransition,
  useEffect,
  useDeferredValue,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  ArrowUpRight,
  BellRing,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Database,
  Gauge,
  Globe,
  LayoutDashboard,
  PenSquare,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Server,
  ShieldCheck,
  Square,
  Terminal,
  Trash2,
  Waypoints,
  Workflow,
  X,
} from "lucide-react";
import {
  CandyInput,
  HologramProgress,
  PulseLineChart,
  ShinyButton,
  SignalBars,
  StatusPill,
  SugarCard,
} from "./components/ui";
import {
  type AlertRecord,
  type AlertSeverity,
  type AutomationHistoryEntry,
  type AutomationRule,
  type ManagedServiceColor,
  type ManagedServiceDraft,
  type ManagedServiceIcon,
  type ManagedServiceKind,
  type ManagedProcess,
  type ManagedServiceUpdate,
  type MonitorHistorySeries,
  type MonitorMetric,
  type PortBinding,
  type ProcessLogEntry,
  type ProcessLogLevel,
  type PortStatus,
  type ProcessStatus,
  type RuntimeSnapshot,
  type WorkspaceView,
} from "./data/runtime";
import {
  getRuntimeSourceDescriptor,
  hydrateRuntimeSnapshot,
  type RuntimeActionResult,
} from "./runtime";

type StatusFilter = "all" | "active" | "watching" | "issues";
type RuntimeStatus = "loading" | "ready" | "error";
type ProcessAction = "start" | "stop" | "restart" | "scan" | "kill";
type AlertSeverityFilter = "all" | AlertSeverity;
type AlertTimeWindow = "all" | "1h" | "24h" | "7d";

type PersistedWorkspaceState = {
  version: 1;
  preferences: {
    activeView: WorkspaceView;
    query: string;
    statusFilter: StatusFilter;
    sidebarCollapsed: boolean;
    selectedProcessId: string;
    selectedManagedServiceId: string;
    expandedProcessIds: string[];
  };
  runtime: {
    processes: ManagedProcess[];
    ports: PortBinding[];
    alerts: AlertRecord[];
    automationRules: AutomationRule[];
    automationHistory: AutomationHistoryEntry[];
    monitorHistory: MonitorHistorySeries[];
    commandState: string;
  };
};

const accent = {
  rose: "#ec4899",
  purple: "#8b5cf6",
  cyan: "#22d3ee",
  green: "#74f7b0",
  amber: "#fbbf24",
} as const;

const monitorMetricHexMap: Record<string, string> = {
  cpu: accent.amber,
  memory: accent.cyan,
  disk: accent.green,
  network: accent.purple,
  gpu: accent.rose,
};

const viewMeta: Array<{
  id: WorkspaceView;
  label: string;
  icon: typeof LayoutDashboard;
  hex: string;
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, hex: accent.rose },
  { id: "processes", label: "Processes", icon: Server, hex: accent.cyan },
  { id: "managed", label: "Managed", icon: Sparkles, hex: accent.rose },
  { id: "ports", label: "Ports", icon: Waypoints, hex: accent.purple },
  { id: "monitor", label: "Monitor", icon: Activity, hex: accent.amber },
];

const statusFilterOptions: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "watching", label: "Watching" },
  { id: "issues", label: "Issues" },
];

const alertSeverityOptions: Array<{ id: AlertSeverityFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "warning", label: "Warning" },
  { id: "info", label: "Info" },
];

const alertTimeWindowOptions: Array<{ id: AlertTimeWindow; label: string; hours: number | null }> = [
  { id: "all", label: "All Time", hours: null },
  { id: "1h", label: "1H", hours: 1 },
  { id: "24h", label: "24H", hours: 24 },
  { id: "7d", label: "7D", hours: 24 * 7 },
];

const processToneMap: Record<ProcessStatus, "online" | "warning" | "offline" | "starting"> = {
  running: "online",
  degraded: "warning",
  stopped: "offline",
  starting: "starting",
};

const processTextClassMap: Record<ProcessStatus, string> = {
  running: "text-emerald-200",
  degraded: "text-amber-200",
  stopped: "text-rose-200",
  starting: "text-cyan-200",
};

const lifecycleActionMeta: Record<
  Exclude<ProcessAction, "scan" | "kill">,
  { label: string; hex: string; icon: typeof Play }
> = {
  start: { label: "Start", hex: accent.green, icon: Play },
  stop: { label: "Stop", hex: accent.rose, icon: Square },
  restart: { label: "Restart", hex: accent.purple, icon: RefreshCw },
};

const severityToneMap: Record<AlertSeverity, "online" | "warning" | "offline"> = {
  info: "online",
  warning: "warning",
  critical: "offline",
};

const portTextClassMap: Record<PortStatus, string> = {
  bound: "text-emerald-200",
  booting: "text-cyan-200",
  standby: "text-white/58",
  conflict: "text-rose-200",
};

const panelClass = "glass-panel rounded-[34px] p-5 sm:p-6";

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const workspaceStorageKey = "mewl.workspace.v1";
const processLogTailLimit = 10;
const defaultCommandState = "Ready to manage local services, ports, and runtime pressure.";
const appIconUrl = `${import.meta.env.BASE_URL}icon.png`;

const managedServiceColorMap: Record<ManagedServiceColor, string> = {
  default: "#ffffff",
  rose: accent.rose,
  purple: accent.purple,
  cyan: accent.cyan,
  green: accent.green,
  amber: accent.amber,
};

const managedServiceColorOptions: Array<{ id: ManagedServiceColor; label: string }> = [
  { id: "default", label: "White" },
  { id: "rose", label: "Rose" },
  { id: "purple", label: "Purple" },
  { id: "cyan", label: "Cyan" },
  { id: "green", label: "Green" },
  { id: "amber", label: "Amber" },
];

const managedServiceIconMap: Record<ManagedServiceIcon, typeof Server> = {
  server: Server,
  terminal: Terminal,
  globe: Globe,
  database: Database,
  bot: Bot,
  workflow: Workflow,
  sparkles: Sparkles,
};

const managedServiceIconOptions: Array<{ id: ManagedServiceIcon; label: string }> = [
  { id: "server", label: "Server" },
  { id: "terminal", label: "Terminal" },
  { id: "globe", label: "Globe" },
  { id: "database", label: "Database" },
  { id: "bot", label: "Bot" },
  { id: "workflow", label: "Workflow" },
  { id: "sparkles", label: "Sparkles" },
];

const managedServiceKindOptions: Array<{
  id: ManagedServiceKind;
  label: string;
  detail: string;
}> = [
  {
    id: "command",
    label: "Command",
    detail: "Use for standard binaries, package scripts, workers, and local daemons.",
  },
  {
    id: "script",
    label: "Script",
    detail: "Use for exact launch and teardown scripts, including direct file paths.",
  },
  {
    id: "docker",
    label: "Docker",
    detail: "Use for Docker Compose or docker run flows with container-oriented stop behavior.",
  },
];

const managedKindBadgeMap: Record<ManagedServiceKind, string> = {
  command: "command",
  script: "script",
  docker: "docker",
};

const managedKindCopy: Record<
  ManagedServiceKind,
  {
    startLabel: string;
    stopLabel: string;
    restartLabel: string;
    startPlaceholder: string;
    stopPlaceholder: string;
    restartPlaceholder: string;
    guidance: string;
  }
> = {
  command: {
    startLabel: "Start Command",
    stopLabel: "Stop Command",
    restartLabel: "Restart Command",
    startPlaceholder: "npm run dev",
    stopPlaceholder: "Optional. Leave blank to stop by tracked pid.",
    restartPlaceholder: "Optional. Leave blank for stop/start.",
    guidance:
      "Best for package scripts, local binaries, background workers, and long-running dev servers.",
  },
  script: {
    startLabel: "Launch Script",
    stopLabel: "Teardown Script",
    restartLabel: "Restart Script",
    startPlaceholder: "./scripts/dev.sh --watch",
    stopPlaceholder: "Optional. Example: ./scripts/stop-dev.sh",
    restartPlaceholder: "Optional. Example: ./scripts/restart-dev.sh",
    guidance:
      "Direct script paths are now first-class. Mewl resolves common script extensions without requiring shell chaining.",
  },
  docker: {
    startLabel: "Docker Start Flow",
    stopLabel: "Docker Stop Flow",
    restartLabel: "Docker Restart Flow",
    startPlaceholder: "docker compose up api",
    stopPlaceholder: "Optional. Example: docker compose stop api",
    restartPlaceholder: "Optional. Example: docker compose restart api",
    guidance:
      "Use explicit Docker commands when you have them. If stop is blank, Mewl can derive a safe Docker stop flow for common compose and named-container launches.",
  },
};

const logLevelTextClassMap: Record<ProcessLogLevel, string> = {
  info: "text-emerald-200",
  debug: "text-cyan-200",
  warning: "text-amber-200",
  error: "text-rose-200",
};

const formatLogStamp = () =>
  new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());

const trimLogTail = (entries: ProcessLogEntry[]) => entries.slice(-processLogTailLimit);

const parseAlertAgeHours = (stamp: string) => {
  if (stamp === "now") {
    return 0;
  }

  const parsed = Date.parse(stamp);
  if (Number.isNaN(parsed)) {
    return Number.POSITIVE_INFINITY;
  }

  return (Date.now() - parsed) / (1000 * 60 * 60);
};

const createEmptyManagedDraft = (): ManagedServiceDraft => ({
  name: "",
  description: "",
  kind: "command",
  startCommand: "",
  stopCommand: "",
  restartCommand: "",
  cwd: ".",
  autoStart: false,
  watchPorts: true,
  restartPolicy: "manual",
  restartLimit: 3,
  titleColor: "default",
  icon: "server",
});

const createDraftFromManagedProcess = (process: ManagedProcess): ManagedServiceDraft => ({
  name: process.name,
  description: process.description,
  kind: process.kind,
  startCommand: process.startCommand ?? process.command,
  stopCommand: process.stopCommand ?? "",
  restartCommand: process.restartCommand ?? "",
  cwd: process.cwd,
  autoStart: process.autoStart,
  watchPorts: process.watchPorts,
  restartPolicy: process.restartPolicy,
  restartLimit: process.restartLimit,
  titleColor: process.titleColor ?? "default",
  icon: process.icon ?? "server",
});

const createDraftFromObservedProcess = (process: ManagedProcess): ManagedServiceDraft => ({
  name: process.name,
  description: `Managed from the observed runtime for ${process.name}.`,
  kind: process.runtime === "docker" ? "docker" : "command",
  startCommand: process.command,
  stopCommand: "",
  restartCommand: "",
  cwd: process.cwd === "unknown" ? "." : process.cwd,
  autoStart: false,
  watchPorts: process.ports.length > 0,
  restartPolicy: "manual",
  restartLimit: 3,
  titleColor: "default",
  icon:
    process.runtime === "docker"
      ? "workflow"
      : process.runtime === "browser"
        ? "globe"
        : process.runtime === "python"
          ? "bot"
          : process.runtime === "electron"
            ? "sparkles"
            : "server",
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWorkspaceView(value: unknown): value is WorkspaceView {
  return viewMeta.some((item) => item.id === value);
}

function isStatusFilter(value: unknown): value is StatusFilter {
  return statusFilterOptions.some((item) => item.id === value);
}

function readPersistedWorkspace(): PersistedWorkspaceState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(workspaceStorageKey);
  if (!rawValue) {
    return null;
  }

  const parsed: unknown = JSON.parse(rawValue);
  if (!isRecord(parsed) || parsed.version !== 1) {
    throw new Error("Saved workspace data is from an incompatible version.");
  }

  const preferences = isRecord(parsed.preferences) ? parsed.preferences : {};
  const runtime = isRecord(parsed.runtime) ? parsed.runtime : {};

  return {
    version: 1,
    preferences: {
      activeView: isWorkspaceView(preferences.activeView) ? preferences.activeView : "overview",
      query: typeof preferences.query === "string" ? preferences.query : "",
      statusFilter: isStatusFilter(preferences.statusFilter) ? preferences.statusFilter : "all",
      sidebarCollapsed:
        typeof preferences.sidebarCollapsed === "boolean" ? preferences.sidebarCollapsed : false,
      selectedProcessId:
        typeof preferences.selectedProcessId === "string" ? preferences.selectedProcessId : "",
      selectedManagedServiceId:
        typeof preferences.selectedManagedServiceId === "string"
          ? preferences.selectedManagedServiceId
          : "",
      expandedProcessIds: Array.isArray(preferences.expandedProcessIds)
        ? preferences.expandedProcessIds.filter((value): value is string => typeof value === "string")
        : [],
    },
    runtime: {
      processes: Array.isArray(runtime.processes) ? (runtime.processes as ManagedProcess[]) : [],
      ports: Array.isArray(runtime.ports) ? (runtime.ports as PortBinding[]) : [],
      alerts: Array.isArray(runtime.alerts) ? (runtime.alerts as AlertRecord[]) : [],
      automationRules: Array.isArray(runtime.automationRules)
        ? (runtime.automationRules as AutomationRule[])
        : [],
      automationHistory: Array.isArray(runtime.automationHistory)
        ? (runtime.automationHistory as AutomationHistoryEntry[])
        : [],
      monitorHistory: Array.isArray(runtime.monitorHistory)
        ? (runtime.monitorHistory as MonitorHistorySeries[])
        : [],
      commandState:
        typeof runtime.commandState === "string" ? runtime.commandState : defaultCommandState,
    },
  };
}

function writePersistedWorkspace(value: PersistedWorkspaceState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(workspaceStorageKey, JSON.stringify(value));
}

function App() {
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>("loading");
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<WorkspaceView>("overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<AlertSeverityFilter>("all");
  const [alertServiceFilter, setAlertServiceFilter] = useState("all");
  const [alertTimeWindow, setAlertTimeWindow] = useState<AlertTimeWindow>("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState("");
  const [selectedManagedServiceId, setSelectedManagedServiceId] = useState("");
  const [expandedProcessIds, setExpandedProcessIds] = useState<string[]>([]);
  const [expandedResourceDrawIds, setExpandedResourceDrawIds] = useState<string[]>([]);
  const [managedEditorMode, setManagedEditorMode] = useState<"create" | "edit">("edit");
  const [managedEditorOpen, setManagedEditorOpen] = useState(false);
  const [managedCleanupOnly, setManagedCleanupOnly] = useState(false);
  const [managedDraft, setManagedDraft] = useState<ManagedServiceDraft>(createEmptyManagedDraft);
  const [managedPrefillSourceId, setManagedPrefillSourceId] = useState("");
  const [processes, setProcesses] = useState<ManagedProcess[]>([]);
  const [ports, setPorts] = useState<PortBinding[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [monitorMetrics, setMonitorMetrics] = useState<MonitorMetric[]>([]);
  const [monitorHistory, setMonitorHistory] = useState<MonitorHistorySeries[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [automationHistory, setAutomationHistory] = useState<AutomationHistoryEntry[]>([]);
  const [commandState, setCommandState] = useState(defaultCommandState);
  const [isPending, startActionTransition] = useTransition();
  const runtimeSource = getRuntimeSourceDescriptor();
  const isLiveElectronRuntime = runtimeSource.id === "electron";
  const managedKindMeta = managedKindCopy[managedDraft.kind];

  const applyRuntimeSnapshot = (snapshot: RuntimeSnapshot) => {
    setProcesses(snapshot.processes);
    setPorts(snapshot.ports);
    setAlerts(snapshot.alerts);
    setMonitorMetrics(snapshot.monitorMetrics);
    setMonitorHistory(snapshot.monitorHistory);
    setAutomationRules(snapshot.automationRules);
    setAutomationHistory(snapshot.automationHistory);
    setSelectedProcessId((current) =>
      snapshot.processes.some((process) => process.id === current)
        ? current
        : (snapshot.processes[0]?.id ?? ""),
    );
    setSelectedManagedServiceId((current) =>
      snapshot.processes.some((process) => process.id === current && process.managed)
        ? current
        : (snapshot.processes.find((process) => process.managed)?.id ?? ""),
    );
  };

  const applyRuntimeActionResult = (result: RuntimeActionResult) => {
    applyRuntimeSnapshot(result.snapshot);
    setCommandState(result.message);
    setAlertsOpen(false);
  };

  useEffect(() => {
    let cancelled = false;

    const bootRuntime = async () => {
      setRuntimeStatus("loading");
      setRuntimeError(null);

      try {
        const snapshot = await hydrateRuntimeSnapshot();
        if (cancelled) {
          return;
        }

        const persisted = readPersistedWorkspace();
        const hydratedProcesses = snapshot.processes;
        const hydratedPorts = snapshot.ports;
        const hydratedAlerts = snapshot.alerts;
        const hydratedAutomationRules = snapshot.automationRules;
        const hydratedAutomationHistory = snapshot.automationHistory;
        const hydratedMonitorHistory = snapshot.monitorHistory;
        const fallbackSelectedProcessId =
          hydratedProcesses[0]?.id ?? snapshot.processes[0]?.id ?? "";

        setProcesses(hydratedProcesses);
        setPorts(hydratedPorts);
        setAlerts(hydratedAlerts);
        setMonitorMetrics(snapshot.monitorMetrics);
        setMonitorHistory(hydratedMonitorHistory);
        setAutomationRules(hydratedAutomationRules);
        setAutomationHistory(hydratedAutomationHistory);
        setCommandState(persisted?.runtime.commandState ?? defaultCommandState);
        setActiveView(persisted?.preferences.activeView ?? "overview");
        setQuery(persisted?.preferences.query ?? "");
        setStatusFilter(persisted?.preferences.statusFilter ?? "all");
        setSidebarCollapsed(persisted?.preferences.sidebarCollapsed ?? false);
        setExpandedProcessIds(persisted?.preferences.expandedProcessIds ?? []);
        setSelectedProcessId(
          persisted?.preferences.selectedProcessId || fallbackSelectedProcessId,
        );
        setSelectedManagedServiceId(
          persisted?.preferences.selectedManagedServiceId ||
            hydratedProcesses.find((process) => process.managed)?.id ||
            "",
        );
        setRuntimeStatus("ready");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setRuntimeStatus("error");
        setRuntimeError(
          error instanceof Error
            ? error.message
            : "Mewl could not restore the workspace session.",
        );
      }
    };

    void bootRuntime();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (runtimeStatus !== "ready") {
      return;
    }

    writePersistedWorkspace({
      version: 1,
      preferences: {
        activeView,
        query,
        statusFilter,
        sidebarCollapsed,
        selectedProcessId,
        selectedManagedServiceId,
        expandedProcessIds,
      },
      runtime: {
        processes: isLiveElectronRuntime ? [] : processes,
        ports: isLiveElectronRuntime ? [] : ports,
        alerts: isLiveElectronRuntime ? [] : alerts,
        automationRules: isLiveElectronRuntime ? [] : automationRules,
        automationHistory: isLiveElectronRuntime ? [] : automationHistory,
        monitorHistory: isLiveElectronRuntime ? [] : monitorHistory,
        commandState,
      },
    });
  }, [
    activeView,
    alerts,
    automationRules,
    automationHistory,
    monitorHistory,
    commandState,
    expandedProcessIds,
    ports,
    processes,
    query,
    runtimeStatus,
    selectedManagedServiceId,
    selectedProcessId,
    sidebarCollapsed,
    statusFilter,
  ]);

  useEffect(() => {
    if (runtimeStatus !== "ready" || selectedProcessId || processes.length === 0) {
      return;
    }

    setSelectedProcessId(processes.find((process) => process.status !== "stopped")?.id ?? "");
  }, [processes, runtimeStatus, selectedProcessId]);

  useEffect(() => {
    if (runtimeStatus !== "ready" || selectedManagedServiceId) {
      return;
    }

    setSelectedManagedServiceId(processes.find((process) => process.managed)?.id ?? "");
  }, [processes, runtimeStatus, selectedManagedServiceId]);

  useEffect(() => {
    if (!isLiveElectronRuntime || runtimeStatus !== "ready") {
      return;
    }

    const interval = window.setInterval(() => {
      void hydrateRuntimeSnapshot()
        .then((snapshot) => {
          setProcesses(snapshot.processes);
          setPorts(snapshot.ports);
          setAlerts(snapshot.alerts);
          setMonitorMetrics(snapshot.monitorMetrics);
          setMonitorHistory(snapshot.monitorHistory);
          setAutomationRules(snapshot.automationRules);
          setAutomationHistory(snapshot.automationHistory);
        })
        .catch(() => {
          // Keep the current dashboard state when a background refresh misses once.
        });
    }, 6000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isLiveElectronRuntime, runtimeStatus]);

  const deferredQuery = useDeferredValue(query);
  const searchValue = deferredQuery.trim().toLowerCase();

  const filteredProcesses = processes.filter((process) => {
    const matchesQuery = searchValue
      ? [
          process.name,
          process.group,
          process.command,
          process.cwd,
          process.runtime,
          process.ports.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchValue)
      : true;

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? process.status !== "stopped"
          : statusFilter === "watching"
            ? process.watchPorts
            : process.status === "degraded" ||
              process.status === "stopped" ||
              process.status === "starting";

    return matchesQuery && matchesStatus;
  });

  const filteredPorts = ports.filter((port) =>
    searchValue
      ? [port.port, port.protocol, port.service, port.target, port.note]
          .join(" ")
          .toLowerCase()
          .includes(searchValue)
      : true,
  );
  const liveProcesses = filteredProcesses.filter((process) => process.status !== "stopped");
  const managedServices = filteredProcesses.filter((process) => process.managed);

  const selectedProcess =
    liveProcesses.find((process) => process.id === selectedProcessId) ??
    processes.find((process) => process.id === selectedProcessId) ??
    liveProcesses[0] ??
    processes.find((process) => process.status !== "stopped") ??
    null;
  const selectedManagedService =
    managedServices.find((process) => process.id === selectedManagedServiceId) ??
    processes.find((process) => process.id === selectedManagedServiceId && process.managed) ??
    managedServices[0] ??
    processes.find((process) => process.managed) ??
    null;
  const managedPrefillSource =
    managedPrefillSourceId.length > 0
      ? processes.find((process) => process.id === managedPrefillSourceId && !process.managed) ?? null
      : null;
  const managedServicesNeedingReview = managedServices.filter(
    (process) => process.review?.needsReview,
  );
  const visibleManagedServices = managedCleanupOnly
    ? managedServicesNeedingReview
    : managedServices;
  const canControlProcess = (process: ManagedProcess | null) =>
    runtimeStatus === "ready" && Boolean(process?.managed);

  const selectedPorts = selectedProcess
    ? ports.filter((port) => port.serviceId === selectedProcess.id)
    : [];

  const activeCount = processes.filter((process) => process.status !== "stopped").length;
  const degradedCount = processes.filter(
    (process) => process.status === "degraded" || process.status === "starting",
  ).length;
  const watchedCount = processes.filter((process) => process.watchPorts).length;
  const openPortCount = ports.filter((port) => port.status !== "standby").length;
  const conflictCount = ports.filter((port) => port.status === "conflict").length;
  const publicPortCount = ports.filter(
    (port) => port.exposure === "public" && port.status !== "standby",
  ).length;
  const autoStartCount = processes.filter((process) => process.autoStart).length;
  const hostCpu = monitorMetrics.find((metric) => metric.id === "cpu")?.value ?? 0;
  const hostMemory = monitorMetrics.find((metric) => metric.id === "memory")?.value ?? 0;
  const hostDisk = monitorMetrics.find((metric) => metric.id === "disk")?.value ?? 0;
  const hostNetwork = monitorMetrics.find((metric) => metric.id === "network")?.value ?? 0;
  const hostGpuMetric =
    monitorMetrics.find((metric) => metric.id === "gpu") ?? null;
  const hostGpu = hostGpuMetric?.value ?? 0;
  const monitorTrendCards = monitorHistory.filter((series) => series.id !== "gpu");
  const gpuTrendSeries = monitorHistory.find((series) => series.id === "gpu") ?? null;
  const busiestProcesses = [...processes]
    .sort((left, right) => right.cpu + right.memory / 20 - (left.cpu + left.memory / 20))
    .slice(0, 4);
  const previewProcesses = liveProcesses.slice(0, 4);
  const previewPorts = filteredPorts.filter((port) => port.status !== "standby").slice(0, 4);
  const dashboardMetrics = monitorMetrics.slice(0, 3);
  const activeRestartPolicyCount = processes.filter(
    (process) => process.managed && process.restartPolicy !== "manual",
  ).length;
  const alertServiceOptions = Array.from(
    new Set(alerts.map((item) => item.serviceName).filter((value): value is string => Boolean(value))),
  );
  const selectedAlertTimeWindow = alertTimeWindowOptions.find((option) => option.id === alertTimeWindow);
  const filteredAlerts = alerts.filter((item) => {
    const matchesSeverity =
      alertSeverityFilter === "all" ? true : item.severity === alertSeverityFilter;
    const matchesService =
      alertServiceFilter === "all" ? true : item.serviceName === alertServiceFilter;
    const matchesTimeWindow =
      selectedAlertTimeWindow?.hours == null
        ? true
        : parseAlertAgeHours(item.stamp) <= selectedAlertTimeWindow.hours;

    return matchesSeverity && matchesService && matchesTimeWindow;
  });
  const runtimeIndicatorTone =
    runtimeStatus === "ready"
      ? "online"
      : runtimeStatus === "error"
        ? "offline"
        : "starting";

  const restoreDefaultWorkspace = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(workspaceStorageKey);
    }

    setQuery("");
    setStatusFilter("all");
    setSidebarCollapsed(false);
    setExpandedProcessIds([]);
    setManagedCleanupOnly(false);
    setManagedEditorOpen(false);
    setAlertsOpen(false);
    setAlertSeverityFilter("all");
    setAlertServiceFilter("all");
    setAlertTimeWindow("all");
    setManagedEditorMode("edit");
    setManagedDraft(createEmptyManagedDraft());
    setManagedPrefillSourceId("");
    setAutomationHistory([]);
    setMonitorHistory([]);

    void hydrateRuntimeSnapshot()
      .then((snapshot) => {
        setProcesses(snapshot.processes);
        setPorts(snapshot.ports);
        setAlerts(snapshot.alerts);
        setMonitorMetrics(snapshot.monitorMetrics);
        setMonitorHistory(snapshot.monitorHistory);
        setAutomationRules(snapshot.automationRules);
        setAutomationHistory(snapshot.automationHistory);
        setCommandState(defaultCommandState);
        setActiveView("overview");
        setSelectedProcessId(snapshot.processes[0]?.id ?? "");
        setSelectedManagedServiceId(snapshot.processes.find((process) => process.managed)?.id ?? "");
        setRuntimeError(null);
        setRuntimeStatus("ready");
      })
      .catch((error) => {
        setRuntimeStatus("error");
        setRuntimeError(
          error instanceof Error
            ? error.message
            : "Mewl could not reconnect to the Electron desktop bridge.",
        );
      });
  };

  useEffect(() => {
    if (managedEditorMode === "create") {
      return;
    }

    if (!managedEditorOpen) {
      return;
    }

    if (selectedManagedService) {
      setManagedDraft(createDraftFromManagedProcess(selectedManagedService));
      setManagedPrefillSourceId("");
      return;
    }

    setManagedDraft(createEmptyManagedDraft());
    setManagedPrefillSourceId("");
  }, [managedEditorMode, managedEditorOpen, selectedManagedServiceId]);

  useEffect(() => {
    if (!managedEditorOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setManagedEditorOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [managedEditorOpen]);

  const createProcessLogEntry = (level: ProcessLogLevel, text: string): ProcessLogEntry => ({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    stamp: formatLogStamp(),
    level,
    text,
  });

  const appendProcessLogs = (processId: string, entries: Array<ProcessLogEntry & { stream: "stdout" | "stderr" }>) => {
    setProcesses((current) =>
      current.map((process) => {
        if (process.id !== processId) {
          return process;
        }

        const stdoutEntries = entries
          .filter((entry) => entry.stream === "stdout")
          .map(({ stream: _stream, ...entry }) => entry);
        const stderrEntries = entries
          .filter((entry) => entry.stream === "stderr")
          .map(({ stream: _stream, ...entry }) => entry);

        return {
          ...process,
          logs: {
            stdout: trimLogTail([...process.logs.stdout, ...stdoutEntries]),
            stderr: trimLogTail([...process.logs.stderr, ...stderrEntries]),
          },
        };
      }),
    );
  };

  const pushAlert = ({
    title,
    detail,
    severity,
    stamp,
    serviceId,
    serviceName,
    category,
  }: Omit<AlertRecord, "id">) => {
    setAlerts((current) => [
      {
        id: `alert-${Date.now()}`,
        title,
        detail,
        severity,
        stamp,
        serviceId,
        serviceName,
        category,
      },
      ...current,
    ].slice(0, 6));
  };

  const changeView = (nextView: WorkspaceView) => {
    startTransition(() => {
      setActiveView(nextView);
      setAlertsOpen(false);
    });
  };

  const toggleProcessExpanded = (processId: string) => {
    setExpandedProcessIds((current) =>
      current.includes(processId)
        ? current.filter((id) => id !== processId)
        : [...current, processId],
    );
  };

  const toggleResourceDrawExpanded = (processId: string) => {
    setExpandedResourceDrawIds((current) =>
      current.includes(processId)
        ? current.filter((id) => id !== processId)
        : [...current, processId],
    );
  };

  const handleProcessAction = (
    action: ProcessAction,
    processOverride?: ManagedProcess | null,
  ) => {
    if (runtimeStatus !== "ready") {
      return;
    }

    const targetProcess = processOverride ?? selectedProcess;

    if (isLiveElectronRuntime) {
      const hostAction = window.mewlHost?.performProcessAction;

      if (!hostAction) {
        setCommandState("The Electron bridge is missing its lifecycle action handler.");
        return;
      }

      if (action === "kill") {
        if (!targetProcess) {
          setCommandState("Choose an observed process before requesting a live kill action.");
          return;
        }

        if (targetProcess.managed) {
          setCommandState(
            "Kill is reserved for observed live processes. Use the managed service controls for saved services.",
          );
          return;
        }

        if (targetProcess.pid === null) {
          setCommandState("That observed process no longer has a live pid to terminate.");
          return;
        }

        setCommandState(
          `Terminating observed process ${targetProcess.name} (pid ${targetProcess.pid}) from the Electron bridge.`,
        );

        startActionTransition(async () => {
          try {
            const result: RuntimeActionResult = await hostAction(action, targetProcess.id);
            applyRuntimeActionResult(result);
          } catch (error) {
            setCommandState(
              error instanceof Error
                ? error.message
                : "The Electron bridge could not terminate that observed process.",
            );
          }
        });

        return;
      }

      if (action !== "scan" && !targetProcess?.managed) {
        setCommandState(
          "Only services registered in mewl.services.json can be started, stopped, or restarted.",
        );
        return;
      }

      setCommandState(
        action === "scan"
          ? "Refreshing live host services, bindings, and telemetry from Electron."
          : `${
              action === "start"
                ? "Starting"
                : action === "stop"
                  ? "Stopping"
                  : "Restarting"
            } ${targetProcess?.name ?? "service"} from the Electron bridge.`,
      );

      startActionTransition(async () => {
        try {
          const result: RuntimeActionResult = await hostAction(action, targetProcess?.id ?? "");
          applyRuntimeActionResult(result);
          if (targetProcess) {
            setSelectedProcessId(targetProcess.id);
          }
        } catch (error) {
          setCommandState(
            error instanceof Error ? error.message : "The Electron bridge could not complete that action.",
          );
        }
      });

      return;
    }

    if (action === "scan") {
      setCommandState("Scanning watched bindings and reserved ranges.");

      if (targetProcess) {
        appendProcessLogs(targetProcess.id, [
          {
            ...createProcessLogEntry("debug", "Port scan requested from the command strip."),
            stream: "stdout",
          },
        ]);
      }

      startActionTransition(async () => {
        await delay(320);

        if (targetProcess) {
          appendProcessLogs(targetProcess.id, [
            conflictCount > 0
              ? {
                  ...createProcessLogEntry(
                    "warning",
                    `Watch scan still sees ${conflictCount} binding issue${conflictCount === 1 ? "" : "s"} in the reserved range.`,
                  ),
                  stream: "stderr",
                }
              : {
                  ...createProcessLogEntry(
                    "info",
                    "Watch scan cleared the reserved bindings with no new collisions.",
                  ),
                  stream: "stdout",
                },
          ]);
        }

        pushAlert({
          title: conflictCount > 0 ? "Port scan found drift" : "Port scan complete",
          detail:
            conflictCount > 0
              ? `${conflictCount} binding needs attention before the next restart.`
              : "No collisions were found in the reserved local range.",
          severity: conflictCount > 0 ? "warning" : "info",
          stamp: "now",
        });
        setCommandState(
          conflictCount > 0
            ? "Port scan finished with collisions to resolve."
            : "Port scan finished cleanly.",
        );
      });
      return;
    }

    if (action === "kill") {
      setCommandState("Observed process termination is only available from the Electron desktop bridge.");
      return;
    }

    if (!targetProcess) {
      return;
    }

    if (action === "start" && targetProcess.status === "running") {
      setCommandState(`${targetProcess.name} is already live.`);
      pushAlert({
        title: "No launch needed",
        detail: `${targetProcess.name} was already running when the launch command was issued.`,
        severity: "info",
        stamp: "now",
      });
      return;
    }

    if (action === "stop" && targetProcess.status === "stopped") {
      setCommandState(`${targetProcess.name} is already stopped.`);
      return;
    }

    const nextPid = (targetProcess.pid ?? 4200) + 17;
    const processConflictCount = ports.filter(
      (port) => port.serviceId === targetProcess.id && port.status === "conflict",
    ).length;

    appendProcessLogs(targetProcess.id, [
      {
        ...createProcessLogEntry(
          action === "restart" ? "warning" : "info",
          action === "start"
            ? "Boot request accepted by the managed runtime bridge."
            : action === "stop"
              ? "Graceful shutdown request queued from the command strip."
              : "Restart request queued and the process is entering the drain window.",
        ),
        stream: "stdout",
      },
    ]);

    setCommandState(
      action === "start"
        ? `Starting ${targetProcess.name}...`
        : action === "stop"
          ? `Stopping ${targetProcess.name}...`
          : `Restarting ${targetProcess.name}...`,
    );

    startActionTransition(async () => {
      setProcesses((current) =>
        current.map((process) => {
          if (process.id !== targetProcess.id) {
            return process;
          }

          if (action === "stop") {
            return {
              ...process,
              status: "stopped",
              pid: null,
              cpu: 0,
              memory: 72,
              network: 0,
              uptime: "stopped",
              lastExit: "Stopped from Mewl",
              lastHeartbeat: "idle",
            };
          }

          return {
            ...process,
            status: "starting",
            pid: nextPid,
            uptime: "booting",
            lastHeartbeat: "booting",
          };
        }),
      );

      setPorts((current) =>
        current.map((port) =>
          port.serviceId === targetProcess.id
            ? {
                ...port,
                status: action === "stop" ? "standby" : "booting",
              }
            : port,
        ),
      );

      await delay(420);

      setProcesses((current) =>
        current.map((process) => {
          if (process.id !== targetProcess.id) {
            return process;
          }

          if (action === "stop") {
            return {
              ...process,
              lastHeartbeat: "idle",
            };
          }

          return {
            ...process,
            status: "running",
            pid: nextPid,
            cpu: Math.max(8, process.cpu - 4),
            memory: Math.max(120, process.memory - 32),
            network: Math.max(0, process.network - 3),
            uptime: "just now",
            restarts: action === "restart" ? process.restarts + 1 : process.restarts,
            lastExit:
              action === "restart"
                ? "Graceful restart triggered from Mewl"
                : process.lastExit,
            lastHeartbeat: "just now",
          };
        }),
      );

      setPorts((current) =>
        current.map((port) =>
          port.serviceId === targetProcess.id
            ? {
                ...port,
                status: action === "stop" ? "standby" : "bound",
              }
            : port,
        ),
      );

      appendProcessLogs(targetProcess.id, [
        {
          ...createProcessLogEntry(
            "info",
            action === "start"
              ? `Process boot completed and pid ${nextPid} is now being tracked.`
              : action === "stop"
                ? "Process drained successfully and watched bindings were parked."
                : `Restart finished and pid ${nextPid} is now serving traffic.`,
          ),
          stream: "stdout",
        },
        ...(action !== "stop" && processConflictCount > 0
          ? [
              {
                ...createProcessLogEntry(
                  "warning",
                  `Binding watch still reports ${processConflictCount} conflict${processConflictCount === 1 ? "" : "s"} after the lifecycle action.`,
                ),
                stream: "stderr" as const,
              },
            ]
          : []),
      ]);

      pushAlert({
        title:
          action === "start"
            ? `${targetProcess.name} launched`
            : action === "stop"
              ? `${targetProcess.name} stopped`
              : `${targetProcess.name} restarted`,
        detail:
          action === "start"
            ? "Service boot completed and watched ports were rebound."
            : action === "stop"
              ? "Ports were parked and the process was taken out of rotation."
              : "Lifecycle action completed and bindings were restored.",
        severity: "info",
        stamp: "now",
      });
      setCommandState(
        action === "start"
          ? `${targetProcess.name} is running.`
          : action === "stop"
            ? `${targetProcess.name} is stopped.`
            : `${targetProcess.name} restart completed.`,
      );
    });
  };

  const renderManagedLifecycleIcons = (process: ManagedProcess) => (
    <div className="flex items-center gap-2">
      {(["start", "stop", "restart"] as const).map((action) => {
        const { label, hex, icon } = lifecycleActionMeta[action];
        return renderManagedActionButton({
          label,
          icon,
          hex,
          disabled: !canControlProcess(process) || isPending || runtimeStatus !== "ready",
          onClick: () => {
            setSelectedManagedServiceId(process.id);
            handleProcessAction(action, process);
          },
        });
      })}
    </div>
  );

  const renderProcessOwnershipTag = (process: ManagedProcess) => (
    <span className="rounded-full border border-white/8 bg-black/18 px-3 py-1 text-[0.68rem] uppercase tracking-[0.2em] text-white/48">
      {process.managed ? "managed" : "observed"}
    </span>
  );

  const renderManagedReviewTag = (process: ManagedProcess) =>
    process.review?.needsReview ? (
      <span className="rounded-full border border-amber-300/18 bg-amber-400/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.2em] text-amber-100/76">
        needs cleanup
      </span>
    ) : null;

  const renderManagedKindTag = (process: ManagedProcess) =>
    process.managed ? (
      <span className="rounded-full border border-white/8 bg-black/18 px-3 py-1 text-[0.68rem] uppercase tracking-[0.2em] text-white/48">
        {managedKindBadgeMap[process.kind]}
      </span>
    ) : null;

  const focusManagedServiceFromSnapshot = (snapshot: RuntimeSnapshot, processId: string) => {
    const matchedProcess =
      snapshot.processes.find((item) => item.id === processId && item.managed) ??
      snapshot.processes.find((item) => item.managed) ??
      null;

    if (matchedProcess) {
      setSelectedManagedServiceId(matchedProcess.id);
      setManagedEditorMode("edit");
    }
  };

  const openManagedCreateModal = (prefillSource?: ManagedProcess | null) => {
    setManagedEditorMode("create");
    setSelectedManagedServiceId("");
    setManagedPrefillSourceId(prefillSource?.id ?? "");
    setManagedDraft(prefillSource ? createDraftFromObservedProcess(prefillSource) : createEmptyManagedDraft());
    if (prefillSource) {
      setSelectedProcessId(prefillSource.id);
    }
    setManagedEditorOpen(true);
  };

  const openManagedEditModal = (process: ManagedProcess) => {
    setManagedEditorMode("edit");
    setSelectedManagedServiceId(process.id);
    setSelectedProcessId(process.id);
    setManagedPrefillSourceId("");
    setManagedEditorOpen(true);
  };

  const beginManagedDraftFromObservedProcess = (process: ManagedProcess) => {
    if (process.managed) {
      setCommandState("That process is already managed. Open it from the Managed workspace to edit the saved definition.");
      changeView("managed");
      openManagedEditModal(process);
      return;
    }

    openManagedCreateModal(process);
    changeView("managed");
    setCommandState(
      `Prefilled a managed draft from observed process ${process.name}. Review the commands before saving it to Mewl.`,
    );
  };

  const saveManagedDraft = () => {
    if (runtimeStatus !== "ready") {
      return;
    }

    if (!managedDraft.name.trim()) {
      setCommandState("Managed services need a name before they can be saved.");
      return;
    }

    if (!managedDraft.startCommand.trim()) {
      setCommandState(
        managedDraft.kind === "script"
          ? "Script-based services need a launch script or command before they can be saved."
          : managedDraft.kind === "docker"
            ? "Docker-managed services need a start flow before they can be saved."
            : "Managed services need a start command before they can be saved.",
      );
      return;
    }

    if (!managedDraft.cwd.trim()) {
      setCommandState("Managed services need a working directory before they can be saved.");
      return;
    }

    if (isLiveElectronRuntime) {
      const createManagedService = window.mewlHost?.createManagedService;
      const updateManagedService = window.mewlHost?.updateManagedService;

      if (
        (managedEditorMode === "create" && !createManagedService) ||
        (managedEditorMode === "edit" && !updateManagedService)
      ) {
        setCommandState("The Electron bridge is missing its managed-service editor handlers.");
        return;
      }

      startActionTransition(async () => {
        try {
          const result =
            managedEditorMode === "create"
              ? await createManagedService?.(managedDraft)
              : await updateManagedService?.(selectedManagedServiceId, managedDraft);

          if (!result) {
            setCommandState("The desktop bridge did not return a managed-service result.");
            return;
          }

          applyRuntimeSnapshot(result.snapshot);
          setCommandState(result.message);
          setAlertsOpen(false);
          setManagedPrefillSourceId("");
          focusManagedServiceFromSnapshot(
            result.snapshot,
            managedEditorMode === "create"
              ? result.snapshot.processes.find(
                  (item) =>
                    item.managed &&
                    item.name === managedDraft.name &&
                    item.command === managedDraft.startCommand,
                )?.id ?? selectedManagedServiceId
              : selectedManagedServiceId,
          );
          setManagedEditorOpen(false);
        } catch (error) {
          setCommandState(
            error instanceof Error
              ? error.message
              : "The desktop bridge could not save the managed service.",
          );
        }
      });
      return;
    }

    setCommandState("Managed services can only be edited from the Electron desktop bridge.");
  };

  const confirmManagedReview = (processId: string) => {
    if (runtimeStatus !== "ready") {
      return;
    }

    if (isLiveElectronRuntime) {
      const updateManagedService = window.mewlHost?.updateManagedService;

      if (!updateManagedService) {
        setCommandState("The Electron bridge is missing its managed-service editor handlers.");
        return;
      }

      startActionTransition(async () => {
        try {
          const result = await updateManagedService(processId, {
            clearReview: true,
          } satisfies ManagedServiceUpdate);
          applyRuntimeActionResult(result);
          focusManagedServiceFromSnapshot(result.snapshot, processId);
        } catch (error) {
          setCommandState(
            error instanceof Error
              ? error.message
              : "The desktop bridge could not confirm that cleanup review.",
          );
        }
      });
      return;
    }

    setCommandState("Managed cleanup review can only be confirmed from the Electron desktop bridge.");
  };

  const removeManagedDraft = () => {
    if (runtimeStatus !== "ready" || !selectedManagedServiceId) {
      return;
    }

    if (isLiveElectronRuntime) {
      const removeManagedService = window.mewlHost?.removeManagedService;

      if (!removeManagedService) {
        setCommandState("The Electron bridge is missing its managed-service removal handler.");
        return;
      }

      startActionTransition(async () => {
        try {
          const result = await removeManagedService(selectedManagedServiceId);
          applyRuntimeActionResult(result);
          setManagedEditorMode("create");
          setManagedDraft(createEmptyManagedDraft());
          setManagedEditorOpen(false);
        } catch (error) {
          setCommandState(
            error instanceof Error
              ? error.message
              : "The desktop bridge could not remove the managed service.",
          );
        }
      });
      return;
    }

    setCommandState("Managed services can only be removed from the Electron desktop bridge.");
  };

  const renderManagedActionButton = ({
    label,
    icon: Icon,
    hex,
    onClick,
    disabled = false,
  }: {
    label: string;
    icon: typeof Play;
    hex: string;
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="grid size-10 place-items-center rounded-[18px] border border-white/10 bg-black/18 text-white/70 transition duration-300 hover:-translate-y-0.5 hover:border-white/18 hover:text-white disabled:cursor-not-allowed disabled:opacity-55"
      style={{ boxShadow: `0 0 28px ${hex}18` }}
      disabled={disabled}
    >
      <Icon size={16} />
    </button>
  );

  const renderObservedActions = (process: ManagedProcess, compact = false) => {
    if (process.managed) {
      return null;
    }

    return (
      <div className={`flex flex-wrap items-center gap-3 ${compact ? "" : "mt-5"}`}>
        <ShinyButton
          label="Create Managed Draft"
          hex={accent.rose}
          icon={Sparkles}
          subtle
          onClick={() => beginManagedDraftFromObservedProcess(process)}
          disabled={runtimeStatus !== "ready"}
        />
        <ShinyButton
          label="Kill Observed PID"
          hex={accent.rose}
          icon={Trash2}
          subtle
          onClick={() => handleProcessAction("kill", process)}
          disabled={isPending || runtimeStatus !== "ready" || process.pid === null}
        />
      </div>
    );
  };

  const toggleRule = (ruleId: string, nextValue: boolean) => {
    const rule = automationRules.find((item) => item.id === ruleId);

    if (isLiveElectronRuntime) {
      const applyAutomationRule = window.mewlHost?.applyAutomationRule;

      if (!applyAutomationRule) {
        setCommandState("This automation toggle is not wired to a live desktop setting yet.");
        return;
      }

      startActionTransition(async () => {
        try {
          const result = await applyAutomationRule(ruleId, nextValue);
          applyRuntimeActionResult(result);
        } catch (error) {
          setCommandState(
            error instanceof Error ? error.message : "The desktop bridge could not save that rule.",
          );
        }
      });
      return;
    }

    setAutomationRules((current) =>
      current.map((item) => (item.id === ruleId ? { ...item, enabled: nextValue } : item)),
    );
    if (rule) {
      setCommandState(`${nextValue ? "Enabled" : "Disabled"} ${rule.title.toLowerCase()}.`);
    }
  };

  const renderStatePanel = ({
    eyebrow,
    title,
    detail,
    hex,
    icon: Icon,
    actionLabel,
    onAction,
  }: {
    eyebrow: string;
    title: string;
    detail: string;
    hex: string;
    icon: typeof Terminal;
    actionLabel?: string;
    onAction?: () => void;
  }) => (
    <section className={panelClass}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.24em] text-white/42">{eyebrow}</p>
          <h3 className="mt-3 text-3xl font-semibold text-white">{title}</h3>
          <p className="mt-3 max-w-xl text-sm text-white/58">{detail}</p>
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/72 transition duration-300 hover:border-white/18 hover:text-white"
              style={{ boxShadow: `0 18px 48px -34px ${hex}` }}
            >
              {actionLabel}
              <ArrowUpRight size={14} />
            </button>
          ) : null}
        </div>

        <div
          className="grid size-16 shrink-0 place-items-center rounded-[24px] border border-white/10 bg-black/18"
          style={{ boxShadow: `0 0 32px ${hex}22`, color: hex }}
        >
          <Icon size={24} />
        </div>
      </div>
    </section>
  );

  const renderAlertFeed = () => (
    <div className="space-y-2">
      <div className="rounded-[22px] border border-white/8 bg-[#10151c]/92 p-3">
        <div className="flex flex-wrap gap-2">
          {alertSeverityOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setAlertSeverityFilter(option.id)}
              className={`rounded-full border px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] transition duration-300 ${
                alertSeverityFilter === option.id
                  ? "border-white/14 bg-black/26 text-white"
                  : "border-white/8 bg-black/18 text-white/42 hover:text-white/72"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            value={alertServiceFilter}
            onChange={(event) => setAlertServiceFilter(event.target.value)}
            className="rounded-full border border-white/8 bg-black/18 px-3 py-2 text-[0.68rem] uppercase tracking-[0.22em] text-white/72 outline-none"
          >
            <option value="all">All Services</option>
            {alertServiceOptions.map((serviceName) => (
              <option key={serviceName} value={serviceName}>
                {serviceName}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2">
            {alertTimeWindowOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setAlertTimeWindow(option.id)}
                className={`rounded-full border px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] transition duration-300 ${
                  alertTimeWindow === option.id
                    ? "border-white/14 bg-black/26 text-white"
                    : "border-white/8 bg-black/18 text-white/42 hover:text-white/72"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="rounded-[22px] border border-white/8 bg-[#10151c]/92 px-4 py-5">
          <p className="text-sm font-semibold text-white/86">No fresh alerts</p>
          <p className="mt-2 text-sm text-white/52">
            The current alert filters do not match any items in the latest runtime feed.
          </p>
        </div>
      ) : null}
      {filteredAlerts.map((item, index) => (
        <article
          key={item.id}
          className="rounded-[22px] border border-white/8 bg-[#10151c]/92 px-4 py-3"
          style={
            index === 0
              ? ({
                  boxShadow: `0 18px 42px -34px ${
                    item.severity === "critical"
                      ? accent.rose
                      : item.severity === "warning"
                        ? accent.amber
                        : accent.cyan
                  }`,
                } satisfies CSSProperties)
              : undefined
          }
        >
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <StatusPill tone={severityToneMap[item.severity]} label={item.severity} />
                <p className="text-xs uppercase tracking-[0.22em] text-white/32">{item.stamp}</p>
                {item.serviceName ? (
                  <p className="text-xs uppercase tracking-[0.22em] text-white/32">
                    {item.serviceName}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90">{item.title}</p>
                <p className="mt-1 text-sm text-white/54">{item.detail}</p>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  const renderInspector = () => {
    if (!selectedProcess) {
      return null;
    }

    const stdoutEntries = [...selectedProcess.logs.stdout].reverse();
    const stderrEntries = [...selectedProcess.logs.stderr].reverse();

    return (
      <section className={panelClass}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/42">Inspector</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">{selectedProcess.name}</h3>
          </div>
          <div className="grid size-11 place-items-center rounded-[20px] border border-white/10 bg-black/18">
            <ShieldCheck size={20} className="text-violet-300" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusPill tone={processToneMap[selectedProcess.status]} label={selectedProcess.status} />
          {renderProcessOwnershipTag(selectedProcess)}
          {renderManagedKindTag(selectedProcess)}
          <span className="rounded-full border border-white/8 bg-black/18 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/48">
            pid {selectedProcess.pid ?? "none"}
          </span>
        </div>

        <p className="mt-4 text-sm text-white/56">{selectedProcess.description}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Runtime", selectedProcess.runtime],
            ["Uptime", selectedProcess.uptime],
            ["Restarts", `${selectedProcess.restarts}`],
            ["Last Pulse", selectedProcess.lastHeartbeat],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[22px] border border-white/8 bg-black/18 px-4 py-4">
              <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">{label}</p>
              <p className="mt-2 text-sm font-medium text-white/86">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[24px] border border-white/8 bg-[#0f141b]/94 p-4">
          <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">Last Exit</p>
          <p className="mt-2 text-sm text-white/76">{selectedProcess.lastExit}</p>
        </div>

        <div className="mt-5 rounded-[24px] border border-white/8 bg-[#0f141b]/94 p-4">
          <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">Launch Command</p>
          <p className="mt-2 font-mono text-sm text-white/80">{selectedProcess.command}</p>
          <p className="mt-3 font-mono text-xs text-white/42">{selectedProcess.cwd}</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {selectedPorts.length > 0 ? (
            selectedPorts.map((port) => (
              <span
                key={port.id}
                className="rounded-full border border-white/8 bg-black/18 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/58"
              >
                {port.port} {port.protocol}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-white/8 bg-black/18 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/48">
              no ports reserved
            </span>
          )}
        </div>

        {!selectedProcess.managed ? (
          <div className="mt-5 rounded-[24px] border border-rose-400/16 bg-rose-500/8 p-4">
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-rose-100/72">
              Observed Only
            </p>
            <p className="mt-2 text-sm text-white/62">
              This row reflects a live host process. Creating a managed draft will prefill the
              editor from what Mewl can observe right now, while kill will terminate the current
              pid without changing the managed catalog.
            </p>
            {renderObservedActions(selectedProcess)}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <HologramProgress label="CPU Pressure" value={selectedProcess.cpu} hex={accent.amber} />
          <HologramProgress
            label="Memory Footprint"
            value={Math.min(100, Math.round((selectedProcess.memory / 1200) * 100))}
            hex={accent.cyan}
          />
          <HologramProgress
            label="Network Load"
            value={Math.min(100, selectedProcess.network * 2)}
            hex={accent.green}
          />
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div className="rounded-[26px] border border-white/8 bg-[#0f141b]/94 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">stdout</p>
                <p className="mt-2 text-lg font-semibold text-white">Recent output</p>
              </div>
              <Terminal size={18} className="text-emerald-300" />
            </div>

            <div className="mt-4 space-y-3">
              {stdoutEntries.length > 0 ? (
                stdoutEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[20px] border border-white/8 bg-black/24 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-white/34">
                        {entry.stamp}
                      </p>
                      <p
                        className={`text-[0.68rem] font-semibold uppercase tracking-[0.2em] ${logLevelTextClassMap[entry.level]}`}
                      >
                        {entry.level}
                      </p>
                    </div>
                    <p className="mt-2 font-mono text-sm text-white/78">{entry.text}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-white/10 bg-black/18 px-4 py-5 text-sm text-white/48">
                  No stdout lines have been recorded for this process yet.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[26px] border border-white/8 bg-[#0f141b]/94 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">stderr</p>
                <p className="mt-2 text-lg font-semibold text-white">Recent issues</p>
              </div>
              <Terminal size={18} className="text-rose-300" />
            </div>

            <div className="mt-4 space-y-3">
              {stderrEntries.length > 0 ? (
                stderrEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[20px] border border-white/8 bg-black/24 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-white/34">
                        {entry.stamp}
                      </p>
                      <p
                        className={`text-[0.68rem] font-semibold uppercase tracking-[0.2em] ${logLevelTextClassMap[entry.level]}`}
                      >
                        {entry.level}
                      </p>
                    </div>
                    <p className="mt-2 font-mono text-sm text-white/78">{entry.text}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[20px] border border-dashed border-white/10 bg-black/18 px-4 py-5 text-sm text-white/48">
                  No stderr lines are waiting right now.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderOverview = () => (
    <>
      <section className="grid gap-4 xl:grid-cols-3">
        <SugarCard
          title="Services"
          value={`${activeCount}/${processes.length}`}
          detail={`${degradedCount} need attention`}
          hex={accent.green}
          icon={Server}
          status={degradedCount > 0 ? "warning" : "online"}
        />
        <SugarCard
          title="Open Ports"
          value={`${openPortCount}`}
          detail={`${publicPortCount} public bindings`}
          hex={accent.cyan}
          icon={Waypoints}
          status={conflictCount > 0 ? "warning" : "online"}
        />
        <SugarCard
          title="Watchers"
          value={`${watchedCount}`}
          detail={`${autoStartCount} autostart enabled`}
          hex={accent.purple}
          icon={ShieldCheck}
          status="online"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className={`${panelClass} flex h-full flex-col`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/42">Processes</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Running Now</h3>
            </div>
            <StatusPill tone="online" label={`${previewProcesses.length} shown`} />
          </div>

          <div className="mt-5 flex-1 space-y-3">
            {previewProcesses.length > 0 ? (
              previewProcesses.map((process) => (
                <button
                  key={process.id}
                  type="button"
                  onClick={() => {
                    setSelectedProcessId(process.id);
                    changeView("processes");
                  }}
                  className="w-full rounded-[24px] border border-white/8 bg-[#0f141b]/94 px-4 py-4 text-left transition duration-300 hover:border-white/12 hover:bg-white/[0.03]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white/88">{process.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/34">
                        {process.command}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusPill tone={processToneMap[process.status]} label={process.status} />
                      {renderProcessOwnershipTag(process)}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">Ports</p>
                      <p className="mt-2 text-white/84">
                        {process.ports.length > 0 ? process.ports.join(", ") : "none"}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">CPU</p>
                      <p className="mt-2 text-white/84">{process.cpu}%</p>
                    </div>
                    <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">Memory</p>
                      <p className="mt-2 text-white/84">{process.memory} MB</p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/18 px-4 py-6 text-sm text-white/50">
                No processes match the current workspace filters yet.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => changeView("processes")}
            className="mt-4 inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70 transition duration-300 hover:border-white/18 hover:text-white"
          >
            See all
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className={`${panelClass} flex h-full flex-col`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/42">Bindings</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Port Watch</h3>
            </div>
            <StatusPill tone={conflictCount > 0 ? "warning" : "online"} label={`${previewPorts.length} shown`} />
          </div>

          <div className="mt-5 flex-1 space-y-3">
            {previewPorts.length > 0 ? (
              previewPorts.map((port) => (
                <button
                  key={port.id}
                  type="button"
                  onClick={() => changeView("ports")}
                  className="w-full rounded-[24px] border border-white/8 bg-[#0f141b]/94 px-4 py-4 text-left transition duration-300 hover:border-white/12 hover:bg-white/[0.03]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white/88">{port.port}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/34">
                        {port.service}
                      </p>
                    </div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${portTextClassMap[port.status]}`}>
                      {port.status}
                    </p>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">Proto</p>
                      <p className="mt-2 text-white/84 uppercase">{port.protocol}</p>
                    </div>
                    <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">Exposure</p>
                      <p className="mt-2 capitalize text-white/84">{port.exposure}</p>
                    </div>
                    <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">Target</p>
                      <p className="mt-2 truncate text-white/84">{port.target}</p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-black/18 px-4 py-6 text-sm text-white/50">
                No watched bindings match the current search right now.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => changeView("ports")}
            className="mt-4 inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70 transition duration-300 hover:border-white/18 hover:text-white"
          >
            See all
            <ArrowUpRight size={14} />
          </button>
        </div>
      </section>

      <section className={panelClass}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/42">System Monitor</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Basics</h3>
          </div>
          <button
            type="button"
            onClick={() => changeView("monitor")}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70 transition duration-300 hover:border-white/18 hover:text-white"
          >
            Open monitor
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {dashboardMetrics.map((metric, index) => (
            <HologramProgress
              key={metric.id}
              label={metric.label}
              value={metric.value}
              hex={
                index === 0
                  ? accent.amber
                  : index === 1
                    ? accent.cyan
                    : accent.green
              }
            />
          ))}
        </div>
      </section>
    </>
  );

  const renderProcessesPage = () => (
    <>
      {liveProcesses.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-3">
          {liveProcesses.map((process) => {
          const isExpanded = expandedProcessIds.includes(process.id);
          const isSelected = selectedProcess?.id === process.id;

          return (
            <article
              key={process.id}
              className="glass-panel rounded-[32px] p-5 transition duration-300"
              style={
                isSelected
                  ? ({
                      boxShadow: `inset 0 0 0 1px ${accent.cyan}26, 0 24px 84px -56px ${accent.cyan}`,
                    } satisfies CSSProperties)
                  : undefined
              }
            >
              <button
                type="button"
                onClick={() => setSelectedProcessId(process.id)}
                className="w-full min-w-0 text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.22em] text-white/34">{process.group}</p>
                    <h3 className="mt-2 break-words text-xl font-semibold text-white [overflow-wrap:anywhere]">
                      {process.name}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusPill tone={processToneMap[process.status]} label={process.status} />
                    {renderProcessOwnershipTag(process)}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">Runtime</p>
                    <p className="mt-2 text-white/84">{process.runtime}</p>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">Ports</p>
                    <p className="mt-2 text-white/84">
                      {process.ports.length > 0 ? process.ports.join(", ") : "none"}
                    </p>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">PID</p>
                    <p className="mt-2 text-white/84">{process.pid ?? "none"}</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => toggleProcessExpanded(process.id)}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/18 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70 transition duration-300 hover:border-white/18 hover:text-white"
              >
                {isExpanded ? "Collapse" : "Expand"}
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {isExpanded ? (
                <div className="mt-5 min-w-0 space-y-4 border-t border-white/8 pt-5">
                  <p className="break-words text-sm text-white/56 [overflow-wrap:anywhere]">
                    {process.description}
                  </p>
                  <div className="min-w-0 rounded-[20px] border border-white/8 bg-black/18 px-4 py-4">
                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">Command</p>
                    <p className="mt-3 break-words font-mono text-sm leading-7 text-white/80 [overflow-wrap:anywhere]">
                      {process.command}
                    </p>
                    <p className="mt-3 break-words font-mono text-xs leading-6 text-white/42 [overflow-wrap:anywhere]">
                      {process.cwd}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">Uptime</p>
                      <p className="mt-2 text-white/84">{process.uptime}</p>
                    </div>
                    <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">Restarts</p>
                      <p className="mt-2 text-white/84">{process.restarts}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <HologramProgress label="CPU" value={process.cpu} hex={accent.amber} />
                    <HologramProgress
                      label="Memory"
                      value={Math.min(100, Math.round((process.memory / 1200) * 100))}
                      hex={accent.cyan}
                    />
                  </div>
                  {!process.managed ? (
                    <div className="rounded-[22px] border border-rose-400/14 bg-rose-500/8 p-4">
                      <p className="text-[0.72rem] uppercase tracking-[0.22em] text-rose-100/72">
                        Observed Runtime Actions
                      </p>
                      <p className="mt-2 text-sm text-white/60">
                        Promote this live row into a reviewed managed draft, or terminate only the
                        current observed pid.
                      </p>
                      {renderObservedActions(process)}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
        </section>
      ) : (
        renderStatePanel({
          eyebrow: "Processes",
          title: "No live processes match this filter",
          detail:
            searchValue.length > 0
              ? `The current query "${query}" and process filter do not match any live process.`
              : "No live processes are available from the current runtime snapshot.",
          hex: accent.cyan,
          icon: Server,
          actionLabel: "Reset Filters",
          onAction: () => {
            setQuery("");
            setStatusFilter("all");
          },
        })
      )}

      {liveProcesses.length > 0 ? renderInspector() : null}
    </>
  );

  const renderManagedPage = () => (
    <section className={panelClass}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/42">Managed Services</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Command Deck</h3>
        </div>
        <ShinyButton
          label="New Service"
          hex={accent.rose}
          icon={Plus}
          subtle
          onClick={() => openManagedCreateModal()}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {[
          ["Managed", `${managedServices.length}`],
          ["Autostart", `${autoStartCount}`],
          ["Guarded", `${activeRestartPolicyCount}`],
          ["Cleanup", `${managedServicesNeedingReview.length}`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[20px] border border-white/8 bg-black/18 px-4 py-3 text-sm"
          >
            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">{label}</p>
            <p className="mt-2 font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {managedServicesNeedingReview.length > 0 ? (
          <div className="rounded-[24px] border border-amber-300/16 bg-amber-400/8 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-amber-100/72">
                  Legacy Config Cleanup
                </p>
                <p className="mt-2 max-w-2xl text-sm text-white/66">
                  {managedServicesNeedingReview.length} managed service
                  {managedServicesNeedingReview.length === 1 ? "" : "s"} still need a quick review.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setManagedCleanupOnly((current) => !current)}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition duration-300 ${
                    managedCleanupOnly
                      ? "border-amber-200/26 bg-amber-300/16 text-amber-50"
                      : "border-white/8 bg-black/18 text-white/66 hover:text-white"
                  }`}
                >
                  {managedCleanupOnly ? "Show All" : "Show Cleanup Only"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const firstPending = managedServicesNeedingReview[0];
                    if (firstPending) {
                      openManagedEditModal(firstPending);
                    }
                  }}
                  className="rounded-full border border-white/8 bg-black/18 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70 transition duration-300 hover:border-white/18 hover:text-white"
                >
                  Review First
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {visibleManagedServices.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleManagedServices.map((process) => {
              const isSelected =
                selectedManagedService?.id === process.id && managedEditorMode === "edit" && managedEditorOpen;
              const titleHex = managedServiceColorMap[process.titleColor ?? "default"];
              const Icon = managedServiceIconMap[process.icon ?? "server"];

              return (
                <article
                  key={process.id}
                  className="rounded-[28px] border border-white/8 bg-[#0f141b]/94 p-5 transition duration-300"
                  style={
                    isSelected
                      ? ({
                          boxShadow: `inset 0 0 0 1px ${titleHex}30, 0 28px 86px -58px ${titleHex}`,
                        } satisfies CSSProperties)
                      : undefined
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <span
                        className="grid size-12 shrink-0 place-items-center rounded-[20px] border border-white/10 bg-black/18"
                        style={{
                          color: titleHex,
                          boxShadow: `0 0 28px ${titleHex}24`,
                        }}
                      >
                        <Icon size={20} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold" style={{ color: titleHex }}>
                          {process.name}
                        </p>
                        <p className="mt-1 text-sm text-white/54">
                          {process.description || "No description yet."}
                        </p>
                        <p className="mt-3 truncate font-mono text-xs text-white/34">
                          {process.startCommand ?? process.command}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <StatusPill tone={processToneMap[process.status]} label={process.status} />
                      {renderManagedReviewTag(process)}
                      {renderManagedKindTag(process)}
                    </div>
                  </div>

                  {process.review?.needsReview ? (
                    <div className="mt-4 rounded-[18px] border border-amber-300/14 bg-amber-400/8 px-4 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-amber-100/72">
                        Cleanup Notes
                      </p>
                      <p className="mt-2 text-sm text-white/64">
                        {process.review.reasons[0] ??
                          "This service was normalized from an older config entry and should be confirmed."}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    {[
                      ["PID", process.pid ? `${process.pid}` : "idle"],
                      ["Ports", process.ports.length > 0 ? process.ports.join(", ") : "none"],
                      ["Pulse", process.lastHeartbeat],
                      [
                        "Restart",
                        process.restartPolicy === "manual"
                          ? "manual"
                          : `${process.restartPolicy} / ${process.restartLimit}x`,
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3"
                      >
                        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">
                          {label}
                        </p>
                        <p className="mt-2 text-sm text-white/84">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        id: `service-autostart:${process.id}`,
                        label: "Autostart",
                        detail: "Launch this service automatically when the desktop runtime boots.",
                        enabled: process.autoStart,
                        hex: accent.rose,
                      },
                      {
                        id: `service-watch:${process.id}`,
                        label: "Watch Ports",
                        detail:
                          "Include this service in watched binding scans so Mewl can flag port collisions or drift.",
                        enabled: process.watchPorts,
                        hex: accent.cyan,
                      },
                    ].map((setting) => (
                      <div
                        key={setting.id}
                        title={setting.detail}
                        className="rounded-[20px] border border-white/8 bg-black/18 px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-white/88">{setting.label}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleRule(setting.id, !setting.enabled)}
                            disabled={isPending || runtimeStatus !== "ready"}
                            title={setting.detail}
                            aria-label={`${setting.label}: ${setting.detail}`}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition duration-300 ${
                              isPending || runtimeStatus !== "ready"
                                ? "cursor-not-allowed border-white/8 bg-black/18 text-white/34"
                                : "border-white/10 bg-[#0f141b]/94 text-white/70 hover:border-white/18 hover:text-white"
                            }`}
                            style={
                              setting.enabled
                                ? ({
                                    boxShadow: `0 0 24px ${setting.hex}22`,
                                  } satisfies CSSProperties)
                                : undefined
                            }
                          >
                            <span
                              className="size-2.5 rounded-full"
                              style={{
                                backgroundColor: setting.enabled
                                  ? setting.hex
                                  : "rgba(255,255,255,0.26)",
                              }}
                            />
                            {setting.enabled ? "On" : "Off"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
                    {renderManagedLifecycleIcons(process)}
                    <div className="flex items-center gap-2">
                      {process.review?.needsReview
                        ? renderManagedActionButton({
                            label: "Confirm cleanup review",
                            icon: ShieldCheck,
                            hex: accent.amber,
                            onClick: () => confirmManagedReview(process.id),
                            disabled: isPending || runtimeStatus !== "ready",
                          })
                        : null}
                      {renderManagedActionButton({
                        label: "Edit service",
                        icon: PenSquare,
                        hex: titleHex,
                        onClick: () => openManagedEditModal(process),
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-black/18 px-5 py-8 text-sm text-white/52">
            {managedCleanupOnly
              ? "No managed services still need cleanup review right now. Switch back to the full command deck to see every saved service."
              : "Create your first managed service to give Mewl a real launch definition instead of relying on a discovered process snapshot."}
          </div>
        )}
      </div>
    </section>
  );

  const renderManagedEditorModal = () => {
    if (!managedEditorOpen || typeof document === "undefined") {
      return null;
    }

    return createPortal(
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-[#05070bcc]/90 px-4 py-6 backdrop-blur-md"
        onClick={() => setManagedEditorOpen(false)}
      >
        <div
          className="glass-panel max-h-[calc(100vh-3rem)] w-full max-w-[920px] overflow-hidden rounded-[34px]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/42">
                {managedEditorMode === "create"
                  ? managedPrefillSource
                    ? "Create Managed Service From Observed Runtime"
                    : "Create Managed Service"
                  : "Edit Managed Service"}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                {managedEditorMode === "create"
                  ? managedPrefillSource
                    ? "Review the observed draft"
                    : "Author a launch definition"
                  : selectedManagedService?.name ?? "Managed editor"}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {managedEditorMode === "edit" && selectedManagedService ? (
                renderManagedActionButton({
                  label: "Remove managed service",
                  icon: Trash2,
                  hex: accent.rose,
                  onClick: removeManagedDraft,
                  disabled: isPending || runtimeStatus !== "ready",
                })
              ) : null}
              <button
                type="button"
                onClick={() => setManagedEditorOpen(false)}
                className="grid size-10 place-items-center rounded-[18px] border border-white/10 bg-black/18 text-white/70 transition duration-300 hover:border-white/18 hover:text-white"
                aria-label="Close managed editor"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="max-h-[calc(100vh-11rem)] overflow-y-auto px-5 py-5 sm:px-6">
            <div className="space-y-4">
              {managedEditorMode === "create" && managedPrefillSource ? (
                <div className="rounded-[24px] border border-rose-400/16 bg-rose-500/8 p-4">
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-rose-100/72">
                    Prefilled From Observed Runtime
                  </p>
                  <p className="mt-2 text-sm text-white/62">
                    This draft was captured from the live process {managedPrefillSource.name} (pid{" "}
                    {managedPrefillSource.pid ?? "none"}). Review the command and optional stop or
                    restart hooks before saving it as a managed definition.
                  </p>
                  <div className="mt-4 rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">
                      Observed Command
                    </p>
                    <p className="mt-2 break-all font-mono text-sm text-white/80">
                      {managedPrefillSource.command}
                    </p>
                  </div>
                </div>
              ) : null}

              {managedEditorMode === "edit" && selectedManagedService?.review?.needsReview ? (
                <div className="rounded-[24px] border border-amber-300/16 bg-amber-400/8 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.72rem] uppercase tracking-[0.22em] text-amber-100/72">
                        Cleanup This Imported Service
                      </p>
                      <p className="mt-2 text-sm text-white/66">
                        This saved definition was normalized from an older `mewl.services.json`
                        entry. Confirm the details below once they look right.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => confirmManagedReview(selectedManagedService.id)}
                      disabled={isPending || runtimeStatus !== "ready"}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition duration-300 ${
                        isPending || runtimeStatus !== "ready"
                          ? "cursor-not-allowed border-white/8 bg-black/18 text-white/34"
                          : "border-amber-200/26 bg-amber-300/16 text-amber-50 hover:border-amber-100/36"
                      }`}
                    >
                      <ShieldCheck size={14} />
                      Mark Reviewed
                    </button>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {selectedManagedService.review.reasons.map((reason) => (
                      <div
                        key={reason}
                        className="rounded-[18px] border border-white/8 bg-black/18 px-4 py-3 text-sm text-white/72"
                      >
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)]">
                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/8 bg-[#0f141b]/94 p-4">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">
                      Service Mode
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {managedServiceKindOptions.map((option) => {
                        const selected = managedDraft.kind === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() =>
                              setManagedDraft((current) => ({
                                ...current,
                                kind: option.id,
                                icon:
                                  option.id === "docker"
                                    ? "workflow"
                                    : current.icon === "workflow"
                                      ? "server"
                                      : current.icon,
                              }))
                            }
                            className={`rounded-[18px] border px-4 py-4 text-left transition duration-300 ${
                              selected
                                ? "border-white/14 bg-black/26 text-white"
                                : "border-white/8 bg-black/14 text-white/56 hover:text-white/82"
                            }`}
                          >
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className="mt-2 text-xs leading-5 text-white/48">{option.detail}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="block">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">Name</p>
                    <input
                      className="mt-2 w-full rounded-[20px] border border-white/10 bg-[#0f141b]/94 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                      value={managedDraft.name}
                      onChange={(event) =>
                        setManagedDraft((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="MyApp"
                    />
                  </label>

                  <label className="block">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">
                      Description
                    </p>
                    <textarea
                      className="mt-2 min-h-[110px] w-full rounded-[20px] border border-white/10 bg-[#0f141b]/94 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                      value={managedDraft.description}
                      onChange={(event) =>
                        setManagedDraft((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Optional note for what this service does."
                    />
                  </label>

                  <label className="block">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">
                      {managedKindMeta.startLabel}
                    </p>
                    <input
                      className="mt-2 w-full rounded-[20px] border border-white/10 bg-[#0f141b]/94 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-white/30"
                      value={managedDraft.startCommand}
                      onChange={(event) =>
                        setManagedDraft((current) => ({
                          ...current,
                          startCommand: event.target.value,
                        }))
                      }
                      placeholder={managedKindMeta.startPlaceholder}
                    />
                  </label>

                  <label className="block">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">
                      {managedKindMeta.stopLabel}
                    </p>
                    <input
                      className="mt-2 w-full rounded-[20px] border border-white/10 bg-[#0f141b]/94 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-white/30"
                      value={managedDraft.stopCommand}
                      onChange={(event) =>
                        setManagedDraft((current) => ({
                          ...current,
                          stopCommand: event.target.value,
                        }))
                      }
                      placeholder={managedKindMeta.stopPlaceholder}
                    />
                  </label>

                  <label className="block">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">
                      {managedKindMeta.restartLabel}
                    </p>
                    <input
                      className="mt-2 w-full rounded-[20px] border border-white/10 bg-[#0f141b]/94 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-white/30"
                      value={managedDraft.restartCommand}
                      onChange={(event) =>
                        setManagedDraft((current) => ({
                          ...current,
                          restartCommand: event.target.value,
                        }))
                      }
                      placeholder={managedKindMeta.restartPlaceholder}
                    />
                  </label>

                  <label className="block">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">
                      Working Directory
                    </p>
                    <input
                      className="mt-2 w-full rounded-[20px] border border-white/10 bg-[#0f141b]/94 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-white/30"
                      value={managedDraft.cwd}
                      onChange={(event) =>
                        setManagedDraft((current) => ({
                          ...current,
                          cwd: event.target.value,
                        }))
                      }
                      placeholder="."
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-white/8 bg-[#0f141b]/94 p-4">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">
                      Mode Guidance
                    </p>
                    <p className="mt-3 text-sm leading-6 text-white/60">{managedKindMeta.guidance}</p>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-[#0f141b]/94 p-4">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">
                      Restart Policy
                    </p>
                    <div className="mt-4 grid gap-3">
                      {[
                        {
                          id: "manual",
                          label: "Manual",
                          detail: "Only restart this service when you explicitly ask Mewl to do it.",
                        },
                        {
                          id: "on-failure",
                          label: "On Failure",
                          detail: "Retry after non-zero exits or signals, up to the retry limit below.",
                        },
                        {
                          id: "always",
                          label: "Always",
                          detail: "Bring the service back after every exit until the retry limit is reached.",
                        },
                      ].map((option) => {
                        const selected = managedDraft.restartPolicy === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() =>
                              setManagedDraft((current) => ({
                                ...current,
                                restartPolicy: option.id as ManagedServiceDraft["restartPolicy"],
                              }))
                            }
                            className={`rounded-[18px] border px-4 py-3 text-left transition duration-300 ${
                              selected
                                ? "border-white/14 bg-black/26 text-white"
                                : "border-white/8 bg-black/14 text-white/56 hover:text-white/82"
                            }`}
                          >
                            <p className="text-sm font-semibold">{option.label}</p>
                            <p className="mt-2 text-xs leading-5 text-white/48">{option.detail}</p>
                          </button>
                        );
                      })}
                    </div>

                    <label className="mt-4 block">
                      <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">
                        Retry Limit
                      </p>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        className="mt-2 w-full rounded-[20px] border border-white/10 bg-black/18 px-4 py-3 text-sm text-white outline-none"
                        value={managedDraft.restartLimit}
                        onChange={(event) =>
                          setManagedDraft((current) => ({
                            ...current,
                            restartLimit: Number.parseInt(event.target.value, 10) || 1,
                          }))
                        }
                      />
                    </label>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-[#0f141b]/94 p-4">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">
                      Title Color
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {managedServiceColorOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setManagedDraft((current) => ({ ...current, titleColor: option.id }))
                          }
                          className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.22em] transition duration-300 ${
                            managedDraft.titleColor === option.id
                              ? "border-white/16 bg-black/26 text-white"
                              : "border-white/8 bg-black/14 text-white/48 hover:text-white/76"
                          }`}
                        >
                          <span
                            className="size-3 rounded-full border border-white/10"
                            style={{ backgroundColor: managedServiceColorMap[option.id] }}
                          />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-white/8 bg-[#0f141b]/94 p-4">
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">
                      Card Icon
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {managedServiceIconOptions.map((option) => {
                        const Icon = managedServiceIconMap[option.id];
                        const selected = managedDraft.icon === option.id;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() =>
                              setManagedDraft((current) => ({ ...current, icon: option.id }))
                            }
                            className={`flex items-center gap-3 rounded-[18px] border px-3 py-3 text-left transition duration-300 ${
                              selected
                                ? "border-white/14 bg-black/26 text-white"
                                : "border-white/8 bg-black/14 text-white/56 hover:text-white/82"
                            }`}
                          >
                            <span className="grid size-10 place-items-center rounded-[16px] border border-white/10 bg-black/18">
                              <Icon size={18} />
                            </span>
                            <span className="text-sm font-medium">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-dashed border-white/10 bg-black/18 px-4 py-4 text-sm text-white/46">
                    Commands are tokenized without a shell. Plain commands like `npm start`,
                    `docker compose up app`, and direct script paths like `./scripts/dev.sh` work
                    well here.
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-white/8 pt-4">
                <ShinyButton
                  label={managedEditorMode === "create" ? "Create Service" : "Save Changes"}
                  hex={accent.rose}
                  icon={managedEditorMode === "create" ? Plus : PenSquare}
                  onClick={saveManagedDraft}
                  disabled={isPending || runtimeStatus !== "ready"}
                />
                {managedEditorMode === "create" ? null : (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedManagedService) {
                        setManagedDraft(createDraftFromManagedProcess(selectedManagedService));
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70 transition duration-300 hover:border-white/18 hover:text-white"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setManagedEditorOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/18 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70 transition duration-300 hover:border-white/18 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  };

  const renderPortsPage = () => (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.9fr)]">
      <div className={panelClass}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/42">Port Registry</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Bindings</h3>
          </div>
          <ShinyButton
            label="Scan Ports"
            hex={accent.cyan}
            icon={Waypoints}
            subtle
            disabled={isPending}
            onClick={() => handleProcessAction("scan")}
          />
        </div>

        <div className="mt-6 overflow-x-auto rounded-[28px] border border-white/8 bg-black/18">
          {filteredPorts.length > 0 ? (
            <div className="min-w-[940px]">
              <div className="grid grid-cols-[72px_76px_minmax(0,1.1fr)_120px_110px_minmax(180px,1.45fr)] gap-4 border-b border-white/8 px-5 py-4 text-xs uppercase tracking-[0.24em] text-white/38">
                <span>Port</span>
                <span>Proto</span>
                <span>Service</span>
                <span>Exposure</span>
                <span>Status</span>
                <span>Target</span>
              </div>

              <div className="divide-y divide-white/6">
                {filteredPorts.map((port) => (
                  <div
                    key={port.id}
                    className="grid grid-cols-[72px_76px_minmax(0,1.1fr)_120px_110px_minmax(180px,1.45fr)] gap-4 px-5 py-4 transition duration-300 hover:bg-white/[0.03]"
                  >
                    <p className="text-sm font-semibold text-white">{port.port}</p>
                    <p className="text-sm text-white/58 uppercase">{port.protocol}</p>
                    <div className="min-w-0">
                      <p className="break-words text-sm text-white/86">{port.service}</p>
                      <p className="text-xs text-white/38">{port.note}</p>
                    </div>
                    <p className="text-sm capitalize text-white/62">{port.exposure}</p>
                    <p className={`text-sm font-medium capitalize ${portTextClassMap[port.status]}`}>
                      {port.status}
                    </p>
                    <p className="break-all text-sm text-white/46">{port.target}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-5 py-8">
              <p className="text-sm font-semibold text-white/84">No bindings match the current search</p>
              <p className="mt-2 text-sm text-white/52">
                Clear the current query or scan again once a runtime bridge is feeding fresh bindings.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className={panelClass}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/42">Port Safety</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Exposure Summary</h3>
          </div>
          <div className="grid size-11 place-items-center rounded-[20px] border border-white/10 bg-black/18">
            <ShieldCheck size={20} className="text-cyan-300" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            ["Public", `${publicPortCount}`],
            ["Conflicts", `${conflictCount}`],
            ["Watched", `${watchedCount}`],
            ["Open", `${openPortCount}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[22px] border border-white/8 bg-black/18 px-4 py-4">
              <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/38">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {filteredPorts.filter((port) => port.status === "conflict" || port.exposure === "public")
            .length > 0 ? (
            filteredPorts
              .filter((port) => port.status === "conflict" || port.exposure === "public")
              .map((port) => (
                <div
                  key={port.id}
                  className="rounded-[22px] border border-white/8 bg-[#0f141b]/94 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white/88">
                      {port.port} / {port.service}
                    </p>
                    <p className={`text-xs uppercase tracking-[0.22em] ${portTextClassMap[port.status]}`}>
                      {port.status}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-white/54">{port.note}</p>
                </div>
              ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-black/18 px-4 py-5 text-sm text-white/48">
              No public or conflicting bindings need attention right now.
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const renderMonitorPage = () => (
    <section className="grid gap-4">
      <div className={panelClass}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/42">System Monitor</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Pressure Tides</h3>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {monitorTrendCards.length > 0 ? (
            <div className="rounded-[28px] border border-white/8 bg-black/18 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/38">
                    Trend Canvas
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    Rolling host pressure
                  </p>
                </div>
                <Gauge size={20} className="text-cyan-300" />
              </div>

              <div className="mt-5 grid gap-3 xl:grid-cols-3">
                {monitorTrendCards.map((series) => (
                  <PulseLineChart
                    key={series.id}
                    label={series.label}
                    valueLabel={series.displayValue ?? `${series.values[series.values.length - 1] ?? 0}%`}
                    detail={series.detail}
                    values={series.values}
                    hex={monitorMetricHexMap[series.id] ?? accent.cyan}
                    inactive={series.available === false}
                  />
                ))}
                {gpuTrendSeries ? (
                  <PulseLineChart
                    label={gpuTrendSeries.label}
                    valueLabel={
                      gpuTrendSeries.displayValue ??
                      `${gpuTrendSeries.values[gpuTrendSeries.values.length - 1] ?? 0}%`
                    }
                    detail={gpuTrendSeries.detail}
                    values={gpuTrendSeries.values}
                    hex={monitorMetricHexMap[gpuTrendSeries.id] ?? accent.rose}
                    inactive={gpuTrendSeries.available === false}
                  />
                ) : null}
                <article className="relative overflow-hidden rounded-[24px] border border-white/8 bg-[#0f141b]/94 p-4">
                  <div
                    className="pointer-events-none absolute inset-x-6 top-0 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, ${accent.amber}, transparent)` }}
                  />
                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">
                        Runtime Pulse
                      </p>
                      <p className="mt-2 text-xl font-semibold text-white">Current service waveform</p>
                    </div>
                    <div
                      className="rounded-full border px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em]"
                      style={{
                        color: accent.amber,
                        borderColor: `${accent.amber}30`,
                        backgroundColor: `${accent.amber}12`,
                      }}
                    >
                      live
                    </div>
                  </div>

                  <div className="mt-4 rounded-[20px] border border-white/8 bg-black/24 px-4 py-5">
                    <SignalBars
                      values={[24, 46, 62, 71, 53, 88, 76, 68, 90, 58]}
                      className="h-40 w-full justify-between gap-2"
                      barClassName="min-w-0 flex-1"
                    />
                  </div>

                  <p className="mt-4 text-sm text-white/52">
                    Live waveform for the active service draw rhythm across the current sample window.
                  </p>
                </article>
              </div>
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-black/18 px-4 py-5 text-sm text-white/48">
              Host metrics will appear here once the runtime source delivers a pressure snapshot.
            </div>
          )}

          <div className="rounded-[28px] border border-white/8 bg-[#0f141b]/94 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/38">
                  Snapshot Lane
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  Current host pressure
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-black/18 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/58">
                last 24 samples
              </div>
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-2">
              {monitorMetrics.length > 0 ? (
                monitorMetrics.map((metric) => (
                  <HologramProgress
                    key={metric.id}
                    label={metric.label}
                    value={metric.value}
                    valueLabel={metric.displayValue}
                    detail={metric.detail}
                    inactive={metric.available === false}
                    hex={monitorMetricHexMap[metric.id] ?? accent.cyan}
                  />
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-white/10 bg-black/18 px-4 py-5 text-sm text-white/48 xl:col-span-2">
                  Waiting on the next host pressure snapshot.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={panelClass}>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/42">Noisy Services</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Top Resource Draw</h3>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-2">
          {busiestProcesses.length > 0 ? (
            busiestProcesses.map((process) => (
              <article
                key={process.id}
                className="rounded-[22px] border border-white/8 bg-[#0f141b]/94 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white/88">{process.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/8 bg-black/18 px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.2em] text-white/40">
                        {process.runtime}
                      </span>
                      <span className="rounded-full border border-white/8 bg-black/18 px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.2em] text-white/40">
                        {process.group}
                      </span>
                      <span className="rounded-full border border-white/8 bg-black/18 px-2.5 py-1 text-[0.64rem] uppercase tracking-[0.2em] text-white/40">
                        {process.uptime}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusPill tone={processToneMap[process.status]} label={process.status} />
                    {renderProcessOwnershipTag(process)}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-white/34">CPU</p>
                    <p className="mt-2 font-semibold text-white">{process.cpu}%</p>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-white/34">Memory</p>
                    <p className="mt-2 font-semibold text-white">{process.memory} MB</p>
                  </div>
                  <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                    <p className="text-[0.7rem] uppercase tracking-[0.18em] text-white/34">Network</p>
                    <p className="mt-2 font-semibold text-white">{process.network} Mbps</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleResourceDrawExpanded(process.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/18 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70 transition duration-300 hover:border-white/18 hover:text-white"
                  >
                    {expandedResourceDrawIds.includes(process.id) ? "Collapse" : "Expand"}
                    {expandedResourceDrawIds.includes(process.id) ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProcessId(process.id);
                      changeView("processes");
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/18 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70 transition duration-300 hover:border-white/18 hover:text-white"
                  >
                    Inspect
                    <ArrowUpRight size={14} />
                  </button>
                </div>
                {expandedResourceDrawIds.includes(process.id) ? (
                  <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
                    <p className="text-sm text-white/56">{process.description}</p>
                    <div className="rounded-[18px] border border-white/8 bg-black/18 px-3 py-3">
                      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">
                        Command
                      </p>
                      <p className="mt-2 break-all font-mono text-sm text-white/78">
                        {process.command}
                      </p>
                      <p className="mt-3 break-all font-mono text-xs text-white/42">
                        {process.cwd}
                      </p>
                    </div>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-black/18 px-4 py-5 text-sm text-white/48 xl:col-span-2">
              Resource leaders will appear after the runtime delivers process telemetry.
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const renderPage = () => {
    if (runtimeStatus === "loading") {
      return renderStatePanel({
        eyebrow: "Runtime Source",
        title: "Hydrating the local workspace",
        detail:
          `Mewl is restoring saved filters, process state, and the current ${runtimeSource.label.toLowerCase()} snapshot before the dashboard becomes interactive.`,
        hex: accent.cyan,
        icon: Terminal,
      });
    }

    if (runtimeStatus === "error") {
      return renderStatePanel({
        eyebrow: "Runtime Source",
        title: "Workspace session could not be restored",
        detail:
          runtimeError ??
          "The desktop bridge could not be reached. Resetting the workspace will retry the live Electron connection.",
        hex: accent.rose,
        icon: BellRing,
        actionLabel: "Reset Session",
        onAction: restoreDefaultWorkspace,
      });
    }

    if (activeView === "processes") {
      return renderProcessesPage();
    }

    if (activeView === "managed") {
      return renderManagedPage();
    }

    if (activeView === "ports") {
      return renderPortsPage();
    }

    if (activeView === "monitor") {
      return renderMonitorPage();
    }

    return renderOverview();
  };

  return (
    <div className="min-h-screen px-4 py-4 text-white sm:px-5 lg:px-6">
      <div
        className={`mewl-shell mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1680px] gap-4 ${
          sidebarCollapsed
            ? "xl:grid-cols-[112px_minmax(0,1fr)]"
            : "xl:grid-cols-[292px_minmax(0,1fr)]"
        }`}
      >
        <aside className="glass-panel relative flex overflow-hidden rounded-[34px] p-4 xl:flex-col xl:p-5">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/35 to-transparent" />

          <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between"} gap-3`}>
            <div className="flex items-center gap-3">
              <img
                src={appIconUrl}
                alt="Mewl icon"
                className="size-18 rounded-[16px] border border-white/10 object-cover shadow-[0_0_32px_rgba(148,163,184,0.18)]"
              />
              {!sidebarCollapsed ? (
                <p className="text-[0.95rem] font-semibold uppercase tracking-[0.32em] text-white/56">
                  Mewl
                </p>
              ) : null}
            </div>

            {!sidebarCollapsed ? (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="grid size-10 place-items-center rounded-[18px] border border-white/10 bg-[#0f141b]/94 text-white/62 transition duration-300 hover:text-white"
              >
                <ChevronLeft size={18} />
              </button>
            ) : null}
          </div>

          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              className="mt-4 grid size-10 place-self-center place-items-center rounded-[18px] border border-white/10 bg-[#0f141b]/94 text-white/62 transition duration-300 hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          ) : null}

          <nav className="mt-8 space-y-2">
            {viewMeta.map(({ id, label, icon: Icon, hex }) => {
              const isActive = id === activeView;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => changeView(id)}
                  aria-label={label}
                  className={`flex w-full items-center ${sidebarCollapsed ? "justify-center px-0" : "justify-between px-4"} rounded-[22px] border py-3 text-left transition duration-300 ${
                    isActive
                      ? "border-white/12 bg-[#11161d]/94 text-white"
                      : "border-transparent bg-[#0e1319]/78 text-white/62 hover:border-white/10 hover:bg-[#11161d]/90 hover:text-white"
                  }`}
                  style={
                    isActive
                      ? ({
                          boxShadow: `0 20px 56px -36px ${hex}`,
                        } satisfies CSSProperties)
                      : undefined
                  }
                >
                  <span className={`flex items-center ${sidebarCollapsed ? "" : "gap-3"}`}>
                    <span
                      className="grid size-10 place-items-center rounded-2xl border border-white/8 bg-black/18"
                      style={
                        isActive
                          ? ({
                              color: hex,
                              boxShadow: `0 0 24px ${hex}24`,
                            } satisfies CSSProperties)
                          : undefined
                      }
                    >
                      <Icon size={18} />
                    </span>
                    {!sidebarCollapsed ? <span className="text-sm font-medium">{label}</span> : null}
                  </span>
                  {isActive && !sidebarCollapsed ? <ArrowUpRight size={16} /> : null}
                </button>
              );
            })}
          </nav>

          <div
            className={`mt-8 rounded-[28px] border border-white/8 bg-[#0f141b]/94 ${
              sidebarCollapsed ? "p-3" : "p-4"
            }`}
            style={{ boxShadow: "0 24px 80px -48px rgba(34, 211, 238, 0.4)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                {!sidebarCollapsed ? (
                  <p className="text-xs uppercase tracking-[0.24em] text-white/40">Host Health</p>
                ) : null}
                <p className={`font-semibold text-white ${sidebarCollapsed ? "mt-1 text-2xl" : "mt-3 text-3xl"}`}>
                  {100 - degradedCount * 7}%
                </p>
              </div>
              {!sidebarCollapsed ? (
                <StatusPill tone={degradedCount > 0 ? "warning" : "online"} label="Watched" />
              ) : null}
            </div>

            <div className="mt-4 rounded-[24px] border border-white/8 bg-black/18 px-3 py-4">
              <SignalBars
                values={[34, 48, 62, 56, 72, 68, 84, 74]}
                className="w-full justify-between gap-1.5"
                barClassName="min-w-0 flex-1"
              />
            </div>

            <div className={`mt-4 grid gap-3 ${sidebarCollapsed ? "grid-cols-1" : "grid-cols-2"}`}>
              {[
                ["CPU", `${hostCpu}%`, ""],
                ["RAM", `${hostMemory}%`, ""],
                ["Disk", `${hostDisk}%`, ""],
                ["Net", `${hostNetwork}%`, ""],
                [
                  "GPU",
                  hostGpuMetric?.available === false
                    ? "Unavailable"
                    : hostGpuMetric?.displayValue ?? `${hostGpu}%`,
                  "col-span-2",
                ],
              ].map(([label, value, className]) => (
                <div
                  key={label}
                  className={`rounded-[20px] border border-white/8 bg-black/18 px-3 py-3 text-sm ${className}`}
                >
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/34">{label}</p>
                  <p className="mt-2 font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

        </aside>

        <main className="flex min-w-0 flex-col gap-4">
          <section className={`${panelClass} relative z-20 p-4 sm:p-5`}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-[280px] flex-1">
                <CandyInput
                  value={query}
                  onChange={setQuery}
                  hex={accent.rose}
                  placeholder="Search services, ports, folders, or commands..."
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <ShinyButton
                  label="Scan"
                  hex={accent.cyan}
                  icon={Waypoints}
                  subtle
                  disabled={isPending || runtimeStatus !== "ready"}
                  onClick={() => handleProcessAction("scan")}
                />
              </div>

              <StatusPill
                tone={runtimeIndicatorTone}
                label={
                  runtimeStatus === "ready"
                    ? runtimeSource.badgeLabel
                    : runtimeStatus === "error"
                      ? "source error"
                      : "hydrating"
                }
              />

              <div className="relative ml-auto">
                <button
                  type="button"
                  onClick={() => setAlertsOpen((open) => !open)}
                  className="relative grid size-12 place-items-center rounded-[20px] border border-white/10 bg-[#0f141b]/94 transition duration-300 hover:border-white/18"
                  style={{
                    boxShadow: alertsOpen
                      ? `0 18px 50px -30px ${accent.amber}`
                      : "0 18px 50px -42px rgba(0, 0, 0, 0.95)",
                  }}
                >
                  <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
                  <BellRing
                    size={18}
                    style={{ color: alertsOpen ? accent.amber : "rgba(255,255,255,0.72)" }}
                  />
                </button>

                {alertsOpen ? (
                  <div className="absolute right-0 top-[calc(100%+0.85rem)] z-50 w-[420px] max-w-[calc(100vw-2rem)] rounded-[26px] border border-white/8 bg-[#0c1015]/96 p-3 shadow-[0_34px_90px_-42px_rgba(0,0,0,0.96)] backdrop-blur-2xl">
                    {renderAlertFeed()}
                  </div>
                ) : null}
              </div>
            </div>

            {activeView === "processes" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {statusFilterOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setStatusFilter(option.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.22em] transition duration-300 ${
                      statusFilter === option.id
                        ? "border-white/12 bg-[#121821] text-white"
                        : "border-white/8 bg-black/18 text-white/42 hover:text-white/72"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          {renderPage()}
        </main>
      </div>
      {renderManagedEditorModal()}
    </div>
  );
}

export default App;
