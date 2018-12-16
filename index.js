const { app, BrowserWindow, Menu } = require('electron');
const fs = require('fs');

let win, lastChangeTime;

// Упрощенная версия electron-reload, только без десятков зависимостей :)
if(!app.isPackaged) {
  fs.watch('.', { recursive: true }, (event, filename) => {
    let prevChangeTime = lastChangeTime;
    lastChangeTime = new Date().getTime();
    if(prevChangeTime < lastChangeTime - 250 || !filename) return;

    let ignoredFiles = [
      '.git', 'core', 'vue-devtools', '.gitignore',
      'index.js', 'LICENSE', 'package.json', 'README.md'
    ];

	let isIgnored = ignoredFiles.find((ignoredPath) => {
      let regexp = new RegExp(`${ignoredPath}/`),
          path = filename.replace(/\\/g, '/');

      return ignoredPath == path || path.match(regexp);
    });

    if(isIgnored) return;

    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.reloadIgnoringCache();
    });
  });
}

app.on('ready', () => {
  // Расширение для удобной разработки на Vue
  if(fs.readdirSync('.').find((file) => file == 'vue-devtools')) {
    BrowserWindow.addDevToolsExtension('./vue-devtools');
  }

  const { screen } = require('electron');

  win = new BrowserWindow({
    minWidth: 360,
    minHeight: 480,
    show: false,
    frame: false,
    // Необходимо для нормального отображения кнопок управления окном на MacOS
    titleBarStyle: 'hidden'
  });

  win.webContents.once('dom-ready', async () => {
    let data = await win.webContents.executeJavaScript('localStorage.getItem("settings")'),
        { width, height } = screen.getPrimaryDisplay().workAreaSize;

    if(data) {
      let settings = JSON.parse(data);

      if(settings.window) {
        let maximized = settings.window.width >= width && settings.window.height >= height;

        win.setBounds({
          x: settings.window.x,
          y: settings.window.y,
          width: maximized ? width : settings.window.width,
          height: maximized ? height : settings.window.height
        });

        if(maximized) win.maximize();
      }
    }

    // событие ready-to-show вызывается до окончания выполнения
    // executeJavaScript и окно показывается до смены координат.
    // И чтобы не видеть перемещение окна после его открытия,
    // мы просто показываем окно после смены этих координат.
    win.show();
  });

  // фикс невозможности вставки текста из буфера обмена в инпуты на MacOS
  if(process.platform == 'darwin') {
    let menuTemplate = [{
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    }];

    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  } else win.setMenu(null);

  win.loadFile('renderer/index.html');
  win.on('closed', () => win = null);
});

app.on('window-all-closed', app.exit);
