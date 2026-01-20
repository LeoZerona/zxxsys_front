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

// 在开发环境或调试模式下显示环境信息
if (import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true') {
  console.log('%c=== 应用启动信息 ===', 'color: #409EFF; font-weight: bold;')
  console.log('应用标题:', import.meta.env.VITE_APP_TITLE || '题库管理系统')
  console.log('应用版本:', import.meta.env.VITE_APP_VERSION || '1.0.0')
  console.log('环境模式:', import.meta.env.MODE)
  console.log('应用环境:', import.meta.env.VITE_APP_ENV || import.meta.env.MODE)
  console.log('==================', 'color: #409EFF; font-weight: bold;')
}

const app = createApp(App)

app.use(pinia)
app.use(router)

// 初始化用户状态（恢复 Token）
import { useUserStore } from '@/stores/modules/user'
import { initTokenAutoRefresh } from '@/utils/request'
const userStore = useUserStore()
userStore.restoreToken()

// 初始化Token自动刷新
initTokenAutoRefresh()

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)   // 把 200+ 图标全部注册成全局组件
}
app.use(ElementPlus)
app.mount('#app')