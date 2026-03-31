import {
  createInitialRuntimeSnapshot,
  hydrateMockRuntime,
  type RuntimeSnapshot,
} from "../data/runtime";

export type HostLayerChoice = "electron";

export type RuntimeSourceId = "mock" | "electron";

export type RuntimeCapability =
  | "process-control"
  | "port-discovery"
  | "host-metrics"
  | "secure-command-execution";

export type RuntimeSourceDescriptor = {
  id: RuntimeSourceId;
  label: string;
  badgeLabel: string;
  detail: string;
  hostLayer: HostLayerChoice;
  availability: "active" | "fallback";
  capabilities: RuntimeCapability[];
};

export type MewlHostBridge = {
  hydrateRuntimeSnapshot: () => Promise<RuntimeSnapshot>;
  createDefaultRuntimeSnapshot?: () => Promise<RuntimeSnapshot>;
  performProcessAction?: (
    action: "start" | "stop" | "restart" | "scan",
    processId: string,
  ) => Promise<RuntimeActionResult>;
  updateManagedService?: (
    processId: string,
    updates: { autoStart?: boolean; watchPorts?: boolean },
  ) => Promise<RuntimeActionResult>;
  applyAutomationRule?: (ruleId: string, enabled: boolean) => Promise<RuntimeActionResult>;
};

export type RuntimeActionResult = {
  snapshot: RuntimeSnapshot;
  message: string;
};

export const chosenHostLayer = {
  id: "electron" as const,
  label: "Electron",
  summary:
    "Electron is the chosen native host for Mewl so the desktop shell, process control, and bridge contract can stay in the TypeScript stack.",
  rationale: [
    "The current product is already a React + TypeScript + Vite app, so Electron keeps the renderer and native bridge in one language and delivery pipeline.",
    "Mewl needs direct access to process spawning, termination, port inspection, and host telemetry, which maps naturally to Electron's main process.",
    "Electron's preload plus contextBridge model gives the app a secure seam for exposing only the runtime APIs the renderer needs.",
  ],
  implementationNotes: [
    "Run process control, port discovery, and machine telemetry in the Electron main process.",
    "Expose a narrow preload API to the renderer instead of leaking Node primitives into the UI.",
    "Keep the renderer contract aligned with RuntimeSnapshot so the existing mock-first UI can swap sources without large component changes.",
  ],
};

function hasWindowObject(): boolean {
  return typeof window !== "undefined";
}

export function getHostBridge(): MewlHostBridge | null {
  if (!hasWindowObject()) {
    return null;
  }

  return window.mewlHost ?? null;
}

export function getRuntimeSourceDescriptor(): RuntimeSourceDescriptor {
  const bridge = getHostBridge();

  if (bridge) {
    return {
      id: "electron",
      label: "Electron bridge",
      badgeLabel: "electron live",
      detail:
        "The renderer is connected to the Electron preload bridge and is reading live host state.",
      hostLayer: chosenHostLayer.id,
      availability: "active",
      capabilities: [
        "process-control",
        "port-discovery",
        "host-metrics",
        "secure-command-execution",
      ],
    };
  }

  return {
    id: "mock",
    label: "Mock runtime",
    badgeLabel: "mock fallback",
    detail:
      "The renderer is running against the temporary mock contract outside the Electron desktop shell.",
    hostLayer: chosenHostLayer.id,
    availability: "fallback",
    capabilities: [],
  };
}

export async function hydrateRuntimeSnapshot(): Promise<RuntimeSnapshot> {
  const bridge = getHostBridge();

  if (bridge) {
    return bridge.hydrateRuntimeSnapshot();
  }

  return hydrateMockRuntime();
}

export async function createDefaultRuntimeSnapshot(): Promise<RuntimeSnapshot> {
  const bridge = getHostBridge();

  if (bridge?.createDefaultRuntimeSnapshot) {
    return bridge.createDefaultRuntimeSnapshot();
  }

  return createInitialRuntimeSnapshot();
}
