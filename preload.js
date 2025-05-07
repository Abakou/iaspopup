const { contextBridge, ipcRenderer } = require('electron');

// Exposer les fonctions protégées à la page web
contextBridge.exposeInMainWorld('electronAPI', {
  closeWindow: () => ipcRenderer.send('close-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  toggleMaximize: () => ipcRenderer.send('toggle-maximize'),
  setOpacity: (opacity) => ipcRenderer.send('set-opacity', opacity),
  toggleAlwaysOnTop: () => ipcRenderer.send('toggle-always-on-top'),
  onAlwaysOnTopChanged: (callback) => ipcRenderer.on('always-on-top-changed', (_, value) => callback(value)),
  switchAI: (aiId) => ipcRenderer.send('switch-ai', aiId),
  onCurrentAIChanged: (callback) => ipcRenderer.on('current-ai-changed', (_, aiId, aiName) => callback(aiId, aiName))
});