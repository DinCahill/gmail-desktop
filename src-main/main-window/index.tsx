import * as path from 'path'
import { app, BrowserWindow, nativeTheme } from 'electron'
import { is } from 'electron-util'
import { getSelectedAccount } from '../accounts'
import config, { ConfigKey } from '../config'
import { toggleAppVisiblityTrayItem } from '../tray'
import { setAppMenuBarVisibility } from '../utils'
import { getAccountView, getSelectedAccountView } from '../account-views'
import { getIsQuitting } from '../app'
import { openExternalUrl, shouldStartMinimized } from '../helpers'
import { ipcMain } from 'electron/main'
import { getAppMenu } from '../app-menu'

let mainWindow: BrowserWindow

export function getMainWindow() {
  return mainWindow
}

export function sendToMainWindow(channel: string, ...args: any[]) {
  mainWindow.webContents.send(channel, ...args)
}

export function createMainWindow(): void {
  const lastWindowState = config.get(ConfigKey.LastWindowState)

  mainWindow = new BrowserWindow({
    title: app.name,
    titleBarStyle: 'hiddenInset',
    frame: is.macos,
    minWidth: 780,
    width: lastWindowState.bounds.width,
    minHeight: 200,
    height: lastWindowState.bounds.height,
    x: lastWindowState.bounds.x,
    y: lastWindowState.bounds.y,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'main-window', 'preload.js')
    },
    show: !shouldStartMinimized(),
    icon: is.linux
      ? path.join(__dirname, '..', 'static', 'icon.png')
      : undefined,
    darkTheme: nativeTheme.shouldUseDarkColors
  })

  if (lastWindowState.fullscreen && !mainWindow.isFullScreen()) {
    mainWindow.setFullScreen(lastWindowState.fullscreen)
  }

  if (lastWindowState.maximized && !mainWindow.isMaximized()) {
    mainWindow.maximize()
  }

  if (is.linux || is.windows) {
    setAppMenuBarVisibility()
  }

  mainWindow.loadFile(path.resolve(__dirname, '..', 'static', 'index.html'))

  mainWindow.on('app-command', (_event, command) => {
    const selectedAccount = getSelectedAccount()

    if (!selectedAccount) {
      return
    }

    const view = getAccountView(selectedAccount.id)

    if (!view) {
      return
    }

    if (command === 'browser-backward' && view.webContents.canGoBack()) {
      view.webContents.goBack()
    } else if (
      command === 'browser-forward' &&
      view.webContents.canGoForward()
    ) {
      view.webContents.goForward()
    }
  })

  mainWindow.on('close', (error) => {
    if (!getIsQuitting()) {
      error.preventDefault()
      mainWindow.blur()
      mainWindow.hide()
    }
  })

  mainWindow.on('hide', () => {
    toggleAppVisiblityTrayItem(false)
  })

  mainWindow.on('show', () => {
    toggleAppVisiblityTrayItem(true)
  })

  mainWindow.on('focus', () => {
    const selectedAccountView = getSelectedAccountView()
    if (selectedAccountView) {
      selectedAccountView.webContents.focus()
    }
  })

  mainWindow.webContents.on('dom-ready', () => {
    if (!shouldStartMinimized()) {
      mainWindow.show()
    }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    event.preventDefault()
    openExternalUrl(url)
  })

  if (!is.macos) {
    mainWindow.on('maximize', () => {
      sendToMainWindow('window:maximized')
    })

    mainWindow.on('unmaximize', () => {
      sendToMainWindow('window:unmaximized')
    })

    ipcMain.handle('window:is-maximized', () => mainWindow.isMaximized())

    ipcMain.on('title-bar:open-app-menu', () => {
      const appMenu = getAppMenu()
      appMenu.popup({
        window: mainWindow,
        callback: () => {
          appMenu.closePopup(mainWindow)
        }
      })
    })

    ipcMain.on('window:minimize', () => {
      mainWindow.minimize()
    })

    ipcMain.on('window:maximize', () => {
      mainWindow.maximize()
    })

    ipcMain.on('window:unmaximize', () => {
      mainWindow.unmaximize()
    })

    ipcMain.on('window:close', () => {
      mainWindow.close()
    })
  }
}
