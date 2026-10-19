import { defineConfig } from '@playwright/test'

// Testes e2e rodam contra o build de produção (vite preview)
export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: 'http://localhost:4173',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 120000,
  },
})
