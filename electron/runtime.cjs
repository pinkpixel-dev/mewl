const os = require("node:os");
const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile, spawn } = require("node:child_process");
const { promisify } = require("node:util");

const execFileAsync = promisify(execFile);
const processLimit = 18;
const sampleDelayMs = 180;
const oneMegabyte = 1024 * 1024;
const managedLogTailLimit = 12;
const serviceConfigPath = path.join(process.cwd(), "mewl.services.json");
const repoRoot = process.cwd();
const managedServiceState = new Map();
let autoStartInitialized = false;
const defaultInheritedEnvKeys = ["PATH", "HOME", "LANG", "TERM", "USER", "LOGNAME", "SHELL"];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatStamp(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function createLogEntry(level, text) {
  return {
    id: `live-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    stamp: formatStamp(),
    level,
    text,
  };
}

function isSafeEnvKey(key) {
  return /^[A-Z_][A-Z0-9_]*$/i.test(key);
}

function trimLogEntries(entries) {
  return entries.slice(-managedLogTailLimit);
}

function appendManagedLogEntry(logs, stream, entry) {
  logs[stream] = trimLogEntries([...logs[stream], entry]);
}

function getManagedState(serviceId) {
  const existing = managedServiceState.get(serviceId);
  if (existing) {
    return existing;
  }

  const created = {
    child: null,
    starting: false,
    stopping: false,
    restartCount: 0,
    startedAt: null,
    lastExit: "No recent exit",
    lastHeartbeat: "idle",
    logs: {
      stdout: [],
      stderr: [],
    },
  };
  managedServiceState.set(serviceId, created);
  return created;
}

async function runCommand(command, args) {
  const result = await execFileAsync(command, args, {
    maxBuffer: 12 * 1024 * 1024,
  });

  return result.stdout.trim();
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch (_error) {
    return false;
  }
}

async function resolveExecutable(command, envPath) {
  if (!command || /\s/.test(command.trim())) {
    throw new Error("Managed service commands must be a single executable token with no shell parsing.");
  }

  if (command.includes(path.sep)) {
    const resolvedPath = path.resolve(repoRoot, command);
    if (!resolvedPath.startsWith(repoRoot)) {
      throw new Error("Managed service executables must live inside the workspace when using a path.");
    }

    if (!(await pathExists(resolvedPath))) {
      throw new Error(`Managed executable not found: ${resolvedPath}`);
    }

    return resolvedPath;
  }

  const searchPaths = (envPath || process.env.PATH || "")
    .split(path.delimiter)
    .filter(Boolean);

  for (const searchPath of searchPaths) {
    const candidate = path.join(searchPath, command);
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Managed executable "${command}" is not available on the configured PATH.`);
}

async function runCommandWithFallback(commands) {
  for (const candidate of commands) {
    try {
      return await runCommand(candidate.command, candidate.args);
    } catch (error) {
      if (candidate === commands[commands.length - 1]) {
        throw error;
      }
    }
  }

  return "";
}

function readCpuTimes() {
  return os.cpus().reduce(
    (totals, cpu) => {
      totals.idle += cpu.times.idle;
      totals.total += Object.values(cpu.times).reduce((sum, value) => sum + value, 0);
      return totals;
    },
    { idle: 0, total: 0 },
  );
}

async function sampleCpuUsage() {
  const start = readCpuTimes();
  await delay(sampleDelayMs);
  const end = readCpuTimes();
  const idleDelta = end.idle - start.idle;
  const totalDelta = end.total - start.total;

  if (totalDelta <= 0) {
    return 0;
  }

  return clamp(Math.round((1 - idleDelta / totalDelta) * 100), 0, 100);
}

async function readNetworkBytes() {
  const interfacesPath = "/sys/class/net";
  const interfaceNames = await fs.readdir(interfacesPath);
  const activeNames = interfaceNames.filter((name) => name !== "lo");

  const counters = await Promise.all(
    activeNames.map(async (name) => {
      try {
        const [rxBytes, txBytes] = await Promise.all([
          fs.readFile(path.join(interfacesPath, name, "statistics", "rx_bytes"), "utf8"),
          fs.readFile(path.join(interfacesPath, name, "statistics", "tx_bytes"), "utf8"),
        ]);

        return Number(rxBytes.trim()) + Number(txBytes.trim());
      } catch (_error) {
        return 0;
      }
    }),
  );

  return counters.reduce((sum, value) => sum + value, 0);
}

function formatThroughput(bytesPerSecond) {
  if (bytesPerSecond >= oneMegabyte) {
    return `${(bytesPerSecond / oneMegabyte).toFixed(1)} MB/s`;
  }

  return `${Math.round(bytesPerSecond / 1024)} KB/s`;
}

async function sampleNetworkUsage() {
  const start = await readNetworkBytes();
  await delay(sampleDelayMs);
  const end = await readNetworkBytes();
  const bytesPerSecond = Math.max(0, Math.round(((end - start) * 1000) / sampleDelayMs));
  const percent = clamp(Math.round((bytesPerSecond / (5 * oneMegabyte)) * 100), 0, 100);

  return {
    percent,
    bytesPerSecond,
  };
}

async function readDiskUsage() {
  const output = await runCommand("df", ["-kP", "/"]);
  const lines = output.split("\n").filter(Boolean);
  const fields = lines[lines.length - 1]?.trim().split(/\s+/) ?? [];
  const capacityField = fields[4] ?? "0%";

  return clamp(Number.parseInt(capacityField.replace("%", ""), 10) || 0, 0, 100);
}

function normalizeRuntime(command, args) {
  const joined = `${command} ${args}`.toLowerCase();

  if (joined.includes("electron")) {
    return "electron";
  }

  if (joined.includes("node")) {
    return "node";
  }

  if (joined.includes("python")) {
    return "python";
  }

  if (joined.includes("docker")) {
    return "docker";
  }

  if (joined.includes("chrome") || joined.includes("chromium") || joined.includes("firefox")) {
    return "browser";
  }

  return command.toLowerCase();
}

function normalizeGroup(runtime, cwd) {
  if (cwd.includes("/PROJECTS/") || cwd.includes("/code/") || cwd.includes("/src/")) {
    return "workspace";
  }

  if (runtime === "browser") {
    return "browser";
  }

  if (runtime === "electron" || runtime === "node" || runtime === "python") {
    return "development";
  }

  return "system";
}

function normalizeStatus(state) {
  if (state.includes("T") || state.includes("Z") || state.includes("X")) {
    return "degraded";
  }

  return "running";
}

function formatElapsed(raw) {
  if (!raw) {
    return "unknown";
  }

  if (raw.includes("-")) {
    const [days, rest] = raw.split("-");
    return `${days}d ${rest}`;
  }

  return raw;
}

function formatManagedElapsed(startedAt) {
  if (!startedAt) {
    return "stopped";
  }

  const seconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}

function inferExposure(target) {
  if (
    target.startsWith("127.0.0.1:") ||
    target.startsWith("[::1]:") ||
    target.startsWith("localhost:")
  ) {
    return "local";
  }

  if (
    target.startsWith("*:") ||
    target.startsWith("0.0.0.0:") ||
    target.startsWith("[::]:")
  ) {
    return "public";
  }

  return "internal";
}

async function readWorkingDirectory(pid) {
  try {
    return await fs.readlink(`/proc/${pid}/cwd`);
  } catch (_error) {
    return "";
  }
}

async function readUserProcesses() {
  const username = os.userInfo().username;
  const output = await runCommand("ps", [
    "-u",
    username,
    "-o",
    "pid=",
    "-o",
    "ppid=",
    "-o",
    "comm=",
    "-o",
    "%cpu=",
    "-o",
    "rss=",
    "-o",
    "etime=",
    "-o",
    "state=",
    "-o",
    "args=",
    "--sort=-pcpu,-rss",
  ]);

  const rows = output.split("\n").filter(Boolean);
  const parsed = rows
    .map((row) => {
      const match = row.match(
        /^\s*(\d+)\s+(\d+)\s+(\S+)\s+([\d.]+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(.*)$/,
      );

      if (!match) {
        return null;
      }

      const [, pid, ppid, command, cpu, rss, elapsed, state, args] = match;

      return {
        pid: Number(pid),
        ppid: Number(ppid),
        command,
        args,
        cpu: Math.round(Number.parseFloat(cpu) || 0),
        memoryMb: Math.max(1, Math.round((Number.parseInt(rss, 10) || 0) / 1024)),
        elapsed,
        state,
      };
    })
    .filter(Boolean);

  return Promise.all(
    parsed.map(async (processRow) => ({
      ...processRow,
      cwd: await readWorkingDirectory(processRow.pid),
    })),
  );
}

function parsePortFromTarget(target) {
  const match = target.match(/:(\d+)(?:\s+\(LISTEN\))?$/);
  return match ? Number(match[1]) : null;
}

async function readPortBindings() {
  const username = os.userInfo().username;
  const output = await runCommandWithFallback([
    {
      command: "lsof",
      args: ["-nP", "-u", username, "-iTCP", "-iUDP"],
    },
    {
      command: "ss",
      args: ["-lntup"],
    },
  ]);

  if (!output) {
    return [];
  }

  if (output.startsWith("COMMAND")) {
    return output
      .split("\n")
      .slice(1)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/\s+/))
      .map((parts) => {
        const protocol = parts[7]?.toLowerCase() ?? "tcp";
        const target = parts.slice(8).join(" ").replace(/\s+\(LISTEN\)$/, "");
        const port = parsePortFromTarget(target);

        if (!port) {
          return null;
        }

        if (target.includes("->")) {
          return null;
        }

        if (protocol === "tcp" && !parts.slice(8).join(" ").includes("(LISTEN)")) {
          return null;
        }

        return {
          pid: Number(parts[1]),
          protocol,
          port,
          target,
        };
      })
      .filter(Boolean);
  }

  return output
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s+/);
      const protocol = parts[0]?.toLowerCase();
      const localAddress = parts[4];
      const processDetails = parts.slice(6).join(" ");
      const pidMatch = processDetails.match(/pid=(\d+)/);
      const port = parsePortFromTarget(localAddress);

      if (!pidMatch || !port) {
        return null;
      }

      return {
        pid: Number(pidMatch[1]),
        protocol: protocol.startsWith("udp") ? "udp" : "tcp",
        port,
        target: localAddress,
      };
    })
    .filter(Boolean);
}

