
import { defineStore } from 'pinia'

interface AppState {
  // 用户信息
  user: {
    id: string | null
    name: string
    avatar: string
    role: string
  }
  // 应用设置
  settings: {
    theme: 'light' | 'dark'
    language: 'zh-CN' | 'en-US'
    sidebarCollapsed: boolean
  }
  // 应用加载状态
  loading: {
    state: boolean
    message: string
  }
}

export const useAppStore = defineStore('app', {
  state: (): AppState => ({
    user: {
      id: null,
      name: '',
      avatar: '',
      role: ''
    },
    settings: {
      theme: 'light',
      language: 'zh-CN',
      sidebarCollapsed: false
    },
    loading: {
      state: false,
      message: ''
    }
  }),

  getters: {
    // 获取用户是否已登录
    isLoggedIn: (state) => !!state.user.id,
    // 获取当前主题
    currentTheme: (state) => state.settings.theme,
    // 获取当前语言
    currentLanguage: (state) => state.settings.language
  },

  actions: {
    // 设置用户信息
    setUser(user: Partial<AppState['user']>) {
      this.user = { ...this.user, ...user }
    },

    // 清除用户信息
    clearUser() {
      this.user = {
        id: null,
        name: '',
        avatar: '',
        role: ''
      }
    },

    // 设置主题
    setTheme(theme: 'light' | 'dark') {
      this.settings.theme = theme
      // 可以在这里保存到本地存储
      localStorage.setItem('app-theme', theme)
    },

    // 设置语言
    setLanguage(language: 'zh-CN' | 'en-US') {
      this.settings.language = language
      // 可以在这里保存到本地存储
      localStorage.setItem('app-language', language)
    },

    // 切换侧边栏状态
    toggleSidebar() {
      this.settings.sidebarCollapsed = !this.settings.sidebarCollapsed
    },

    // 设置加载状态
    setLoading(loading: { state: boolean, message: string }) {
      this.loading = loading
    },

    // 初始化应用设置（从本地存储中恢复）
    initSettings() {
      const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark' | null
      const savedLanguage = localStorage.getItem('app-language') as 'zh-CN' | 'en-US' | null

      if (savedTheme) {
        this.settings.theme = savedTheme
      }

      if (savedLanguage) {
        this.settings.language = savedLanguage
      }
    }
  }
})
