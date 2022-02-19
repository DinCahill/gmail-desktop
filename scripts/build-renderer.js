import build from './utils/build.js'

build('renderer', (isProd) => ({
  entryPoints: ['./src/renderer/index.tsx'],
  target: 'chrome94',
  outfile: './build-js/renderer/index.cjs',
  define: {
    'process.env.NODE_ENV': isProd ? '"production"' : '"development"'
  }
}))
