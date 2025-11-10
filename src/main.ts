import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// import ElementPlus from 'element-plus'
import '@/styles/normalize.css'
import '@/styles/index.scss'
import '@/styles/globalVariable.scss'
import 'element-plus/dist/index.css';
// import '@/styles/element-vars.scss';

const app = createApp(App)

app.use(router)
// app.use(ElementPlus)
app.mount('#app')