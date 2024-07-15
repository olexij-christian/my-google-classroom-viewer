const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const {
  getClassroomData,
  TOKEN_PATH,
  getDocumentsDirectory,
} = require("./src/google.js");

const isAuthorized = fs.existsSync(TOKEN_PATH);

// save cache
const UPDATE_TIME_PATH = path.join(getDocumentsDirectory(), "history.txt");

if (!fs.existsSync(UPDATE_TIME_PATH)) fs.writeFileSync(UPDATE_TIME_PATH, "");

const lastUpdateTime = new Date(
  parseInt(fs.readFileSync(UPDATE_TIME_PATH).toString()) || Date.now()
);

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "./src/preload.js"),
    },
  });

  ipcMain.on("open", (event, link) => shell.openExternal(link));

  ipcMain.on("exitAccount", () => {
    fs.unlinkSync(TOKEN_PATH);
    app.relaunch();
    app.exit();
  });

  ipcMain.on("init", (event) => {
    win.webContents.send("onIsAuthorized", isAuthorized);
    win.webContents.send("onGetLastUpdateTime", lastUpdateTime);
  });

  ipcMain.on("saveLastUpdateTime", () => {
    fs.writeFileSync(UPDATE_TIME_PATH, Date.now().toString());
  });

  ipcMain.on("getClassroomData", (event) => {
    getClassroomData({
      onAuthorize: () => win.webContents.send("onAuthorize"),
      onCourseStartLoading: (courseName, percent) =>
        win.webContents.send("onCourseStartLoading", courseName, percent),
      onInternetConnectProblem: () =>
        win.webContents.send("onInternetConnectProblem"),
    })
      .catch((err) => console.error(err))
      .then((data) => win.webContents.send("onCourseFullLoaded", data));
  });

  win.loadFile("./src/index.html");
};

app
  .whenReady()
  .then(() => {
    createWindow();
  })
  .catch((err) => {
    console.error(err);
  });