async function loadManagedConfig() {
  try {
    const raw = await fs.readFile(serviceConfigPath, "utf8");
    const parsed = JSON.parse(raw);
    const services = Array.isArray(parsed.services) ? parsed.services : [];
    const profiles = Array.isArray(parsed.profiles) ? parsed.profiles : [];

    return {
      services: services
        .filter((service) => typeof service.id === "string" && typeof service.command === "string")
        .map((service) => ({
        id: service.id,
        name: typeof service.name === "string" ? service.name : service.id,
        description:
          typeof service.description === "string"
            ? service.description
            : "Managed command registered for the Mewl desktop bridge.",
        command: service.command,
        args: Array.isArray(service.args)
          ? service.args.filter((value) => typeof value === "string")
          : [],
        cwd: typeof service.cwd === "string" ? service.cwd : ".",
        runtime: typeof service.runtime === "string" ? service.runtime : "",
        group: typeof service.group === "string" ? service.group : "managed",
        watchPorts: service.watchPorts !== false,
        autoStart: service.autoStart === true,
        ports: Array.isArray(service.ports)
          ? service.ports.filter((value) => Number.isInteger(value))
          : [],
        inheritEnv: Array.isArray(service.inheritEnv)
          ? service.inheritEnv.filter(
              (value) => typeof value === "string" && isSafeEnvKey(value),
            )
          : [...defaultInheritedEnvKeys],
        env:
          service.env && typeof service.env === "object" && !Array.isArray(service.env)
            ? Object.fromEntries(
                Object.entries(service.env).filter(
                  ([key, value]) => isSafeEnvKey(key) && typeof value === "string",
                ),
              )
            : {},
        })),
      profiles: profiles
        .filter((profile) => typeof profile.id === "string")
        .map((profile) => ({
          id: profile.id,
          title: typeof profile.title === "string" ? profile.title : profile.id,
          detail:
            typeof profile.detail === "string"
              ? profile.detail
              : "Managed startup profile for the Electron runtime bridge.",
          cadence: typeof profile.cadence === "string" ? profile.cadence : "manual profile",
          enabled: profile.enabled === true,
          action: profile.action === "stop" ? "stop" : "start",
          serviceIds: Array.isArray(profile.serviceIds)
            ? profile.serviceIds.filter((value) => typeof value === "string")
            : [],
        })),
    };
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") {
      return { services: [], profiles: [] };
    }

    throw error;
  }
}

