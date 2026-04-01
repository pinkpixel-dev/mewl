const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mewlHost", {
  hydrateRuntimeSnapshot: () => ipcRenderer.invoke("mewl:hydrate-runtime"),
  subscribeToLogs: (listener) => {
    const handler = (_event, events) => {
      listener(Array.isArray(events) ? events : []);
    };

    ipcRenderer.on("mewl:logs-batch", handler);
    return () => {
      ipcRenderer.removeListener("mewl:logs-batch", handler);
    };
  },
  performProcessAction: (action, processId) =>
    ipcRenderer.invoke("mewl:process-action", { action, processId }),
  updateManagedService: (processId, updates) =>
    ipcRenderer.invoke("mewl:update-managed-service", { processId, updates }),
  createManagedService: (service) => ipcRenderer.invoke("mewl:create-managed-service", { service }),
  removeManagedService: (processId) =>
    ipcRenderer.invoke("mewl:remove-managed-service", { processId }),
  applyAutomationRule: (ruleId, enabled) =>
    ipcRenderer.invoke("mewl:apply-automation-rule", { ruleId, enabled }),
});
