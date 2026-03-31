import {
  type CSSProperties,
  startTransition,
  useEffect,
  useDeferredValue,
  useState,
  useTransition,
} from "react";
import {
  Activity,
  ArrowUpRight,
  BellRing,
  Bot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cpu,
  Gauge,
  LayoutDashboard,
  MemoryStick,
  Network,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Square,
  Terminal,
  Waypoints,
  Workflow,
} from "lucide-react";
import {
  CandyInput,
  HologramProgress,
  ShinyButton,
  SignalBars,
  StatusPill,
  SugarCard,
  SweetToggle,
} from "./components/ui";
import {
  type AlertRecord,
  type AlertSeverity,
  type AutomationRule,
  type ManagedProcess,
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
  chosenHostLayer,
  createDefaultRuntimeSnapshot,
  getRuntimeSourceDescriptor,
  hydrateRuntimeSnapshot,
} from "./runtime";

type StatusFilter = "all" | "active" | "watching" | "issues";
type RuntimeStatus = "loading" | "ready" | "error";

type PersistedWorkspaceState = {
  version: 1;
  preferences: {
    activeView: WorkspaceView;
    query: string;
    statusFilter: StatusFilter;
    sidebarCollapsed: boolean;
    selectedProcessId: string;
    expandedProcessIds: string[];
  };
  runtime: {
    processes: ManagedProcess[];
    ports: PortBinding[];
    alerts: AlertRecord[];
    automationRules: AutomationRule[];
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

const viewMeta: Array<{
  id: WorkspaceView;
  label: string;
  icon: typeof LayoutDashboard;
  hex: string;
}> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, hex: accent.rose },
  { id: "processes", label: "Processes", icon: Server, hex: accent.cyan },
  { id: "ports", label: "Ports", icon: Waypoints, hex: accent.purple },
  { id: "monitor", label: "Monitor", icon: Activity, hex: accent.amber },
  { id: "automation", label: "Automation", icon: Bot, hex: accent.green },
];

