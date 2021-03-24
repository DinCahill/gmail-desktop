import {
  app,
  shell,
  Menu,
  MenuItemConstructorOptions,
  dialog,
  nativeTheme
} from 'electron'
import * as fs from 'fs'
import { is } from 'electron-util'

import { checkForUpdates, changeReleaseChannel } from './updates'
import config, { ConfigKey } from './config'
import {
  setCustomStyle,
  USER_CUSTOM_STYLE_PATH
} from './account-views/custom-styles'
import { viewLogs } from './logs'
import { showRestartDialog, setAppMenuBarVisibility } from './utils'
import { enableAutoFixUserAgent, removeCustomUserAgent } from './user-agent'
import { getAccountsMenuItems, getSelectedAccount } from './accounts'
import { sendToMainWindow } from './main-window'
import {
  forEachAccountView,
  getSelectedAccountView,
  hideAccountViews
} from './account-views'
import { GMAIL_URL } from './constants'

interface AppearanceMenuItem {
  key: ConfigKey
  label: string
  restartDialogText?: string
  setMenuBarVisibility?: boolean
}

export function initOrUpdateAppMenu() {
  const appearanceMenuItems: AppearanceMenuItem[] = [
    {
      key: ConfigKey.CompactHeader,
      label: 'Compact Header',
      restartDialogText: 'compact header'
    },
    {
      key: ConfigKey.HideFooter,
      label: 'Hide Footer'
    },
    {
      key: ConfigKey.HideSupport,
      label: 'Hide Support'
    }
  ]

  const createAppearanceMenuItem = ({
    key,
    label,
    restartDialogText,
    setMenuBarVisibility
  }: AppearanceMenuItem): MenuItemConstructorOptions => ({
    label,
    type: 'checkbox',
    checked: config.get(key) as boolean,
    click({ checked }: { checked: boolean }) {
      config.set(key, checked)

      // If the style changes requires a restart, don't add or remove the class
      // name from the DOM
      if (restartDialogText) {
        showRestartDialog(checked, restartDialogText)
      } else {
        setCustomStyle(key, checked)
      }

      if (setMenuBarVisibility) {
        setAppMenuBarVisibility(true)
      }
    }
  })

  if (is.linux || is.windows) {
    appearanceMenuItems.unshift({
      key: ConfigKey.AutoHideMenuBar,
      label: 'Hide Menu bar',
      setMenuBarVisibility: true
    })
  }

  const appMenu: MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        {
          label: `About ${app.name}`,
          role: 'about'
        },
        {
          label: 'Check for Updates...',
          click() {
            checkForUpdates()
          }
        },
        {
          type: 'separator'
        },
        {
          label: `Hide ${app.name}`,
          accelerator: 'CommandOrControl+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'CommandOrControl+Shift+H',
          role: 'hideOthers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          label: `Quit ${app.name}`,
          accelerator: 'CommandOrControl+Q',
          click() {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Accounts',
      submenu: [
        ...getAccountsMenuItems(true),
        {
          type: 'separator'
        },
        {
          label: 'Add Account',
          click() {
            sendToMainWindow('add-account-request')
            hideAccountViews()
          }
        },
        {
          label: 'Edit Account',
          click() {
            const selectedAccount = getSelectedAccount()
            if (selectedAccount) {
              sendToMainWindow('edit-account-request', selectedAccount)
              hideAccountViews()
            }
          }
        }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'Dark Mode',
          submenu: [
            {
              id: 'dark-mode-system',
              label: 'Follow System Appearance',
              type: 'radio',
              checked: config.get(ConfigKey.DarkMode) === 'system',
              click() {
                nativeTheme.themeSource = 'system'
                config.set(ConfigKey.DarkMode, 'system')
              }
            },
            {
              id: 'dark-mode-enabled',
              label: 'Enabled',
              type: 'radio',
              checked: config.get(ConfigKey.DarkMode) === true,
              click() {
                nativeTheme.themeSource = 'dark'
                config.set(ConfigKey.DarkMode, true)
              }
            },
            {
              id: 'dark-mode-disabled',
              label: 'Disabled',
              type: 'radio',
              checked: config.get(ConfigKey.DarkMode) === false,
              click() {
                nativeTheme.themeSource = 'light'
                config.set(ConfigKey.DarkMode, false)
              }
            }
          ]
        },
        {
          label: 'Appearance',
          submenu: [
            ...appearanceMenuItems.map((item) =>
              createAppearanceMenuItem(item)
            ),
            {
              label: 'Custom Styles',
              click() {
                // Create the custom style file if it doesn't exist
                if (!fs.existsSync(USER_CUSTOM_STYLE_PATH)) {
                  fs.closeSync(fs.openSync(USER_CUSTOM_STYLE_PATH, 'w'))
                }

                shell.openPath(USER_CUSTOM_STYLE_PATH)
              }
            }
          ]
        },
        {
          label: 'Confirm External Links before Opening',
          type: 'checkbox',
          checked: config.get(ConfigKey.ConfirmExternalLinks),
          click({ checked }: { checked: boolean }) {
            config.set(ConfigKey.ConfirmExternalLinks, checked)
          }
        },
        {
          label: is.macos ? 'Show Menu Bar Icon' : 'Show System Tray Icon',
          type: 'checkbox',
          checked: config.get(ConfigKey.EnableTrayIcon),
          click({ checked }: { checked: boolean }) {
            config.set(ConfigKey.EnableTrayIcon, checked)
            showRestartDialog(
              checked,
              is.macos ? 'the menu bar icon' : 'the system tray icon'
            )
          }
        },
        {
          label: 'Default Mailto Client',
          type: 'checkbox',
          checked: app.isDefaultProtocolClient('mailto'),
          click() {
            if (app.isDefaultProtocolClient('mailto')) {
              app.removeAsDefaultProtocolClient('mailto')
            } else {
              app.setAsDefaultProtocolClient('mailto')
            }
          }
        },
        {
          label: 'Launch Minimized',
          type: 'checkbox',
          checked: config.get(ConfigKey.LaunchMinimized),
          click({ checked }: { checked: boolean }) {
            config.set(ConfigKey.LaunchMinimized, checked)
          }
        },
        {
          label: 'Hardware Acceleration',
          type: 'checkbox',
          checked: config.get(ConfigKey.HardwareAcceleration),
          click({ checked }: { checked: boolean }) {
            config.set(ConfigKey.HardwareAcceleration, checked)
            showRestartDialog(checked, 'hardware acceleration')
          }
        },
        {
          label: 'Downloads',
          submenu: [
            {
              label: 'Show Save As Dialog Before Downloading',
              type: 'checkbox',
              checked: config.get(ConfigKey.DownloadsShowSaveAs),
              click({ checked }) {
                config.set(ConfigKey.DownloadsShowSaveAs, checked)

                showRestartDialog()
              }
            },
            {
              label: 'Open Folder When Done',
              type: 'checkbox',
              checked: config.get(ConfigKey.DownloadsOpenFolderWhenDone),
              click({ checked }) {
                config.set(ConfigKey.DownloadsOpenFolderWhenDone, checked)

                showRestartDialog()
              }
            },
            {
              label: 'Default Location',
              async click() {
                const { canceled, filePaths } = await dialog.showOpenDialog({
                  properties: ['openDirectory'],
                  buttonLabel: 'Select',
                  defaultPath: config.get(ConfigKey.DownloadsLocation)
                })

                if (canceled) {
                  return
                }

                config.set(ConfigKey.DownloadsLocation, filePaths[0])

                showRestartDialog()
              }
            }
          ]
        },
        {
          type: 'separator'
        },
        {
          label: 'Updates',
          submenu: [
            {
              label: 'Auto Update',
              type: 'checkbox',
              checked: config.get(ConfigKey.AutoUpdate),
              click({ checked }: { checked: boolean }) {
                config.set(ConfigKey.AutoUpdate, checked)
                showRestartDialog(checked, 'auto updates')
              }
            },
            {
              label: 'Release Channel',
              submenu: [
                {
                  id: 'release-channel-stable',
                  label: 'Stable',
                  type: 'radio',
                  checked: config.get(ConfigKey.ReleaseChannel) === 'stable',
                  click() {
                    changeReleaseChannel('stable')
                  }
                },
                {
                  label: 'Dev',
                  type: 'radio',
                  checked: config.get(ConfigKey.ReleaseChannel) === 'dev',
                  click() {
                    changeReleaseChannel('dev')
                  }
                }
              ]
            }
          ]
        },
        {
          label: 'Advanced',
          submenu: [
            {
              label: 'Debug Mode',
              type: 'checkbox',
              checked: config.get(ConfigKey.DebugMode),
              click({ checked }) {
                config.set(ConfigKey.DebugMode, checked)
                showRestartDialog(checked, 'debug mode')
              }
            },
            {
              label: 'Edit Config File',
              click() {
                config.openInEditor()
              }
            },
            {
              label: 'Reset Config File',
              click() {
                config.set(ConfigKey.ResetConfig, true)
                showRestartDialog()
              }
            },
            {
              type: 'separator'
            },
            {
              label: 'User Agent',
              submenu: [
                {
                  label: 'Use User Agent Fix',
                  type: 'checkbox',
                  checked: config.get(ConfigKey.AutoFixUserAgent),
                  click({ checked }) {
                    enableAutoFixUserAgent({
                      enable: checked,
                      showRestartDialog: true
                    })
                  }
                },
                {
                  label: 'Set Custom User Agent',
                  click() {
                    config.openInEditor()
                  }
                },
                {
                  label: 'Remove Custom User Agent',
                  enabled: Boolean(config.get(ConfigKey.CustomUserAgent)),
                  click() {
                    removeCustomUserAgent()
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      role: 'editMenu'
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CommandOrControl+Shift+R',
          click() {
            const selectedAccountView = getSelectedAccountView()
            if (selectedAccountView) {
              selectedAccountView.webContents.loadURL(GMAIL_URL)
            }
          }
        },
        {
          label: 'Developer Tools',
          accelerator: is.macos ? 'Command+Alt+I' : 'Control+Shift+I',
          click() {
            const selectedAccountView = getSelectedAccountView()
            if (selectedAccountView) {
              selectedAccountView.webContents.openDevTools()
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CommandOrControl+0',
          click() {
            const resetZoomFactor = 1
            forEachAccountView((accountView) => {
              accountView.webContents.setZoomFactor(resetZoomFactor)
            })
            config.set(ConfigKey.ZoomFactor, resetZoomFactor)
          }
        },
        {
          label: 'Zoom In',
          accelerator: 'CommandOrControl+Plus',
          click() {
            const newZoomFactor = config.get(ConfigKey.ZoomFactor) + 0.1
            forEachAccountView((accountView) => {
              accountView.webContents.setZoomFactor(newZoomFactor)
            })
            config.set(ConfigKey.ZoomFactor, newZoomFactor)
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CommandOrControl+-',
          click() {
            const newZoomFactor = config.get(ConfigKey.ZoomFactor) - 0.1
            if (newZoomFactor > 0) {
              forEachAccountView((accountView) => {
                accountView.webContents.setZoomFactor(newZoomFactor)
              })
              config.set(ConfigKey.ZoomFactor, newZoomFactor)
            }
          }
        }
      ]
    },
    {
      label: 'Window',
      role: 'window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CommandOrControl+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'CommandOrControl+W',
          role: 'close'
        }
      ]
    },
    {
      label: 'Help',
      role: 'help',
      submenu: [
        {
          label: `${app.name} Website`,
          click() {
            shell.openExternal('https://github.com/timche/gmail-desktop')
          }
        },
        {
          label: 'Report an Issue',
          click() {
            shell.openExternal(
              'https://github.com/timche/gmail-desktop/issues/new/choose'
            )
          }
        },
        {
          label: 'View Logs',
          visible: config.get(ConfigKey.DebugMode),
          click() {
            viewLogs()
          }
        }
      ]
    }
  ]

  // Add the develop menu when running in the development environment
  if (is.development) {
    appMenu.splice(-1, 0, {
      label: 'Develop',
      submenu: [
        {
          label: 'Clear Cache and Restart',
          click() {
            // Clear app config
            config.clear()
            // Restart without firing quitting events
            app.relaunch()
            app.exit(0)
          }
        }
      ]
    })
  }

  const menu = Menu.buildFromTemplate(appMenu)

  Menu.setApplicationMenu(menu)
}
