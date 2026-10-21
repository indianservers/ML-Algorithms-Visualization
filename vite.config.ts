import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

const WASM_SRC = path.resolve('node_modules/@mediapipe/tasks-vision/wasm')
const WASM_DEST = path.resolve('public/mediapipe/wasm')
const WASM_TYPES: Record<string, string> = {
  '.wasm': 'application/wasm',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
}

function copyMediapipeWasmFiles() {
  if (!fs.existsSync(WASM_SRC)) return
  fs.mkdirSync(WASM_DEST, { recursive: true })
  for (const name of fs.readdirSync(WASM_SRC)) {
    const source = path.join(WASM_SRC, name)
    const destination = path.join(WASM_DEST, name)
    const matches = () => fs.existsSync(destination)
      && fs.statSync(source).size === fs.statSync(destination).size
      && fs.readFileSync(source).equals(fs.readFileSync(destination))
    // Avoid rewriting identical generated assets (including files a Windows
    // server or scanner currently has open). Never ignore incomplete copies.
    if (matches()) continue
    try {
      fs.copyFileSync(source, destination)
    } catch (error) {
      if (!matches()) throw error
    }
  }
}

function sendMediapipeWasm(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const url = req.url?.split('?')[0] ?? ''
  if (!url.startsWith('/mediapipe/wasm/')) {
    next()
    return
  }
  const file = path.posix.basename(url)
  if (!/^[\w.-]+\.(js|wasm|json)$/.test(file)) {
    res.statusCode = 404
    res.end('Not found')
    return
  }
  const filePath = path.join(WASM_SRC, file)
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404
    res.end('Not found')
    return
  }
  const type = WASM_TYPES[path.extname(file)] ?? 'application/octet-stream'
  const stat = fs.statSync(filePath)
  res.setHeader('Content-Type', type)
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Content-Length', String(stat.size))
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  fs.createReadStream(filePath).pipe(res)
}

function mediapipeWasm(): Plugin {
  return {
    name: 'mediapipe-wasm',
    buildStart() {
      copyMediapipeWasmFiles()
    },
    configureServer(server) {
      copyMediapipeWasmFiles()
      server.middlewares.use(sendMediapipeWasm)
    },
    configurePreviewServer(server) {
      server.middlewares.use(sendMediapipeWasm)
    },
  }
}

export default defineConfig({
  plugins: [mediapipeWasm(), react({ jsxImportSource: '@ml-i18n' })],
  resolve: { alias: { '@ml-i18n': path.resolve('src/i18n') } },
  server: {
    watch: { ignored: ['**/.timeseries-tests.local/**', '**/.optics-tests.local/**', '**/.localization-tests.local/**'] },
  },
})
