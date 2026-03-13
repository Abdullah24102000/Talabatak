import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'طلباتك - TALABATAK',
        short_name: 'TALABATAK',
        description: 'تطبيق طلباتك لتوصيل الطلبات بالعريش',
        theme_color: '#050505',
        background_color: '#050505',
        display: 'standalone',
        icons: [
          {
            src: 'Logo192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'Logo512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'Logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})