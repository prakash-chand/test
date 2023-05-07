require("./app.js");


const {
  app,
  BrowserWindow,
  ipcMain,
  nativeTheme,
  shell
} = require('electron')
const path = require('path')


function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 1200,
    minHeight: 900,
    autoHideMenuBar: true,
    title: "Goyral Bulk Email",
    icon: __dirname + '/icon.ico',
    webPreferences: {
      preload: __dirname + '/preload.js',
      devTools: true
    }
  })
  win.loadURL('http://localhost:3000/')
}

app.whenReady().then(() => {
  createWindow()
})


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})


ipcMain.on('hotspot-event', (event, arg) => {
  event.returnValue = 'Message received!'
  require('electron').shell.openExternal(`${arg}`);
})