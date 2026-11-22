
import { app, BrowserWindow, ipcMain } from "electron";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const runBackend = promisify(execFile);

async function callBackend(args) {
  const exePath = path.join(
    app.getAppPath(),
    "backend",
    "fintracker.exe"
  );

  const { stdout } = await runBackend(exePath, args, {
    cwd: app.getAppPath(),
    windowsHide: true,
  });

  return JSON.parse(stdout);
}

ipcMain.handle("transaction:list", () =>
  callBackend(["list"])
);

ipcMain.handle("transaction:add", (_, data) =>
  callBackend([
    "add",
    data.title,
    data.type,
    data.category,
    String(data.amount),
    data.date,
  ])
);

ipcMain.handle("transaction:summary", () =>
  callBackend(["summary"])
);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(
        app.getAppPath(),
        "electron",
        "preload.cjs"
      ),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL("http://localhost:5173");
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
