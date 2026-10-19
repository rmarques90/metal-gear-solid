import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// No GitHub Actions o site fica em https://<usuario>.github.io/metal-gear-solid/
// Localmente (dev, preview e testes) continua na raiz.
const base = process.env.GITHUB_ACTIONS ? '/metal-gear-solid/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['fake-indexeddb/auto'],
    include: ['src/**/*.test.js'],
  },
})
