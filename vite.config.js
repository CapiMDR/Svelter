import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/my-pwa-svelte/",
  plugins: [
    svelte(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: ["favicon.svg", "pwa-192x192.png", "pwa-512x512.png"],

      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },

      manifest: {
        start_url: "/",
        scope: "/",

        name: "My App",
        short_name: "MyApp",

        display: "standalone",

        theme_color: "#ffffff",
        background_color: "#ffffff",

        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