async function saveManagedConfig(config) {
  await fs.writeFile(
    serviceConfigPath,
    `${JSON.stringify(config, null, 2)}\n`,
    "utf8",
  );
}

function resolveServiceCwd(relativeCwd) {
  const resolvedPath = path.resolve(repoRoot, relativeCwd);
  if (!resolvedPath.startsWith(repoRoot)) {
    throw new Error("Managed service working directories must stay inside the workspace root.");
  }
  return resolvedPath;
}

function markHeartbeat(serviceState, label) {
  serviceState.lastHeartbeat = label;
}

function attachChildListeners(service, serviceState, child) {
  child.stdout?.on("data", (chunk) => {
    appendManagedLogEntry(
      serviceState.logs,
      "stdout",
      createLogEntry("info", String(chunk).trim() || "stdout updated"),
    );
    markHeartbeat(serviceState, "live");
  });

  child.stderr?.on("data", (chunk) => {
    appendManagedLogEntry(
      serviceState.logs,
      "stderr",
      createLogEntry("warning", String(chunk).trim() || "stderr updated"),
    );
    markHeartbeat(serviceState, "live");
  });

  child.on("spawn", () => {
    serviceState.starting = false;
    serviceState.stopping = false;
    serviceState.startedAt = Date.now();
    serviceState.lastExit = "No recent exit";
    markHeartbeat(serviceState, "just now");
    appendManagedLogEntry(
      serviceState.logs,
      "stdout",
      createLogEntry(
        "info",
        `Managed service ${service.name} started with pid ${child.pid}.`,
      ),
    );
  });

  child.on("error", (error) => {
    serviceState.child = null;
    serviceState.starting = false;
    serviceState.stopping = false;
    serviceState.startedAt = null;
    serviceState.lastExit = error.message;
    markHeartbeat(serviceState, "idle");
    appendManagedLogEntry(
      serviceState.logs,
      "stderr",
      createLogEntry("error", `Managed service ${service.name} failed to start: ${error.message}`),
    );
  });

  child.on("exit", (code, signal) => {
    serviceState.child = null;
    serviceState.starting = false;
    serviceState.stopping = false;
    serviceState.startedAt = null;
    serviceState.lastExit =
      code === 0
        ? "Clean exit from the Electron bridge"
        : signal
          ? `Exited after signal ${signal}`
          : `Exited with code ${code ?? "unknown"}`;
    markHeartbeat(serviceState, "idle");
    appendManagedLogEntry(
      serviceState.logs,
      code === 0 ? "stdout" : "stderr",
      createLogEntry(
        code === 0 ? "info" : "error",
        `Managed service ${service.name} exited (${serviceState.lastExit}).`,
      ),
    );
  });
}

