const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mewlHost", {
  hydrateRuntimeSnapshot: () => ipcRenderer.invoke("mewl:hydrate-runtime"),
  performProcessAction: (action, processId) =>
    ipcRenderer.invoke("mewl:process-action", { action, processId }),
  setProcessManagement: (processId, managed) =>
    ipcRenderer.invoke("mewl:set-process-management", { processId, managed }),
  updateManagedService: (processId, updates) =>
    ipcRenderer.invoke("mewl:update-managed-service", { processId, updates }),
  applyAutomationRule: (ruleId, enabled) =>
    ipcRenderer.invoke("mewl:apply-automation-rule", { ruleId, enabled }),
});
