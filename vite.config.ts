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
        name: 'AURA — Autonomous Digital Flight Surgeon',
        short_name: 'AURA HUD',
        description:
          'Offline-first autonomous clinical cockpit and multi-sensor fusion monitor for deep-space missions and remote clinics.',
        theme_color: '#080B10',
        background_color: '#080B10',
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
