const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    getPhpPort:     ()   => ipcRenderer.invoke('get-php-port'),
    getServerReady: ()   => ipcRenderer.invoke('get-server-ready'),
    onNavigate:     (cb) => ipcRenderer.on('navigate',   (_, tab) => cb(tab)),
    onRefresh:      (cb) => ipcRenderer.on('refresh',    ()       => cb()),
    onExportPdf:    (cb) => ipcRenderer.on('export-pdf', ()       => cb()),
});
