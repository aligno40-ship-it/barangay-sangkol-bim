import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          id: '/',
          name: 'Barangay Sangkol BIMS',
          short_name: 'BIMS',
          start_url: '/',
          display: 'standalone',
          theme_color: '#4f46e5',
          background_color: '#f8fafc',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          screenshots: [
            {
              src: '/pwa-wide.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Barangay Sangkol BIMS desktop dashboard',
            },
            {
              src: '/pwa-mobile.png',
              sizes: '390x844',
              type: 'image/png',
              label: 'Barangay Sangkol BIMS mobile dashboard',
            },
          ],
        },
        workbox: {
          // Cache app files only. Supabase requests are never cached.
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          globPatterns: ['**/*.{html,js,css,svg,png,jpg,jpeg,webp,ico}'],
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});