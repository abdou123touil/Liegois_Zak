import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "icon-192.png",
        "icon-512.png",
      ],

      manifest: {
        name: "Boulangerie Liegeois",
        short_name: "POS",

        description: "Application POS Boulangerie Liegeois",

        start_url: "/",

        scope: "/",

        display: "fullscreen",

        display_override: [
          "window-controls-overlay",
          "standalone",
          "fullscreen"
        ],

        orientation: "landscape",

        background_color: "#ffffff",

        theme_color: "#ffffff",

        lang: "fr",

        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },

          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
      },

      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],

        navigateFallback: "/index.html",

        cleanupOutdatedCaches: true,

        clientsClaim: true,

        skipWaiting: true,
      },

      devOptions: {
        enabled: true,
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  server: {
    host: true,
    port: 5173,
  },
});