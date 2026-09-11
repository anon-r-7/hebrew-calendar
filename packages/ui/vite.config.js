import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import path from 'path'
import NodeGlobalsPolyfillPlugin from '@esbuild-plugins/node-globals-polyfill'

const prefix = 'UI'
const apiUrl = process.env[`${prefix}_API_URL`] || 'http://localhost:8080'

// Dev-only: serve the static /timeline page (public/timeline/index.html) for the
// clean "/timeline" URL. Without this, Vite's SPA history-fallback rewrites the
// extensionless path to the app's index.html before the public dir is checked.
// Production (nginx `try_files $uri $uri/`) already resolves /timeline on its own.
const serveStaticTimeline = {
  name: 'serve-static-timeline',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url === '/timeline' || req.url === '/timeline/') {
        req.url = '/timeline/index.html'
      }
      next()
    })
  }
}

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'
  return {
  build: {
    target: 'es2018',
    minify: true,
    outDir: '../build',
  },
  define: {
    // In dev, talk to a same-origin relative `/v1` so the reverse proxy below handles
    // it (no CORS). In a production build, keep baking the real API URL as before.
    envApiUrl: JSON.stringify(isDev ? '' : apiUrl),
  },
  envPrefix: `${prefix}_`,
  plugins: [reactRefresh(), serveStaticTimeline],
  root: './src',
  server: {
    port: 3005,
    // Reverse-proxy the API so the browser never makes a cross-origin request.
    // `/v1/...` -> `${UI_API_URL}/v1/...` (defaults to http://localhost:8080).
    proxy: {
      '/v1': {
        target: apiUrl,
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@ui': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true
        })
      ]
    }
  }
  }
})
