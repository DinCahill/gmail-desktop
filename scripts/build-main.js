import build from './utils/build.js'

async function buildMain() {
  await Promise.all([
    build('main', {
      entryPoints: ['src/main/index.ts'],
      platform: 'node',
      target: 'node14.19.0',
      external: ['electron', '@sindresorhus/do-not-disturb'],
      loader: {
        '.json': 'json',
        '.css': 'text',
        '.html': 'file'
      },
      assetNames: '[name]',
      outfile: 'build-js/main/index.cjs'
    }),
    build('main-preload-main-window', {
      entryPoints: ['src/main/main-window/preload.ts'],
      target: 'chrome94',
      external: ['electron'],
      outfile: 'build-js/main/preload/main-window.cjs'
    }),
    build('main-preload-account-views', {
      entryPoints: ['src/main/account-views/preload/index.ts'],
      target: 'chrome94',
      external: ['electron'],
      outfile: 'build-js/main/preload/account-view.cjs'
    })
  ])
}

buildMain()
