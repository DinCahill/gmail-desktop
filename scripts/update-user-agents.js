import { fileURLToPath } from 'node:url'
import got from 'got'
import { writeJsonFile } from 'write-json-file'

async function main() {
  let latestFirefoxUserAgents

  try {
    const { body } = await got(
      'https://www.whatismybrowser.com/guides/the-latest-user-agent/firefox'
    )
    latestFirefoxUserAgents = body
  } catch {}

  if (!latestFirefoxUserAgents) {
    return
  }

  const match = latestFirefoxUserAgents.match(
    /Mozilla\/\d+.\d+ \(.+\) Gecko\/\d+ Firefox\/\d+.\d+/gm
  )

  if (!match) {
    return
  }

  await writeJsonFile(
    fileURLToPath(
      new URL('../src/main/user-agent/user-agents.json', import.meta.url)
    ),
    {
      windows: match[0],
      macos: match[1],
      linux: match[5]
    },
    {
      detectIndent: true
    }
  )

  console.log('Updated User Agents')
}

main()
