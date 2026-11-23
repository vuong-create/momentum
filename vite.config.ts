import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { randomUUID } from 'node:crypto'

const buildId = randomUUID()

// https://vite.dev/config/
export default defineConfig({
  define: { 'import.meta.env.VITE_MOMENTUM_BUILD_ID': JSON.stringify(buildId) },
  plugins: [react(), {
    name: 'momentum-build-version',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ buildId }) })
    },
  }],
})
