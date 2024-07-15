const { contextBridge, ipcRenderer } = require("electron/renderer");

contextBridge.exposeInMainWorld("electronAPI", {
  init: () => ipcRenderer.send("init"),
  onIsAuthorized: (callback) => ipcRenderer.on("onIsAuthorized", callback),
  getClassroomData: (props) => ipcRenderer.send("getClassroomData", props),
  onAuthorize: (callback) => ipcRenderer.on("onAuthorize", callback),
  onCourseFullLoaded: (callback) =>
    ipcRenderer.on("onCourseFullLoaded", callback),
  onCourseStartLoading: (callback) =>
    ipcRenderer.on("onCourseStartLoading", callback),

  onInternetConnectProblem: (callback) =>
    ipcRenderer.on("onInternetConnectProblem", callback),

  open: (link) => ipcRenderer.send("open", link),

  onGetLastUpdateTime: (callback) =>
    ipcRenderer.on("onGetLastUpdateTime", callback),
  saveLastUpdateTime: () => ipcRenderer.send("saveLastUpdateTime"),

  exitAccount: () => ipcRenderer.send("exitAccount"),
});
