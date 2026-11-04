const { app, BrowserWindow, dialog, ipcMain, session, shell } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { randomUUID } = require('node:crypto');

app.setName('A Gent');
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
let mainWindow;
let backend;
let trustedOrigin;
let quitPending = false;

function preparePath() {
  const candidates = process.platform === 'win32'
    ? [process.env.APPDATA && path.join(process.env.APPDATA, 'npm')]
    : ['/opt/homebrew/opt/node@24/bin', path.join(os.homedir(), '.local', 'bin'), '/usr/local/bin', '/opt/homebrew/bin'];
  process.env.PATH = [...candidates.filter(candidate => candidate && fs.existsSync(candidate)), process.env.PATH || ''].join(path.delimiter);
}
function assertTrusted(event) {
  if (!event.senderFrame || new URL(event.senderFrame.url).origin !== trustedOrigin) throw new Error('This window cannot use A Gent desktop actions.');
}
function externalUrl(value) {
  const url = new URL(value);
  if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) throw new Error('Only web and email links can be opened.');
  return url.href;
}
function openExternal(value) {
  try { return shell.openExternal(externalUrl(value)); } catch { return Promise.resolve(); }
}

async function createWindow() {
  preparePath();
  let url = process.env.AGENT_DEV_URL;
  if (url) {
    const parsed = new URL(url);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname)) throw new Error('The development server must be on this computer.');
  } else if (backend) {
    url = backend.url;
  } else {
    const module = await import(pathToFileURL(path.join(app.getAppPath(), 'dist-server', 'index.mjs')).href);
    const userData = app.getPath('userData');
    const portFile = path.join(userData, 'backend-port.json');
    let rememberedPort = 0;
    try {
      const stored = JSON.parse(fs.readFileSync(portFile, 'utf8'));
      if (Number.isInteger(stored.port) && stored.port >= 1024 && stored.port <= 65535) rememberedPort = stored.port;
    } catch {}
    const options = {
      port: rememberedPort,
      host: '127.0.0.1',
      dataDir: path.join(userData, 'workspace'),
      staticDir: path.join(app.getAppPath(), 'dist'),
      dev: false,
    };
    try {
      backend = await module.startServer(options);
    } catch (error) {
      if (!rememberedPort || error.code !== 'EADDRINUSE') throw error;
      backend = await module.startServer({ ...options, port: 0 });
    }
    const selectedPort = Number(new URL(backend.url).port);
    const temporaryPortFile = path.join(userData, 'backend-port.' + randomUUID() + '.tmp');
    try {
      fs.mkdirSync(userData, { recursive: true });
      fs.writeFileSync(temporaryPortFile, JSON.stringify({ port: selectedPort }), { encoding: 'utf8', mode: 0o600, flag: 'wx' });
      fs.renameSync(temporaryPortFile, portFile);
    } catch {
      try { fs.unlinkSync(temporaryPortFile); } catch {}
    }
    try {
      await session.defaultSession.cookies.set({ url: backend.url, name: 'agent_desktop_token', value: backend.token, httpOnly: true, sameSite: 'strict' });
    } catch { /* the desktop page will fall back to manual pairing */ }
    url = backend.url;
  }
  trustedOrigin = new URL(url).origin;
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  const windowChrome = process.platform === 'darwin'
    ? { titleBarStyle: 'hiddenInset', trafficLightPosition: { x: 16, y: 16 } }
    : process.platform === 'win32'
      ? { titleBarStyle: 'hidden', titleBarOverlay: { color: '#0e0e0e', symbolColor: '#f5f5f5', height: 38 } }
      : {};
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 900,
    minWidth: 760,
    minHeight: 560,
    title: 'A Gent',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    backgroundColor: '#111111',
    autoHideMenuBar: true,
    ...windowChrome,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => { void openExternal(target); return { action: 'deny' }; });
  mainWindow.webContents.on('will-navigate', (event, target) => {
    if (new URL(target).origin !== trustedOrigin) { event.preventDefault(); void openExternal(target); }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
  await mainWindow.loadURL(url);
}

ipcMain.handle('a-gent:select-directory', async event => {
  assertTrusted(event);
  const selected = await dialog.showOpenDialog(mainWindow, { title: 'Choose a workspace for A Gent', properties: ['openDirectory', 'createDirectory'] });
  return selected.canceled ? null : selected.filePaths[0] || null;
});
ipcMain.handle('a-gent:open-external', async (event, url) => { assertTrusted(event); await shell.openExternal(externalUrl(url)); });

app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });
if (gotLock) app.whenReady().then(createWindow).catch(error => { dialog.showErrorBox('A Gent could not start', error.message); app.quit(); });
app.on('activate', () => { if (!mainWindow) void createWindow().catch(error => dialog.showErrorBox('A Gent could not open', error.message)); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', event => {
  if (backend && !quitPending) {
    event.preventDefault();
    quitPending = true;
    const stop = backend.close();
    const deadline = new Promise(resolve => setTimeout(resolve, 5000));
    Promise.race([stop, deadline]).catch(() => {}).finally(() => { backend = null; app.quit(); });
  }
});
