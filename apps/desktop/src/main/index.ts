import { app, shell, BrowserWindow, session } from 'electron'
import { join } from 'node:path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { registerAuthIpc } from './auth-ipc'

const API_ORIGIN = 'http://localhost:3000'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
      webSecurity: true
    }
  })

  win.on('ready-to-show', () => win.show())

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('will-navigate', (event, url) => {
    const target = new URL(url)
    const devServer = process.env['ELECTRON_RENDERER_URL']
    const allowed = devServer ? new URL(devServer).origin : 'file://'
    if (target.origin !== allowed) event.preventDefault()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.orsbe.desktoplumo')

  const devServerOrigin = process.env['ELECTRON_RENDERER_URL']
  const devServerWs = devServerOrigin ? devServerOrigin.replace(/^http/, 'ws') : ''

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders }
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === 'content-security-policy') delete headers[key]
    }

    const csp = [
      "default-src 'self'",
      is.dev
        ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${devServerOrigin}`
        : "script-src 'self'",
      is.dev
        ? `connect-src 'self' ${API_ORIGIN} ${devServerOrigin} ${devServerWs}`
        : `connect-src 'self' ${API_ORIGIN}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'"
    ].join('; ')

    callback({
      responseHeaders: {
        ...headers,
        'Content-Security-Policy': [csp]
      }
    })
  })

  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false))

  registerAuthIpc()

  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
