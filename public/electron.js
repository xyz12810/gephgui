const { app, BrowserWindow, Tray } = require("electron");
const path = require("path");
const url = require("url");
const isDev = require("electron-is-dev");
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

const gotTheLock = app.requestSingleInstanceLock();

function createWindow() {
  // Create the browser window.
  const { shell } = require("electron");

  win = new BrowserWindow({
    width: 400,
    height: 670,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    },
    show: false
  });
  win.once("ready-to-show", () => {
    win.show();
  });
  win.setMenuBarVisibility(false);
  win.webContents.on("new-window", function(event, url) {
    event.preventDefault();
    shell.openExternal(url);
  });
  win.setResizable(false);
  win.setMaximizable(false);
  win.setMenu(null);
  // Prevent the UI itself from being routed through Geph
  win.webContents.session.setProxy(
    {
      proxyRules: "direct://"
    },
    () => console.log("UI proxy unset")
  );

  // and load the index.html of the app.
  if (isDev) {
    win.loadURL("http://localhost:8100/");
    win.setResizable(true);
    win.toggleDevTools();
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, "../build/index.html"),
        protocol: "file:",
        slashes: true
      })
    );
  }

  // Emitted when the window is closed.
  win.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

if (!gotTheLock) {
  app.quit();
  return;
}
app.on("second-instance", (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (win) {
    if (win.isMinimized()) win.restore();
    win.show();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
let tray = null;
app.on("ready", () => {
  createWindow();
  tray = new Tray(app.getAppPath() + "/icons/tray.png");
  tray.on("click", _ => {
    console.log("win.isVisible() = " + win.isVisible());
    if (win.isVisible()) {
      win.hide();
    } else {
      console.log("win.isMinimized() = " + win.isMinimized());
      if (win.isMinimized()) {
        win.restore();
        win.focus();
      }
      win.show();
    }
  });
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  app.quit();
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});
