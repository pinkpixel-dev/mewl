const path = require("node:path");
const { app, BrowserWindow, ipcMain } = require("electron");
const { hydrateRuntimeSnapshot } = require("./runtime.cjs");

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

  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
    return mainWindow;
  }

  void mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  return mainWindow;
}

async function bootstrap() {
  ipcMain.handle("mewl:hydrate-runtime", async () => hydrateRuntimeSnapshot());

  await app.whenReady();
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
