const { app, BrowserWindow, powerSaveBlocker, ipcMain, Menu } = require('electron');
const path = require('path');

/**
 * Giữ cho Windows không treo tiến trình khi máy vào chế độ tiết kiệm điện.
 * Chỉ bật trong lúc chuông đang chạy, tắt ngay khi người dùng bấm Dừng.
 */
let khoaNguThiD = null;

function moKhoaNgu() {
  if (khoaNguThiD !== null) return;
  khoaNguThiD = powerSaveBlocker.start('prevent-app-suspension');
}

function dongKhoaNgu() {
  if (khoaNguThiD === null) return;
  powerSaveBlocker.stop(khoaNguThiD);
  khoaNguThiD = null;
}

function taoCuaSo() {
  const cuaSo = new BrowserWindow({
    width: 420,
    height: 760,
    minWidth: 360,
    minHeight: 640,
    backgroundColor: '#000000',
    title: 'Buông',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'renderer', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Bắt buộc: mặc định Chromium bóp nhịp đồng hồ của cửa sổ bị thu nhỏ,
      // sau 5 phút ẩn thì chỉ còn chạy mỗi phút một lần hoặc đóng băng hẳn.
      // Mốc 10/15/20/30 phút vì thế bị lỡ, còn mốc ngắn thì chưa kịp bị bóp.
      backgroundThrottling: false,
    },
  });

  cuaSo.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  return cuaSo;
}

// Chỉ cho mở một cửa sổ: mở hai lần thì hai đồng hồ chạy lệch nhau.
const docQuyen = app.requestSingleInstanceLock();
if (!docQuyen) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const cs = BrowserWindow.getAllWindows()[0];
    if (cs) {
      if (cs.isMinimized()) cs.restore();
      cs.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null);
    taoCuaSo();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) taoCuaSo();
    });
  });

  app.on('window-all-closed', () => {
    dongKhoaNgu();
    app.quit();
  });
}

ipcMain.on('chuong:dang-chay', (_su, dangChay) => {
  if (dangChay) moKhoaNgu();
  else dongKhoaNgu();
});
