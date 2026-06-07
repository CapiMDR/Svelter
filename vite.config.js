import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    svelte(),

    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      registerType: "autoUpdate",
      workbox: {
        navigateFallback: "index.html",
      },
      manifest: {
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
