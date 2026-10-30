'use strict'
const t = require('tap')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { createRequire } = require('module')

const pkg = require('../package.json')
const root = path.resolve(__dirname, '..')

t.test('package.json exports restore documented subpaths', t => {
  t.match(pkg.exports, {
    '.': './lib/index.js',
    './themes': './lib/themes.js',
    './theme-set': './lib/theme-set.js',
    './plumbing': './lib/plumbing.js',
  })
  t.end()
})

t.test('require(gauge/{themes,theme-set,plumbing}) resolves via exports', t => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gauge-exports-'))
  const nm = path.join(tmp, 'node_modules')
  fs.mkdirSync(nm, { recursive: true })
  fs.symlinkSync(root, path.join(nm, 'gauge'), 'junction')
  // Link runtime deps so gauge modules can load
  const deps = Object.keys(pkg.dependencies || {})
  for (const dep of deps) {
    const src = path.join(root, 'node_modules', dep)
    if (fs.existsSync(src)) {
      fs.symlinkSync(src, path.join(nm, dep), 'junction')
    }
  }

  const req = createRequire(path.join(tmp, 'consumer.js'))
  t.equal(typeof req('gauge/themes'), 'function', 'gauge/themes')
  t.equal(typeof req('gauge/theme-set'), 'function', 'gauge/theme-set')
  t.equal(typeof req('gauge/plumbing'), 'function', 'gauge/plumbing')
  t.equal(typeof req('gauge'), 'function', 'gauge main')
  t.end()
})
