
// 导出所有模块
export { useAppStore } from './app'
export { useUserStore } from './user'
export { useProductStore } from './product'
export { useNotificationStore } from './notification'

// 如果需要，可以在这里创建一个复合的store
import { useAppStore } from './app'
import { useUserStore } from './user'
import { useProductStore } from './product'
import { useNotificationStore } from './notification'

// 获取所有store的便捷函数
export const useStores = () => {
  return {
    app: useAppStore(),
    user: useUserStore(),
    product: useProductStore(),
    notification: useNotificationStore()
  }
}
