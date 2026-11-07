const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('buong', {
  /** Báo cho tiến trình chính biết có cần chặn Windows treo app hay không. */
  dangChay: (bat) => ipcRenderer.send('chuong:dang-chay', Boolean(bat)),
});
