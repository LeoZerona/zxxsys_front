
import { defineStore } from 'pinia'
import type { MenuItem } from '@/api/auth'

interface UserState {
  // 当前登录用户信息
  currentUser: {
    id: string | number | null
    username: string
    email: string
    avatar: string
    role: string
    roles: string[]
    permissions: string[]
    is_active: boolean
  }
  // Token 信息
  token: {
    accessToken: string | null
    refreshToken: string | null
    expiresIn: number | null
    expiresAt: number | null // 过期时间戳
  }
  // 菜单列表
  menus: MenuItem[]
  // 用户列表（管理员功能）
  userList: Array<{
    id: string
    username: string
    email: string
    status: 'active' | 'inactive' | 'banned'
    roles: string[]
    createdAt: string
  }>
  // 用户加载状态
  loading: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: {
      id: null,
      username: '',
      email: '',
      avatar: '',
      role: '',
      roles: [],
      permissions: [],
      is_active: true
    },
    token: {
      accessToken: null,
      refreshToken: null,
      expiresIn: null,
      expiresAt: null
    },
    menus: [],
    userList: [],
    loading: false
  }),

  getters: {
    // 是否已登录
    isLoggedIn: (state) => !!state.currentUser.id,
    // 是否是管理员
    isAdmin: (state) => state.currentUser.roles.includes('admin'),
    // 获取用户权限列表
    userPermissions: (state) => state.currentUser.permissions,
    // 获取活跃用户数量
    activeUserCount: (state) => state.userList.filter(user => user.status === 'active').length
  },

  actions: {
    // 设置当前用户
    setCurrentUser(user: Partial<UserState['currentUser']>) {
      this.currentUser = { ...this.currentUser, ...user }
    },

    // 清除当前用户（登出）
    clearCurrentUser() {
      this.currentUser = {
        id: null,
        username: '',
        email: '',
        avatar: '',
        role: '',
        roles: [],
        permissions: [],
        is_active: true
      }
      this.token = {
        accessToken: null,
        refreshToken: null,
        expiresIn: null,
        expiresAt: null
      }
      this.menus = []
    },

    // 设置菜单
    setMenus(menus: MenuItem[]) {
      this.menus = menus
      // 保存到 localStorage
      localStorage.setItem('user_menus', JSON.stringify(menus))
    },

    // 从本地存储恢复菜单
    restoreMenus() {
      const menusStr = localStorage.getItem('user_menus')
      if (menusStr) {
        try {
          this.menus = JSON.parse(menusStr)
        } catch (error) {
          console.error('恢复菜单失败:', error)
          this.menus = []
        }
      }
    },

    // 设置用户列表
    setUserList(users: UserState['userList']) {
      this.userList = users
    },

    // 添加用户到列表
    addUser(user: UserState['userList'][0]) {
      this.userList.push(user)
    },

    // 更新用户信息
    updateUser(id: string, updates: Partial<UserState['userList'][0]>) {
      const index = this.userList.findIndex(user => user.id === id)
      if (index !== -1) {
        this.userList[index] = { ...this.userList[index], ...updates }
      }
    },

    // 删除用户
    removeUser(id: string) {
      const index = this.userList.findIndex(user => user.id === id)
      if (index !== -1) {
        this.userList.splice(index, 1)
      }
    },

    // 设置加载状态
    setLoading(loading: boolean) {
      this.loading = loading
    },

    // 设置 Token
    setToken(accessToken: string, refreshToken: string, expiresIn: number) {
      this.token.accessToken = accessToken
      this.token.refreshToken = refreshToken
      this.token.expiresIn = expiresIn
      // 计算过期时间戳（提前5分钟刷新）
      this.token.expiresAt = Date.now() + (expiresIn - 300) * 1000
      
      // 保存到 localStorage（持久化存储，关闭浏览器后仍保留）
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', refreshToken)
      localStorage.setItem('token_expires_at', this.token.expiresAt.toString())
    },

    // 清除 Token
    clearToken() {
      this.token = {
        accessToken: null,
        refreshToken: null,
        expiresIn: null,
        expiresAt: null
      }
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('token_expires_at')
    },

    // 检查 Token 是否即将过期
    isTokenExpiringSoon(): boolean {
      if (!this.token.expiresAt) return false
      return Date.now() >= this.token.expiresAt
    },

    // 从本地存储恢复 Token
    restoreToken() {
      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')
      const expiresAt = localStorage.getItem('token_expires_at')
      
      if (accessToken && refreshToken && expiresAt) {
        this.token.accessToken = accessToken
        this.token.refreshToken = refreshToken
        this.token.expiresAt = parseInt(expiresAt)
        // 检查是否已过期
        if (Date.now() >= this.token.expiresAt) {
          this.clearToken()
        }
      }
    },

    // 模拟登录（保留原有方法，但实际登录会使用 API）
    async login(username: string, password: string) {
      this.setLoading(true)

      try {
        // 模拟API请求
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 模拟登录成功
        this.setCurrentUser({
          id: 'user_' + Date.now(),
          username,
          email: `${username}@example.com`,
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
          role: username.includes('admin') ? 'admin' : 'user',
          roles: username.includes('admin') ? ['admin', 'user'] : ['user'],
          permissions: username.includes('admin') ? ['read', 'write', 'delete'] : ['read']
        })

        // 保存token到本地存储
        localStorage.setItem('auth_token', 'mock_token_' + Date.now())

        return { success: true }
      } catch (error) {
        return { success: false, error }
      } finally {
        this.setLoading(false)
      }
    },

    // 登出
    async logout() {
      try {
        // 调用退出登录 API
        const { logout: logoutApi } = await import('@/api/auth')
        const refreshToken = this.token.refreshToken || localStorage.getItem('refresh_token')
        if (refreshToken) {
          try {
            await logoutApi(refreshToken)
          } catch (error) {
            // 即使 API 调用失败，也继续清除本地状态
            console.warn('退出登录 API 调用失败:', error)
          }
        }
      } catch (error) {
        // 如果导入失败或其他错误，继续清除本地状态
        console.warn('退出登录时发生错误:', error)
      } finally {
        // 无论 API 调用成功与否，都清除本地状态
        this.clearCurrentUser()
        this.clearToken()
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_menus')
      }
    },

    // 检查用户权限
    hasPermission(permission: string) {
      return this.currentUser.permissions.includes(permission)
    },

    // 检查是否有任意一个权限
    hasAnyPermission(permissions: string[]) {
      return permissions.some(permission => this.hasPermission(permission))
    },

    // 检查是否有所有权限
    hasAllPermissions(permissions: string[]) {
      return permissions.every(permission => this.hasPermission(permission))
    },

    // 初始化用户数据（从本地存储恢复）
    initUser() {
      // 恢复 Token
      this.restoreToken()
      
      // 恢复菜单
      this.restoreMenus()
      
      // 如果有 Token，可以尝试获取用户信息
      // 这里暂时保留原有的逻辑作为备用
      const token = localStorage.getItem('auth_token')
      if (token) {
        // 模拟从token恢复用户信息
        this.setCurrentUser({
          id: 'restored_user',
          username: '恢复的用户',
          email: 'restored@example.com',
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
          role: 'user',
          roles: ['user'],
          permissions: ['read']
        })
      }
    }
  }
})
