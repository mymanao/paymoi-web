import {createApp} from 'vue'
import './style.css'
import './tailwind.css'
import App from './App.vue'
import Home from "./components/Home.vue";
import Donate from "./components/Donate.vue";
import {createRouter, createWebHistory} from "vue-router";
import Login from "./components/Login.vue";
import Dashboard from "./components/Dashboard.vue";
import Overlay from "./components/Overlay.vue";

const routes = [
    {path: '/', component: Home},
    {path: '/login', component: Login},
    {path: '/donate/:name', component: Donate},
    {path: '/dashboard', component: Dashboard},
    {path: '/overlay/:wallet', component: Overlay}
]

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

const app = createApp(App)
app.use(router)
app.mount('#app')