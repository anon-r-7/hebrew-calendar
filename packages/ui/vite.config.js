import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import path from 'path'
import NodeGlobalsPolyfillPlugin from '@esbuild-plugins/node-globals-polyfill'

const prefix = 'UI'
const apiUrl = process.env[`${prefix}_API_URL`] || 'http://localhost:8080'

export default defineConfig({
  build: {
    target: 'es2018',
    minify: true,
    outDir: '../build',
  },
  define: {
    envApiURl: JSON.stringify(apiUrl),
  },
  envPrefix: `${prefix}_`,
  plugins: [reactRefresh()],
  root: './src',
  server: {
    port: 3005
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
})