function isServiceRunning(serviceState) {
  return Boolean(serviceState.child && serviceState.child.exitCode === null);
}

function buildManagedEnvironment(service) {
  const env = {};

  for (const key of service.inheritEnv) {
    if (typeof process.env[key] === "string") {
      env[key] = process.env[key];
    }
  }

  return {
    ...env,
    ...service.env,
  };
}

async function assertReservedPortsAvailable(service) {
  if (!service.watchPorts || service.ports.length === 0) {
    return;
  }

  const bindings = await readPortBindings();
  const occupiedPorts = new Set(
    bindings
      .filter((binding) => service.ports.includes(binding.port))
      .map((binding) => binding.port),
  );

  if (occupiedPorts.size > 0) {
    throw new Error(
      `${service.name} could not start because reserved port${occupiedPorts.size === 1 ? "" : "s"} ${Array.from(occupiedPorts).join(", ")} ${occupiedPorts.size === 1 ? "is" : "are"} already in use.`,
    );
  }
}

async function startManagedService(service) {
  const serviceState = getManagedState(service.id);
  if (isServiceRunning(serviceState)) {
    return "Service is already running.";
  }

  serviceState.starting = true;
  serviceState.stopping = false;
  appendManagedLogEntry(
    serviceState.logs,
    "stdout",
    createLogEntry("info", `Start requested for ${service.name}.`),
  );

  const cwd = resolveServiceCwd(service.cwd);
  const env = buildManagedEnvironment(service);
  const executable = await resolveExecutable(service.command, env.PATH);
  await assertReservedPortsAvailable(service);

  const child = spawn(executable, service.args, {
    cwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
    shell: false,
  });

  serviceState.child = child;
  attachChildListeners(service, serviceState, child);
  return `Started ${service.name}.`;
}

