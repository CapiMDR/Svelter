import { mount } from "svelte";
import "./app.css";
import App from "./views/App.svelte";

import { registerSW } from "virtual:pwa-register";

registerSW({
  immediate: true,

  onRegisteredSW(swUrl, registration) {
    console.log("SW registered:", swUrl);

    registration?.addEventListener?.("updatefound", () => {
      console.log("SW update found");
    });
  },

  onOfflineReady() {
    console.log("Offline ready");
  },

  onRegisterError(error) {
    console.error("SW registration error:", error);
  },
});

const target = document.getElementById("app");

if (!target) {
  throw new Error("App mount target not found");
}

const app = mount(App, {
  target,
});

export default app;
