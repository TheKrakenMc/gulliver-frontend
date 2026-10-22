import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['favicon.svg', 'apg.png'],
    manifest: { name: 'Gulliver — Registro de producción', short_name: 'Gulliver', lang:'es',
      start_url:'/', display:'standalone', background_color:'#f8fafc', theme_color:'#0f172a',
      icons:[{src:'/favicon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}] },
    workbox: { globPatterns:['**/*.{js,css,html,svg,png,ico,woff2}'], maximumFileSizeToCacheInBytes: 3000000,
      navigateFallback:'/index.html', navigateFallbackDenylist:[/^\/api\//],
      cleanupOutdatedCaches:true, clientsClaim:true, runtimeCaching:[] },
    devOptions: { enabled:false },
  })],
})
