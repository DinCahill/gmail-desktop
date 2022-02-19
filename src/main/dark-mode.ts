import { nativeTheme, ipcMain } from 'electron'
import { darkModeInitConfig } from '../types'
import config, { ConfigKey } from './config'
import { getSelectedAccountView, sendToAccountViews } from './account-views'
import { sendToMainWindow } from './main-window'

export async function initDarkMode() {
  switch (config.get(ConfigKey.DarkMode)) {
    case 'system':
      nativeTheme.themeSource = 'system'
      break
    case true:
      nativeTheme.themeSource = 'dark'
      break
    default:
      nativeTheme.themeSource = 'light'
  }

  ipcMain.handle('init-dark-mode', (event) => {
    const selectedAccountView = getSelectedAccountView()
    const response: darkModeInitConfig = {
      enabled: nativeTheme.shouldUseDarkColors,
      initLazy: event.sender.id !== selectedAccountView?.webContents.id
    }
    return response
  })

  nativeTheme.on('updated', () => {
    sendToMainWindow('dark-mode-updated', nativeTheme.shouldUseDarkColors)
    sendToAccountViews('dark-mode-updated', nativeTheme.shouldUseDarkColors)
  })
}
