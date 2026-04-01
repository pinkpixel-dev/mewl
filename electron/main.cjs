const path = require("node:path");
const { app, BrowserWindow, ipcMain } = require("electron");
const {
  hydrateRuntimeSnapshot,
  performProcessAction,
  shutdownManagedServices,
  setRuntimeLogBatchListener,
  updateManagedService,
  createManagedService,
  removeManagedService,
  applyAutomationRule,
} = require("./runtime.cjs");

const devServerUrl = process.env.MEWL_RENDERER_URL;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1540,
    height: 960,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: "#07090d",
    title: "Mewl",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error("Mewl renderer failed to load", {
      errorCode,
      errorDescription,
      validatedURL,
    });
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    console.error("Mewl renderer process exited unexpectedly", details);
  });

  mainWindow.on("closed", () => {
    if (!app.isQuitting) {
      app.quit();
    }
  });

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
    return mainWindow;
  }

  void mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  return mainWindow;
}

async function bootstrap() {
  ipcMain.handle("mewl:hydrate-runtime", async () => hydrateRuntimeSnapshot());
  ipcMain.handle("mewl:process-action", async (_event, payload) =>
    performProcessAction(payload.action, payload.processId),
  );
  ipcMain.handle("mewl:update-managed-service", async (_event, payload) =>
    updateManagedService(payload.processId, payload.updates),
  );
  ipcMain.handle("mewl:create-managed-service", async (_event, payload) =>
    createManagedService(payload.service),
  );
  ipcMain.handle("mewl:remove-managed-service", async (_event, payload) =>
    removeManagedService(payload.processId),
  );
  ipcMain.handle("mewl:apply-automation-rule", async (_event, payload) =>
    applyAutomationRule(payload.ruleId, payload.enabled),
  );

  await app.whenReady();
  setRuntimeLogBatchListener((events) => {
    for (const window of BrowserWindow.getAllWindows()) {
      if (!window.isDestroyed()) {
        window.webContents.send("mewl:logs-batch", events);
      }
    }
  });
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

app.setName("Mewl");

void bootstrap();

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  app.isQuitting = true;
  await shutdownManagedServices();
});
