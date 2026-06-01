import { mount } from "svelte";
import "./app.css";
import App from "./views/App.svelte";

import { registerSW } from "virtual:pwa-register";

registerSW({
  immediate: true,
});

const target = document.getElementById("app");

if (!target) {
  throw new Error("App mount target not found");
}

const app = mount(App, {
  target,
});

export default app;
