import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Configure Vite with offline-first PWA service worker support so AURA
// operates with zero network dependency aboard spacecraft or remote clinics.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'AURA — Astronaut Health Monitor',
        short_name: 'AURA Health',
        description:
          'A prototype concept for astronaut health monitoring during long-duration space missions.',
        theme_color: '#F3F6F7',
        background_color: '#F3F6F7',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,woff2,wasm}'],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
      },
    }),
  ],
});
