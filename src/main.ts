import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import '@/style/normalize.css'
import '@/style/index.scss'
import '@/style/globalVariable.scss'
createApp(App).use(router).mount('#app')