function waitForChildExit(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve();
      return;
    }

    child.once("exit", () => resolve());
  });
}

function buildAutomationRules(services, profiles) {
  return [
    ...services.flatMap((service) => [
    {
      id: `service-autostart:${service.id}`,
      title: `${service.name} autostart`,
      detail: `Launch ${service.name} automatically when the managed workspace boots.`,
      cadence: "session start",
      enabled: service.autoStart,
    },
    {
      id: `service-watch:${service.id}`,
      title: `${service.name} watch ports`,
      detail: `Include ${service.name} in watched binding scans and collision summaries.`,
      cadence: "live scan",
      enabled: service.watchPorts,
    },
    ]),
    ...profiles.map((profile) => ({
      id: `profile:${profile.id}`,
      title: profile.title,
      detail: profile.detail,
      cadence: profile.cadence,
      enabled: profile.enabled,
    })),
  ];
}

async function stopManagedService(service) {
  const serviceState = getManagedState(service.id);
  if (!isServiceRunning(serviceState)) {
    return "Service is already stopped.";
  }

  serviceState.stopping = true;
  appendManagedLogEntry(
    serviceState.logs,
    "stdout",
    createLogEntry("warning", `Stop requested for ${service.name}.`),
  );

  const child = serviceState.child;

  if (process.platform === "win32") {
    child.kill("SIGTERM");
  } else {
    process.kill(-child.pid, "SIGTERM");
  }

  await Promise.race([
    waitForChildExit(child),
    delay(4000).then(() => {
      if (child.exitCode === null) {
        if (process.platform === "win32") {
          child.kill("SIGKILL");
        } else {
          process.kill(-child.pid, "SIGKILL");
        }
      }
    }),
  ]);

  return `Stopped ${service.name}.`;
}

async function restartManagedService(service) {
  const serviceState = getManagedState(service.id);
  serviceState.restartCount += 1;

  if (isServiceRunning(serviceState)) {
    await stopManagedService(service);
  }

  await startManagedService(service);
  return `Restarted ${service.name}.`;
}

async function initializeManagedServices() {
  if (autoStartInitialized) {
    return;
  }

  autoStartInitialized = true;
  const { services, profiles } = await loadManagedConfig();

  for (const service of services.filter((item) => item.autoStart)) {
    try {
      await startManagedService(service);
    } catch (error) {
      const serviceState = getManagedState(service.id);
      serviceState.starting = false;
      serviceState.lastExit = error instanceof Error ? error.message : "Autostart failed.";
      appendManagedLogEntry(
        serviceState.logs,
        "stderr",
        createLogEntry(
          "error",
          error instanceof Error
            ? error.message
            : `Autostart failed for ${service.name}.`,
        ),
      );
    }
  }

  for (const profile of profiles.filter((item) => item.enabled && item.action === "start")) {
    for (const serviceId of profile.serviceIds) {
      const service = services.find((item) => item.id === serviceId);
      if (service) {
        try {
          await startManagedService(service);
        } catch (error) {
          const serviceState = getManagedState(service.id);
          serviceState.starting = false;
          serviceState.lastExit = error instanceof Error ? error.message : "Profile boot failed.";
          appendManagedLogEntry(
            serviceState.logs,
            "stderr",
            createLogEntry(
              "error",
              error instanceof Error
                ? error.message
                : `Profile boot failed for ${service.name}.`,
            ),
          );
        }
      }
    }
  }
}

