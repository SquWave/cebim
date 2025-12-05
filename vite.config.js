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
        start_url: '/',
        icons: [
          {
            src: 'pwa-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: 'pwa-96x96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: 'pwa-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: 'pwa-144x144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: 'pwa-152x152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
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
