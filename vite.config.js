import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Cebim',
        short_name: 'Cebim',
        description: 'Kişisel finans ve yatırım takibi',
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  // server: {
  //   proxy: {
  //     '/api/midas': {
  //       target: 'https://www.getmidas.com',
  //       changeOrigin: true,
  //       rewrite: (path) => path.replace(/^\/api\/midas/, '/wp-json/midas-api/v1'),
  //       secure: false
  //     }
  //   }
  // }
})