function buildAlerts(processes, ports, metrics, services) {
  const alerts = [];
  const conflictPorts = ports.filter((port) => port.status === "conflict");
  const publicPorts = ports.filter((port) => port.exposure === "public");
  const hotProcess = processes[0];
  const stoppedManaged = services.filter((service) => {
    const serviceState = getManagedState(service.id);
    return !isServiceRunning(serviceState);
  });

  if (conflictPorts.length > 0) {
    alerts.push({
      id: "live-alert-conflicts",
      title: "Port conflict detected",
      detail: `${conflictPorts.length} live binding${conflictPorts.length === 1 ? "" : "s"} share a reserved port.`,
      severity: "critical",
      stamp: "now",
    });
  }

  if (publicPorts.length > 0) {
    alerts.push({
      id: "live-alert-public",
      title: "Public listeners exposed",
      detail: `${publicPorts.length} binding${publicPorts.length === 1 ? "" : "s"} are reachable beyond localhost.`,
      severity: "warning",
      stamp: "now",
    });
  }

  if (hotProcess && hotProcess.cpu >= 70) {
    alerts.push({
      id: "live-alert-cpu",
      title: "Hot process on the host",
      detail: `${hotProcess.name} is currently leading CPU usage at ${hotProcess.cpu}%.`,
      severity: "warning",
      stamp: "now",
    });
  }

  if (metrics.memory.value >= 80) {
    alerts.push({
      id: "live-alert-memory",
      title: "Memory pressure is elevated",
      detail: `Host memory pressure is currently ${metrics.memory.value}%.`,
      severity: "warning",
      stamp: "now",
    });
  }

  if (stoppedManaged.length > 0) {
    alerts.push({
      id: "live-alert-managed",
      title: "Managed service is parked",
      detail: `${stoppedManaged[0].name} is registered with Mewl and ready to start from the desktop bridge.`,
      severity: "info",
      stamp: "now",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      id: "live-alert-quiet",
      title: "Live host snapshot is healthy",
      detail: "No immediate port conflicts or pressure spikes were detected in the latest scan.",
      severity: "info",
      stamp: "now",
    });
  }

  return alerts.slice(0, 6);
}

