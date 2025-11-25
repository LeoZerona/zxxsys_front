
import { defineStore } from 'pinia'

interface UserState {
  // 当前登录用户信息
  currentUser: {
    id: string | null
    username: string
    email: string
    avatar: string
    roles: string[]
    permissions: string[]
  }
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
      roles: [],
      permissions: []
    },
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
        roles: [],
        permissions: []
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

    // 模拟登录
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
    logout() {
      this.clearCurrentUser()
      localStorage.removeItem('auth_token')
    },

    // 检查用户权限
    hasPermission(permission: string) {
      return this.currentUser.permissions.includes(permission)
    },

    // 初始化用户数据（从本地存储恢复）
    initUser() {
      const token = localStorage.getItem('auth_token')
      if (token) {
        // 模拟从token恢复用户信息
        this.setCurrentUser({
          id: 'restored_user',
          username: '恢复的用户',
          email: 'restored@example.com',
          avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
          roles: ['user'],
          permissions: ['read']
        })
      }
    }
  }
})
