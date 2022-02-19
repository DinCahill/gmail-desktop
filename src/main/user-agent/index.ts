import { app } from 'electron'
import { platform } from 'electron-util'
import config, { ConfigKey } from '../config'
import { showRestartDialog } from '../utils/dialog'
import userAgents from './user-agents.json'

export function removeCustomUserAgent(): void {
  config.set(ConfigKey.CustomUserAgent, '')

  app.relaunch()
  app.quit()
}

export async function enableAutoFixUserAgent({
  enable = true
}: {
  enable?: boolean
  showRestartDialog?: boolean
} = {}) {
  config.set(ConfigKey.AutoFixUserAgent, enable)
  showRestartDialog()
}

export function getPlatformUserAgentFix() {
  return platform({
    default: userAgents.macos,
    linux: userAgents.linux,
    windows: userAgents.windows
  })
}

export function initUserAgent() {
  const autoFixUserAgent = config.get(ConfigKey.AutoFixUserAgent)

  if (autoFixUserAgent) {
    app.userAgentFallback = getPlatformUserAgentFix()
    return
  }

  const customUserAgent = config.get(ConfigKey.CustomUserAgent)

  if (customUserAgent) {
    app.userAgentFallback = customUserAgent
  }
}
