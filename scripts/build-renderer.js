const build = require('./utils/build.js')

build('renderer', (isProd) => ({
  entryPoints: ['./src/renderer/index.tsx'],
  target: 'chrome89',
  outfile: './build-js/renderer/index.js',
  define: {
    'process.env.NODE_ENV': isProd ? '"production"' : '"development"'
  }
}))
