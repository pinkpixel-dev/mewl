const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mewlHost", {
  hydrateRuntimeSnapshot: () => ipcRenderer.invoke("mewl:hydrate-runtime"),
  createDefaultRuntimeSnapshot: () => ipcRenderer.invoke("mewl:hydrate-runtime"),
  performProcessAction: (action, processId) =>
    ipcRenderer.invoke("mewl:process-action", { action, processId }),
  updateManagedService: (processId, updates) =>
    ipcRenderer.invoke("mewl:update-managed-service", { processId, updates }),
  applyAutomationRule: (ruleId, enabled) =>
    ipcRenderer.invoke("mewl:apply-automation-rule", { ruleId, enabled }),
});
