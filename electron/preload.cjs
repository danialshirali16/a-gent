const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aGentDesktop', {
  platform: process.platform,
  selectDirectory: () => ipcRenderer.invoke('a-gent:select-directory'),
  openExternal: url => ipcRenderer.invoke('a-gent:open-external', url),
});
