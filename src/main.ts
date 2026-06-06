import { createApp } from "vue";
import "./style.css";
import "./tailwind.css";
// @ts-ignore
import App from "./App.vue";
import Home from "./components/Home.vue";
import Donate from "./components/Donate.vue";
import { createRouter, createWebHistory } from "vue-router";
import Account from "./components/Account.vue";
import Dashboard from "./components/Dashboard.vue";
import Overlay from "./components/Overlay.vue";
import Terms from "./components/Terms.vue";
import Privacy from "./components/Privacy.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/account", component: Account },
  { path: "/donate/:name", component: Donate },
  { path: "/dashboard", component: Dashboard },
  { path: "/overlay/:wallet", component: Overlay },
  { path: "/terms", component: Terms },
  { path: "/privacy", component: Privacy },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App);
app.use(router);
app.mount("#app");
