import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import '@/styles/normalize.css'
import '@/styles/index.scss'
import '@/styles/globalVariable.scss'
import 'element-plus/dist/index.css';
// import '@/styles/element-vars.scss';

const app = createApp(App)

app.use(pinia)
app.use(router)

// 初始化用户状态（恢复 Token）
import { useUserStore } from '@/stores/modules/user'
const userStore = useUserStore()
userStore.restoreToken()

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)   // 把 200+ 图标全部注册成全局组件
}
app.use(ElementPlus)
app.mount('#app')