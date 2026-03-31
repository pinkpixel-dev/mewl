const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mewlHost", {
  hydrateRuntimeSnapshot: () => ipcRenderer.invoke("mewl:hydrate-runtime"),
  createDefaultRuntimeSnapshot: () => ipcRenderer.invoke("mewl:hydrate-runtime"),
  performProcessAction: (action, processId) =>
    ipcRenderer.invoke("mewl:process-action", { action, processId }),
});
