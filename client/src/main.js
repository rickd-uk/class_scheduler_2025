import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./assets/main.css"; // Import global CSS

// Create the Vue application instance
const app = createApp(App);

// Use plugins (Router, Store)
app.use(router);
app.use(store);

window.$store = store;

// Mount the application to the DOM element with id="app"
app.mount("#app");