async function hydrateRuntimeSnapshot() {
  await initializeManagedServices();

  const [cpuPercent, networkUsage, diskPercent, rawProcesses, rawBindings, config] =
    await Promise.all([
      sampleCpuUsage(),
      sampleNetworkUsage(),
      readDiskUsage(),
      readUserProcesses(),
      readPortBindings(),
      loadManagedConfig(),
    ]);
  const { services, profiles } = config;

  const memoryPercent = clamp(
    Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
    0,
    100,
  );

  const processByPid = new Map(rawProcesses.map((processRow) => [processRow.pid, processRow]));
  const portMap = new Map();
  for (const binding of rawBindings) {
    const list = portMap.get(binding.pid) ?? [];
    list.push(binding);
    portMap.set(binding.pid, list);
  }

  const processLookup = new Map();
  const managedPids = new Set();

  const managedProcesses = services.map((service) => {
    const serviceState = getManagedState(service.id);
    const childPid = serviceState.child?.pid ?? null;
    const liveProcess = childPid ? processByPid.get(childPid) ?? null : null;
    const livePorts = childPid ? portMap.get(childPid) ?? [] : [];
    const reservedPorts = Array.from(new Set([...service.ports, ...livePorts.map((item) => item.port)]));
    const runtime = service.runtime || normalizeRuntime(service.command, service.args.join(" "));
    const status = serviceState.starting
      ? "starting"
      : liveProcess
        ? normalizeStatus(liveProcess.state)
        : "stopped";

    if (childPid) {
      managedPids.add(childPid);
    }

    const record = {
      id: service.id,
      name: service.name,
      group: service.group,
      description: service.description,
      command: [service.command, ...service.args].join(" "),
      cwd: resolveServiceCwd(service.cwd),
      runtime,
      status,
      pid: childPid,
      ports: reservedPorts,
      cpu: liveProcess ? clamp(liveProcess.cpu, 0, 100) : 0,
      memory: liveProcess ? liveProcess.memoryMb : 0,
      network: 0,
      uptime: liveProcess ? formatElapsed(liveProcess.elapsed) : formatManagedElapsed(serviceState.startedAt),
      restarts: serviceState.restartCount,
      lastExit: serviceState.lastExit,
      lastHeartbeat: liveProcess ? "live" : serviceState.lastHeartbeat,
      autoStart: service.autoStart,
      watchPorts: service.watchPorts,
      managed: true,
      logs: serviceState.logs,
    };

    if (childPid) {
      processLookup.set(childPid, record);
    }

    return record;
  });

  const selectedPids = new Set([
    ...rawProcesses.slice(0, processLimit).map((processRow) => processRow.pid),
    ...rawBindings.map((binding) => binding.pid),
  ]);

  const discoveredProcesses = rawProcesses
    .filter((processRow) => selectedPids.has(processRow.pid) && !managedPids.has(processRow.pid))
    .sort((left, right) => right.cpu + right.memoryMb / 25 - (left.cpu + left.memoryMb / 25))
    .map((processRow) => {
      const runtime = normalizeRuntime(processRow.command, processRow.args);
      const group = normalizeGroup(runtime, processRow.cwd);
      const processPorts = (portMap.get(processRow.pid) ?? []).map((binding) => binding.port);
      const status = normalizeStatus(processRow.state);
      const processRecord = {
        id: `pid-${processRow.pid}`,
        name: path.basename(processRow.command),
        group,
        description: processRow.cwd
          ? `${runtime} process discovered from ${processRow.cwd}.`
          : `${runtime} process discovered from the live host scan.`,
        command: processRow.args,
        cwd: processRow.cwd || "unknown",
        runtime,
        status,
        pid: processRow.pid,
        ports: processPorts,
        cpu: clamp(processRow.cpu, 0, 100),
        memory: processRow.memoryMb,
        network: 0,
        uptime: formatElapsed(processRow.elapsed),
        restarts: 0,
        lastExit: "Exit history is not available for discovered live processes.",
        lastHeartbeat: "live",
        autoStart: false,
        watchPorts: processPorts.length > 0,
        managed: false,
        logs: {
          stdout: [
            createLogEntry(
              "info",
              `Discovered ${processRow.args} from the Electron host runtime scan.`,
            ),
          ],
          stderr:
            status === "degraded"
              ? [createLogEntry("warning", "This process is reporting a non-running kernel state.")]
              : [],
        },
      };

      processLookup.set(processRow.pid, processRecord);
      return processRecord;
    });

  const portGroups = new Map();
  for (const binding of rawBindings) {
    const key = `${binding.protocol}:${binding.port}`;
    const list = portGroups.get(key) ?? [];
    list.push(binding.pid);
    portGroups.set(key, list);
  }

  const ports = rawBindings
    .filter((binding) => processLookup.has(binding.pid))
    .map((binding) => {
      const owningProcess = processLookup.get(binding.pid);
      const status =
        (portGroups.get(`${binding.protocol}:${binding.port}`) ?? []).length > 1
          ? "conflict"
          : "bound";
      const exposure = inferExposure(binding.target);

      return {
        id: `port-${binding.protocol}-${binding.port}-pid-${binding.pid}`,
        port: binding.port,
        protocol: binding.protocol,
        serviceId: owningProcess.id,
        service: owningProcess.name,
        target: binding.target,
        exposure,
        status,
        note:
          status === "conflict"
            ? "Multiple live processes are currently bound to this host port."
            : exposure === "public"
              ? "Listener is reachable beyond the loopback interface."
              : "Listener was discovered from the live host scan.",
      };
    })
    .sort((left, right) => left.port - right.port);

  const metrics = {
    cpu: {
      id: "cpu",
      label: "Host CPU",
      value: cpuPercent,
      detail: "Live sample from Electron host CPU polling.",
    },
    memory: {
      id: "memory",
      label: "Memory Pressure",
      value: memoryPercent,
      detail: `Using ${Math.floor((os.totalmem() - os.freemem()) / oneMegabyte)} MB of ${Math.floor(os.totalmem() / oneMegabyte)} MB.`,
    },
    disk: {
      id: "disk",
      label: "Disk Activity",
      value: diskPercent,
      detail: "Root filesystem usage from the current host disk sample.",
    },
    network: {
      id: "network",
      label: "Network Chatter",
      value: networkUsage.percent,
      detail: `Observed ${formatThroughput(networkUsage.bytesPerSecond)} across active interfaces.`,
    },
  };

  return {
    processes: [...managedProcesses, ...discoveredProcesses],
    ports,
    alerts: buildAlerts([...managedProcesses, ...discoveredProcesses], ports, metrics, services),
    monitorMetrics: [metrics.cpu, metrics.memory, metrics.disk, metrics.network],
    automationRules: buildAutomationRules(services, profiles),
  };
}

