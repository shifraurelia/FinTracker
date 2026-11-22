
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("fintracker", {
  getTransactions: () => ipcRenderer.invoke("transaction:list"),
  addTransaction: (data) => ipcRenderer.invoke("transaction:add", data),
  getSummary: () => ipcRenderer.invoke("transaction:summary"),
});
