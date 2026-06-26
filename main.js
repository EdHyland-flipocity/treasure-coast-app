const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path  = require('path');
const http  = require('http');
const { spawn, exec } = require('child_process');

const PHP_PORT = 8093;
const APP_ROOT = path.join(__dirname, 'www');

let mainWindow  = null;
let phpServer   = null;
let serverReady = false;

function startPHPServer() {
    return new Promise((resolve, reject) => {
        exec('php --version', (err) => {
            if (err) {
                dialog.showErrorBox('PHP Required',
                    'PHP is required to run this application.\n\n' +
                    'Linux:   sudo apt install php php-mysql\n' +
                    'macOS:   brew install php\n' +
                    'Windows: https://windows.php.net/download/');
                app.quit();
                return;
            }

            phpServer = spawn('php', ['-S', `127.0.0.1:${PHP_PORT}`, '-t', APP_ROOT], {
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: false,
                env: { ...process.env, PHP_CLI_SERVER_WORKERS: '4' },
            });

            phpServer.stderr.on('data', d => console.log('[PHP]', d.toString().trim()));
            phpServer.on('error', err => reject(err));

            let attempts = 0;
            const poll = setInterval(() => {
                attempts++;
                http.get(`http://127.0.0.1:${PHP_PORT}/stlucie_report/`, res => {
                    clearInterval(poll);
                    serverReady = true;
                    resolve();
                }).on('error', () => {
                    if (attempts > 30) { clearInterval(poll); reject(new Error('PHP server timeout')); }
                });
            }, 300);
        });
    });
}

function stopPHPServer() {
    if (phpServer) { phpServer.kill(); phpServer = null; }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1440, height: 760, minWidth: 900, minHeight: 600,
        title: 'Treasure Coast Intelligence Platform',
        backgroundColor: '#060D1A',
        webPreferences: {
            nodeIntegration: false, contextIsolation: true,
            webviewTag: true, webSecurity: false,
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        show: false, maximizable: true,
    });

    mainWindow.loadFile(path.join(__dirname, 'app.html'));
    mainWindow.once('ready-to-show', () => { mainWindow.show(); mainWindow.focus(); });
    mainWindow.on('closed', () => { mainWindow = null; });
}

function buildMenu() {
    const template = [
        { label: 'File', submenu: [
            { label: 'Refresh', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.webContents.send('refresh') },
            { type: 'separator' }, { role: 'quit' }
        ]},
        { label: 'View', submenu: [
            { label: 'SL Market Report',   accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.webContents.send('navigate', 'slreport') },
            { label: 'SL Sales Registry',  accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.webContents.send('navigate', 'slsales') },
            { label: 'Martin Report',      accelerator: 'CmdOrCtrl+3', click: () => mainWindow?.webContents.send('navigate', 'martinreport') },
            { label: 'Martin Matchmaker',  accelerator: 'CmdOrCtrl+4', click: () => mainWindow?.webContents.send('navigate', 'martinmatch') },
            { label: 'Martin Radar',       accelerator: 'CmdOrCtrl+5', click: () => mainWindow?.webContents.send('navigate', 'martinradar') },
            { label: 'Flip Tracker',       accelerator: 'CmdOrCtrl+6', click: () => mainWindow?.webContents.send('navigate', 'fliptracker') },
            { label: 'Entity Intel',       accelerator: 'CmdOrCtrl+7', click: () => mainWindow?.webContents.send('navigate', 'entityintel') },
            { label: 'Indian River County', accelerator: 'CmdOrCtrl+8', click: () => mainWindow?.webContents.send('navigate', 'irreport') },
            { type: 'separator' },
            { role: 'togglefullscreen' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' },
        ]},
        { label: 'Developer', submenu: [{ role: 'toggleDevTools' }] },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.handle('get-php-port', () => PHP_PORT);
ipcMain.handle('get-server-ready', () => serverReady);

app.whenReady().then(async () => {
    buildMenu();
    try {
        console.log('Starting PHP server on port', PHP_PORT);
        await startPHPServer();
        console.log('PHP server ready');
    } catch (err) { console.error('PHP server failed:', err); }
    createWindow();
});

app.on('window-all-closed', () => { stopPHPServer(); if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => stopPHPServer());