async function performProcessAction(action, processId) {
  if (action === "scan") {
    return {
      snapshot: await hydrateRuntimeSnapshot(),
      message: "Live host scan completed.",
    };
  }

  const { services } = await loadManagedConfig();
  const service = services.find((item) => item.id === processId);

  if (!service) {
    throw new Error("Only configured Mewl-managed services can be controlled from the desktop bridge.");
  }

  let message;
  if (action === "start") {
    message = await startManagedService(service);
  } else if (action === "stop") {
    message = await stopManagedService(service);
  } else if (action === "restart") {
    message = await restartManagedService(service);
  } else {
    throw new Error(`Unsupported action: ${action}`);
  }

  return {
    snapshot: await hydrateRuntimeSnapshot(),
    message,
  };
}

async function updateManagedService(processId, updates) {
  const config = await loadManagedConfig();
  const serviceIndex = config.services.findIndex((service) => service.id === processId);

  if (serviceIndex === -1) {
    throw new Error("Only configured Mewl-managed services can be edited from the desktop bridge.");
  }

  const nextService = {
    ...config.services[serviceIndex],
    autoStart:
      typeof updates.autoStart === "boolean"
        ? updates.autoStart
        : config.services[serviceIndex].autoStart,
    watchPorts:
      typeof updates.watchPorts === "boolean"
        ? updates.watchPorts
        : config.services[serviceIndex].watchPorts,
  };

  config.services[serviceIndex] = nextService;
  await saveManagedConfig(config);

  return {
    snapshot: await hydrateRuntimeSnapshot(),
    message: `${nextService.name} settings updated.`,
  };
}

async function applyAutomationRule(ruleId, enabled) {
  const config = await loadManagedConfig();

  if (ruleId.startsWith("service-autostart:")) {
    const processId = ruleId.replace("service-autostart:", "");
    return updateManagedService(processId, { autoStart: enabled });
  }

  if (ruleId.startsWith("service-watch:")) {
    const processId = ruleId.replace("service-watch:", "");
    return updateManagedService(processId, { watchPorts: enabled });
  }

  if (ruleId.startsWith("profile:")) {
    const profileId = ruleId.replace("profile:", "");
    const profileIndex = config.profiles.findIndex((profile) => profile.id === profileId);

    if (profileIndex === -1) {
      throw new Error("The requested startup profile was not found in mewl.services.json.");
    }

    const profile = { ...config.profiles[profileIndex], enabled };
    config.profiles[profileIndex] = profile;
    await saveManagedConfig(config);

    for (const serviceId of profile.serviceIds) {
      const service = config.services.find((item) => item.id === serviceId);
      if (!service) {
        continue;
      }

      if (profile.action === "start" && enabled) {
        await startManagedService(service);
      }

      if (profile.action === "stop" && enabled) {
        await stopManagedService(service);
      }
    }

    return {
      snapshot: await hydrateRuntimeSnapshot(),
      message: `${profile.title} ${enabled ? "enabled" : "disabled"}.`,
    };
  }

  throw new Error("This automation rule is not managed by the Electron bridge.");
}

async function shutdownManagedServices() {
  const { services } = await loadManagedConfig();

  for (const service of services) {
    const serviceState = getManagedState(service.id);
    if (isServiceRunning(serviceState)) {
      await stopManagedService(service);
    }
  }
}

module.exports = {
  hydrateRuntimeSnapshot,
  performProcessAction,
  updateManagedService,
  applyAutomationRule,
  shutdownManagedServices,
};