const statusFilterOptions: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "watching", label: "Watching" },
  { id: "issues", label: "Issues" },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState("");
  const [expandedProcessIds, setExpandedProcessIds] = useState<string[]>([]);
  const [processes, setProcesses] = useState<ManagedProcess[]>([]);
  const [ports, setPorts] = useState<PortBinding[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [monitorMetrics, setMonitorMetrics] = useState<MonitorMetric[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [commandState, setCommandState] = useState(defaultCommandState);
  const [isPending, startActionTransition] = useTransition();
  const runtimeSource = getRuntimeSourceDescriptor();
  const isLiveElectronRuntime = runtimeSource.id === "electron";

  const applyRuntimeSnapshot = (snapshot: RuntimeSnapshot) => {
    setProcesses(snapshot.processes);
    setPorts(snapshot.ports);
    setAlerts(snapshot.alerts);
    setMonitorMetrics(snapshot.monitorMetrics);
    setAutomationRules(snapshot.automationRules);
    setSelectedProcessId((current) =>
      snapshot.processes.some((process) => process.id === current)
        ? current
        : (snapshot.processes[0]?.id ?? ""),
    );
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
        const persistedProcesses = persisted?.runtime.processes;
        const persistedPorts = persisted?.runtime.ports;
        const persistedAlerts = persisted?.runtime.alerts;
        const persistedAutomationRules = persisted?.runtime.automationRules;
        const hydratedProcesses =
          persistedProcesses && persistedProcesses.length > 0
            ? persistedProcesses
            : snapshot.processes;
        const hydratedPorts =
          persistedPorts && persistedPorts.length > 0 ? persistedPorts : snapshot.ports;
        const hydratedAlerts =
          persistedAlerts && persistedAlerts.length > 0 ? persistedAlerts : snapshot.alerts;
        const hydratedAutomationRules =
          persistedAutomationRules && persistedAutomationRules.length > 0
            ? persistedAutomationRules
            : snapshot.automationRules;
        const fallbackSelectedProcessId =
          hydratedProcesses[0]?.id ?? snapshot.processes[0]?.id ?? "";

        setProcesses(hydratedProcesses);
        setPorts(hydratedPorts);
        setAlerts(hydratedAlerts);
        setMonitorMetrics(snapshot.monitorMetrics);
        setAutomationRules(hydratedAutomationRules);
        setCommandState(persisted?.runtime.commandState ?? defaultCommandState);
        setActiveView(persisted?.preferences.activeView ?? "overview");
        setQuery(persisted?.preferences.query ?? "");
        setStatusFilter(persisted?.preferences.statusFilter ?? "all");
        setSidebarCollapsed(persisted?.preferences.sidebarCollapsed ?? false);
        setExpandedProcessIds(persisted?.preferences.expandedProcessIds ?? []);
        setSelectedProcessId(
          persisted?.preferences.selectedProcessId || fallbackSelectedProcessId,
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
        expandedProcessIds,
      },
      runtime: {
        processes,
        ports,
        alerts,
        automationRules,
        commandState,
      },
    });
  }, [
    activeView,
    alerts,
    automationRules,
    commandState,
    expandedProcessIds,
    ports,
    processes,
    query,
    runtimeStatus,
    selectedProcessId,
    sidebarCollapsed,
    statusFilter,
  ]);

  useEffect(() => {
    if (runtimeStatus !== "ready" || selectedProcessId || processes.length === 0) {
      return;
    }

    setSelectedProcessId(processes[0].id);
  }, [processes, runtimeStatus, selectedProcessId]);

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

  const selectedProcess =
    filteredProcesses.find((process) => process.id === selectedProcessId) ??
    processes.find((process) => process.id === selectedProcessId) ??
    filteredProcesses[0] ??
    processes[0] ??
    null;

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
  const busiestProcesses = [...processes]
    .sort((left, right) => right.cpu + right.memory / 20 - (left.cpu + left.memory / 20))
    .slice(0, 4);
  const previewProcesses = filteredProcesses
    .filter((process) => process.status !== "stopped")
    .slice(0, 4);
  const previewPorts = filteredPorts.filter((port) => port.status !== "standby").slice(0, 4);
  const dashboardMetrics = monitorMetrics.slice(0, 3);
  const runtimeIndicatorTone =
    runtimeStatus === "ready"
      ? "online"
      : runtimeStatus === "error"
        ? "offline"
        : "starting";

  const restoreDefaultWorkspace = () => {
    void createDefaultRuntimeSnapshot().then((snapshot) => {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(workspaceStorageKey);
      }

      setProcesses(snapshot.processes);
      setPorts(snapshot.ports);
      setAlerts(snapshot.alerts);
      setMonitorMetrics(snapshot.monitorMetrics);
      setAutomationRules(snapshot.automationRules);
      setCommandState(defaultCommandState);
      setActiveView("overview");
      setQuery("");
      setStatusFilter("all");
      setSidebarCollapsed(false);
      setSelectedProcessId(snapshot.processes[0]?.id ?? "");
      setExpandedProcessIds([]);
      setAlertsOpen(false);
      setRuntimeError(null);
      setRuntimeStatus("ready");
    });
  };

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
  }: Omit<AlertRecord, "id">) => {
    setAlerts((current) => [
      {
        id: `alert-${Date.now()}`,
        title,
        detail,
        severity,
        stamp,
      },
      ...current,
    ].slice(0, 6));
  };

  const updateSelectedProcess = (updater: (process: ManagedProcess) => ManagedProcess) => {
    if (!selectedProcess) {
      return;
    }

    setProcesses((current) =>
      current.map((process) => (process.id === selectedProcess.id ? updater(process) : process)),
    );
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

  const handleProcessAction = (action: "start" | "stop" | "restart" | "scan") => {
    if (runtimeStatus !== "ready") {
      return;
    }

    if (isLiveElectronRuntime) {
      if (action === "scan") {
        setCommandState("Refreshing live host services, bindings, and telemetry from Electron.");

        startActionTransition(async () => {
          const snapshot = await hydrateRuntimeSnapshot();
          applyRuntimeSnapshot(snapshot);
          setCommandState("Live host scan completed.");
          setAlertsOpen(false);
        });
      }

      return;
    }

    if (action === "scan") {
      setCommandState("Scanning watched bindings and reserved ranges.");

      if (selectedProcess) {
        appendProcessLogs(selectedProcess.id, [
          {
            ...createProcessLogEntry("debug", "Port scan requested from the command strip."),
            stream: "stdout",
          },
        ]);
      }

      startActionTransition(async () => {
        await delay(320);

        if (selectedProcess) {
          appendProcessLogs(selectedProcess.id, [
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

    if (!selectedProcess) {
      return;
    }

    if (action === "start" && selectedProcess.status === "running") {
      setCommandState(`${selectedProcess.name} is already live.`);
      pushAlert({
        title: "No launch needed",
        detail: `${selectedProcess.name} was already running when the launch command was issued.`,
        severity: "info",
        stamp: "now",
      });
      return;
    }

    if (action === "stop" && selectedProcess.status === "stopped") {
      setCommandState(`${selectedProcess.name} is already stopped.`);
      return;
    }

    const nextPid = (selectedProcess.pid ?? 4200) + 17;
    const processConflictCount = ports.filter(
      (port) => port.serviceId === selectedProcess.id && port.status === "conflict",
    ).length;

    appendProcessLogs(selectedProcess.id, [
      {
        ...createProcessLogEntry(
          action === "restart" ? "warning" : "info",
          action === "start"
            ? "Boot request accepted by the mock runtime bridge."
            : action === "stop"
              ? "Graceful shutdown request queued from the command strip."
              : "Restart request queued and the process is entering the drain window.",
        ),
        stream: "stdout",
      },
    ]);

    setCommandState(
      action === "start"
        ? `Starting ${selectedProcess.name}...`
        : action === "stop"
          ? `Stopping ${selectedProcess.name}...`
          : `Restarting ${selectedProcess.name}...`,
    );

    startActionTransition(async () => {
      setProcesses((current) =>
        current.map((process) => {
          if (process.id !== selectedProcess.id) {
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
          port.serviceId === selectedProcess.id
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
          if (process.id !== selectedProcess.id) {
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
          port.serviceId === selectedProcess.id
            ? {
                ...port,
                status: action === "stop" ? "standby" : "bound",
              }
            : port,
        ),
      );

      appendProcessLogs(selectedProcess.id, [
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
            ? `${selectedProcess.name} launched`
            : action === "stop"
              ? `${selectedProcess.name} stopped`
              : `${selectedProcess.name} restarted`,
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
          ? `${selectedProcess.name} is running.`
          : action === "stop"
            ? `${selectedProcess.name} is stopped.`
            : `${selectedProcess.name} restart completed.`,
      );
    });
  };

  const toggleRule = (ruleId: string, nextValue: boolean) => {
    const rule = automationRules.find((item) => item.id === ruleId);
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
      {alerts.length === 0 ? (
        <div className="rounded-[22px] border border-white/8 bg-[#10151c]/92 px-4 py-5">
          <p className="text-sm font-semibold text-white/86">No fresh alerts</p>
          <p className="mt-2 text-sm text-white/52">
            The runtime feed is quiet right now, so this tray is waiting for the next notable event.
          </p>
        </div>
      ) : null}
      {alerts.map((item, index) => (
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

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <SweetToggle
            label="Autostart"
            checked={selectedProcess.autoStart}
            onChange={(next) => {
              updateSelectedProcess((process) => ({ ...process, autoStart: next }));
              appendProcessLogs(selectedProcess.id, [
                {
                  ...createProcessLogEntry(
                    "info",
                    `Autostart was ${next ? "enabled" : "disabled"} from the inspector.`,
                  ),
                  stream: "stdout",
                },
              ]);
              setCommandState(
                `${selectedProcess.name} autostart ${next ? "enabled" : "disabled"}.`,
              );
            }}
            hex={accent.rose}
          />
          <SweetToggle
            label="Watch ports"
            checked={selectedProcess.watchPorts}
            onChange={(next) => {
              updateSelectedProcess((process) => ({ ...process, watchPorts: next }));
              appendProcessLogs(selectedProcess.id, [
                {
                  ...createProcessLogEntry(
                    next ? "info" : "warning",
                    `Port watch was ${next ? "enabled" : "paused"} for this process.`,
                  ),
                  stream: next ? "stdout" : "stderr",
                },
              ]);
              setCommandState(
                `${selectedProcess.name} port watch ${next ? "enabled" : "paused"}.`,
              );
            }}
            hex={accent.purple}
          />
        </div>

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
                    <StatusPill tone={processToneMap[process.status]} label={process.status} />
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
      {filteredProcesses.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-3">
          {filteredProcesses.map((process) => {
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
                className="w-full text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/34">{process.group}</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{process.name}</h3>
                  </div>
                  <StatusPill tone={processToneMap[process.status]} label={process.status} />
                </div>

                <p className="mt-4 text-sm text-white/54">{process.command}</p>

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
                <div className="mt-5 space-y-4 border-t border-white/8 pt-5">
                  <p className="text-sm text-white/56">{process.description}</p>
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
                </div>
              ) : null}
            </article>
          );
        })}
        </section>
      ) : (
        renderStatePanel({
          eyebrow: "Processes",
          title: "No services match this filter",
          detail:
            searchValue.length > 0
              ? `The current query "${query}" and process filter do not match any managed service.`
              : "No managed services are available from the current runtime snapshot.",
          hex: accent.cyan,
          icon: Server,
          actionLabel: "Reset Filters",
          onAction: () => {
            setQuery("");
            setStatusFilter("all");
          },
        })
      )}

      {filteredProcesses.length > 0 ? renderInspector() : null}
    </>
  );

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
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[0.6fr_0.7fr_1fr_0.9fr_0.8fr_1.2fr] gap-4 border-b border-white/8 px-5 py-4 text-xs uppercase tracking-[0.24em] text-white/38">
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
                    className="grid grid-cols-[0.6fr_0.7fr_1fr_0.9fr_0.8fr_1.2fr] gap-4 px-5 py-4 transition duration-300 hover:bg-white/[0.03]"
                  >
                    <p className="text-sm font-semibold text-white">{port.port}</p>
                    <p className="text-sm text-white/58 uppercase">{port.protocol}</p>
                    <div>
                      <p className="text-sm text-white/86">{port.service}</p>
                      <p className="text-xs text-white/38">{port.note}</p>
                    </div>
                    <p className="text-sm capitalize text-white/62">{port.exposure}</p>
                    <p className={`text-sm font-medium capitalize ${portTextClassMap[port.status]}`}>
                      {port.status}
                    </p>
                    <p className="text-sm text-white/46">{port.target}</p>
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
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.9fr)]">
      <div className={panelClass}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/42">System Monitor</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Host Pressure</h3>
          </div>
          <div className="rounded-full border border-white/10 bg-black/18 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/58">
            live sample
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {monitorMetrics.length > 0 ? (
            monitorMetrics.map((metric, index) => (
              <HologramProgress
                key={metric.id}
                label={metric.label}
                value={metric.value}
                hex={
                  index === 0
                    ? accent.amber
                    : index === 1
                      ? accent.cyan
                      : index === 2
                        ? accent.green
                        : accent.purple
                }
              />
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-black/18 px-4 py-5 text-sm text-white/48 md:col-span-2">
              Host metrics will appear here once the runtime source delivers a pressure snapshot.
            </div>
          )}
        </div>

        <div className="mt-5 rounded-[28px] border border-white/8 bg-black/18 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/38">Runtime Pulse</p>
              <p className="mt-2 text-lg font-semibold text-white">Current service waveform</p>
            </div>
            <Gauge size={20} className="text-amber-300" />
          </div>
          <div className="mt-4">
            <SignalBars values={[24, 46, 62, 71, 53, 88, 76, 68, 90, 58]} className="h-24" />
          </div>
        </div>
      </div>

      <div className={panelClass}>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/42">Noisy Services</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Top Resource Draw</h3>
        </div>

        <div className="mt-5 space-y-3">
          {busiestProcesses.length > 0 ? (
            busiestProcesses.map((process) => (
              <article
                key={process.id}
                className="rounded-[22px] border border-white/8 bg-[#0f141b]/94 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white/88">{process.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/34">
                      {process.command}
                    </p>
                  </div>
                  <StatusPill tone={processToneMap[process.status]} label={process.status} />
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
              </article>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-white/10 bg-black/18 px-4 py-5 text-sm text-white/48">
              Resource leaders will appear after the runtime delivers process telemetry.
            </div>
          )}
        </div>
      </div>
    </section>
  );

  const renderAutomationPage = () => (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
      <div className={panelClass}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/42">Automation Rules</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Session Guardrails</h3>
          </div>
          <div className="grid size-11 place-items-center rounded-[20px] border border-white/10 bg-black/18">
            <Workflow size={20} className="text-green-300" />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {automationRules.length > 0 ? (
            automationRules.map((rule) => (
              <div
                key={rule.id}
                className="rounded-[24px] border border-white/8 bg-[#0f141b]/94 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white/90">{rule.title}</p>
                    <p className="mt-1 text-sm text-white/54">{rule.detail}</p>
                    <p className="mt-3 text-[0.72rem] uppercase tracking-[0.22em] text-white/34">
                      {rule.cadence}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleRule(rule.id, !rule.enabled)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/18 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70 transition duration-300 hover:border-white/18 hover:text-white"
                    style={
                      rule.enabled
                        ? ({
                            boxShadow: `0 0 24px ${accent.green}22`,
                          } satisfies CSSProperties)
                        : undefined
                    }
                  >
                    <span
                      className="size-2.5 rounded-full"
                      style={{
                        backgroundColor: rule.enabled ? accent.green : "rgba(255,255,255,0.26)",
                      }}
                    />
                    {rule.enabled ? "On" : "Off"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/18 px-4 py-5 text-sm text-white/48">
              No automation rules have been provisioned for this workspace yet.
            </div>
          )}
        </div>
      </div>

      <div className={panelClass}>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/42">State</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Command Queue</h3>
        </div>
        <div className="mt-5 rounded-[24px] border border-white/8 bg-[#0f141b]/94 p-4">
          <p className="text-sm font-medium text-white/84">Latest command state</p>
          <p className="mt-2 text-sm text-white/54">{commandState}</p>
        </div>
        {isLiveElectronRuntime ? (
          <div className="mt-4 rounded-[24px] border border-white/8 bg-black/18 px-4 py-4">
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">
              Lifecycle wiring
            </p>
            <p className="mt-2 text-sm text-white/54">
              Live host scanning is active through Electron. Start, stop, and restart will be
              enabled once managed command execution is wired to the desktop bridge.
            </p>
          </div>
        ) : null}
        <div className="mt-4 rounded-[24px] border border-white/8 bg-[#0f141b]/94 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white/84">Runtime source</p>
              <p className="mt-2 text-sm text-white/54">{runtimeSource.detail}</p>
            </div>
            <StatusPill
              tone={runtimeSource.availability === "active" ? "online" : "starting"}
              label={runtimeSource.badgeLabel}
            />
          </div>
          <div className="mt-4 rounded-[20px] border border-white/8 bg-black/18 px-4 py-4">
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-white/34">
              Chosen host layer
            </p>
            <p className="mt-2 text-sm font-semibold text-white/88">{chosenHostLayer.label}</p>
            <p className="mt-2 text-sm text-white/54">{chosenHostLayer.summary}</p>
          </div>
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
          `Mewl is restoring saved filters, process state, and the current ${runtimeSource.label.toLowerCase()} snapshot before the cockpit becomes interactive.`,
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
          "The saved session data could not be read. Resetting the local workspace will rebuild the shell from the default runtime source.",
        hex: accent.rose,
        icon: BellRing,
        actionLabel: "Reset Session",
        onAction: restoreDefaultWorkspace,
      });
    }

    if (activeView === "processes") {
      return renderProcessesPage();
    }

    if (activeView === "ports") {
      return renderPortsPage();
    }

    if (activeView === "monitor") {
      return renderMonitorPage();
    }

    if (activeView === "automation") {
      return renderAutomationPage();
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
                src="/icon.png"
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
                ["CPU", `${hostCpu}%`],
                ["RAM", `${hostMemory}%`],
                ["Disk", `${hostDisk}%`],
                ["Net", `${hostNetwork}%`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[20px] border border-white/8 bg-black/18 px-3 py-3 text-sm">
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
                  hex={accent.green}
                  placeholder="Search services, ports, folders, or commands..."
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <ShinyButton
                  label="Start"
                  hex={accent.green}
                  icon={Play}
                  disabled={
                    !selectedProcess ||
                    isPending ||
                    runtimeStatus !== "ready" ||
                    isLiveElectronRuntime
                  }
                  onClick={() => handleProcessAction("start")}
                />
                <ShinyButton
                  label="Stop"
                  hex={accent.rose}
                  icon={Square}
                  disabled={
                    !selectedProcess ||
                    isPending ||
                    runtimeStatus !== "ready" ||
                    isLiveElectronRuntime
                  }
                  onClick={() => handleProcessAction("stop")}
                />
                <ShinyButton
                  label="Restart"
                  hex={accent.purple}
                  icon={RefreshCw}
                  disabled={
                    !selectedProcess ||
                    isPending ||
                    runtimeStatus !== "ready" ||
                    isLiveElectronRuntime
                  }
                  onClick={() => handleProcessAction("restart")}
                />
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
                  <div className="absolute right-0 top-[calc(100%+0.85rem)] z-50 w-[360px] rounded-[26px] border border-white/8 bg-[#0c1015]/96 p-3 shadow-[0_34px_90px_-42px_rgba(0,0,0,0.96)] backdrop-blur-2xl">
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
    </div>
  );
}

export default App;
