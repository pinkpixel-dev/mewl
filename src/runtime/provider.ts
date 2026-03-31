import {
  type ManagedServiceDraft,
  type ManagedServiceUpdate,
  type RuntimeSnapshot,
} from "../data/runtime";

export type HostLayerChoice = "electron";

export type RuntimeSourceId = "desktop-required" | "electron";

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
  availability: "active" | "unavailable";
  capabilities: RuntimeCapability[];
};

export type MewlHostBridge = {
  hydrateRuntimeSnapshot: () => Promise<RuntimeSnapshot>;
  performProcessAction?: (
    action: "start" | "stop" | "restart" | "scan" | "kill",
    processId: string,
  ) => Promise<RuntimeActionResult>;
  updateManagedService?: (
    processId: string,
    updates: ManagedServiceUpdate,
  ) => Promise<RuntimeActionResult>;
  createManagedService?: (service: ManagedServiceDraft) => Promise<RuntimeActionResult>;
  removeManagedService?: (processId: string) => Promise<RuntimeActionResult>;
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
    "Keep the renderer contract aligned with RuntimeSnapshot so the UI only boots when the Electron bridge is available.",
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
      badgeLabel: "",
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
    id: "desktop-required",
    label: "Desktop bridge required",
    badgeLabel: "desktop required",
    detail:
      "Mewl now requires the Electron desktop bridge and does not expose a browser-only runtime fallback.",
    hostLayer: chosenHostLayer.id,
    availability: "unavailable",
    capabilities: [],
  };
}

export async function hydrateRuntimeSnapshot(): Promise<RuntimeSnapshot> {
  const bridge = getHostBridge();

  if (bridge) {
    return bridge.hydrateRuntimeSnapshot();
  }

  throw new Error(
    "Mewl requires the Electron desktop bridge. Launch the app with npm run dev:desktop or npm run desktop.",
  );
}
