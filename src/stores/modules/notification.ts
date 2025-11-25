
import { defineStore } from 'pinia'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info' | 'error'
  title: string
  message: string
  duration?: number // 自动关闭时间，毫秒，0表示不自动关闭
  showClose?: boolean // 是否显示关闭按钮
  timestamp: number
  read: boolean
}

interface NotificationState {
  // 通知列表
  notifications: Notification[]
  // 未读通知数量
  unreadCount: number
  // 通知设置
  settings: {
    enableSound: boolean
    enableDesktop: boolean
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
    maxNotifications: number
  }
}

export const useNotificationStore = defineStore('notification', {
  state: (): NotificationState => ({
    notifications: [],
    unreadCount: 0,
    settings: {
      enableSound: true,
      enableDesktop: true,
      position: 'top-right',
      maxNotifications: 5
    }
  }),

  getters: {
    // 获取未读通知
    unreadNotifications: (state) => {
      return state.notifications.filter(notification => !notification.read)
    },

    // 获取最新通知
    latestNotifications: (state) => {
      return [...state.notifications]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, state.settings.maxNotifications)
    }
  },

  actions: {
    // 添加通知
    addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
      const newNotification: Notification = {
        ...notification,
        id: 'notification_' + Date.now(),
        timestamp: Date.now(),
        read: false,
        duration: notification.duration || 4500,
        showClose: notification.showClose !== false
      }

      this.notifications.push(newNotification)
      this.unreadCount++

      // 如果启用了桌面通知
      if (this.settings.enableDesktop && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          })
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico'
              })
            }
          })
        }
      }

      // 如果设置了自动关闭时间
      if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          this.removeNotification(newNotification.id)
        }, newNotification.duration)
      }

      return newNotification
    },

    // 移除通知
    removeNotification(id: string) {
      const index = this.notifications.findIndex(notification => notification.id === id)
      if (index !== -1) {
        const notification = this.notifications[index]
        this.notifications.splice(index, 1)

        // 如果是未读通知，减少未读数量
        if (!notification.read) {
          this.unreadCount--
        }
      }
    },

    // 标记通知为已读
    markAsRead(id: string) {
      const notification = this.notifications.find(n => n.id === id)
      if (notification && !notification.read) {
        notification.read = true
        this.unreadCount--
      }
    },

    // 标记所有通知为已读
    markAllAsRead() {
      this.notifications.forEach(notification => {
        if (!notification.read) {
          notification.read = true
        }
      })
      this.unreadCount = 0
    },

    // 清空所有通知
    clearAllNotifications() {
      this.notifications = []
      this.unreadCount = 0
    },

    // 更新设置
    updateSettings(settings: Partial<NotificationState['settings']>) {
      this.settings = { ...this.settings, ...settings }

      // 保存到本地存储
      localStorage.setItem('notification_settings', JSON.stringify(this.settings))
    },

    // 初始化设置
    initSettings() {
      const savedSettings = localStorage.getItem('notification_settings')
      if (savedSettings) {
        try {
          this.settings = { ...this.settings, ...JSON.parse(savedSettings) }
        } catch (error) {
          console.error('Failed to parse notification settings:', error)
        }
      }
    },

    // 便捷方法：成功通知
    success(title: string, message?: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'timestamp' | 'read'>>) {
      return this.addNotification({
        type: 'success',
        title,
        message: message || '',
        ...options
      })
    },

    // 便捷方法：警告通知
    warning(title: string, message?: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'timestamp' | 'read'>>) {
      return this.addNotification({
        type: 'warning',
        title,
        message: message || '',
        ...options
      })
    },

    // 便捷方法：信息通知
    info(title: string, message?: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'timestamp' | 'read'>>) {
      return this.addNotification({
        type: 'info',
        title,
        message: message || '',
        ...options
      })
    },

    // 便捷方法：错误通知
    error(title: string, message?: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'title' | 'message' | 'timestamp' | 'read'>>) {
      return this.addNotification({
        type: 'error',
        title,
        message: message || '',
        duration: 0, // 错误通知默认不自动关闭
        ...options
      })
    }
  }
})
