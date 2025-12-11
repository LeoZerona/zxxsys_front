import { useUserStore } from '@/stores/modules/user'

/**
 * 权限过滤环境类型
 */
export type PermissionFilterEnv = 'development' | 'test' | 'production'

/**
 * 权限过滤配置
 */
interface PermissionFilterConfig {
  enabled: boolean
  env: PermissionFilterEnv
}

/**
 * 获取当前环境
 */
function getCurrentEnv(): PermissionFilterEnv {
  const mode = import.meta.env.MODE
  if (mode === 'development') return 'development'
  if (mode === 'test' || mode === 'testing') return 'test'
  return 'production'
}

/**
 * 权限过滤配置（从localStorage读取，支持动态修改）
 */
function getPermissionFilterConfig(): PermissionFilterConfig {
  const configStr = localStorage.getItem('permission_filter_config')
  if (configStr) {
    try {
      const config = JSON.parse(configStr)
      return {
        enabled: config.enabled !== false, // 默认启用
        env: config.env || getCurrentEnv()
      }
    } catch (error) {
      console.error('读取权限过滤配置失败:', error)
    }
  }
  
  // 默认配置
  return {
    enabled: true,
    env: getCurrentEnv()
  }
}

/**
 * 设置权限过滤配置
 */
export function setPermissionFilterConfig(config: Partial<PermissionFilterConfig>) {
  const currentConfig = getPermissionFilterConfig()
  const newConfig = { ...currentConfig, ...config }
  localStorage.setItem('permission_filter_config', JSON.stringify(newConfig))
}

/**
 * 获取权限过滤配置
 */
export function getPermissionFilterConfigValue(): PermissionFilterConfig {
  return getPermissionFilterConfig()
}

/**
 * 检查权限过滤是否启用
 */
function isPermissionFilterEnabled(): boolean {
  const config = getPermissionFilterConfig()
  return config.enabled
}

/**
 * 检查当前环境是否匹配
 */
function isEnvMatch(): boolean {
  const config = getPermissionFilterConfig()
  const currentEnv = getCurrentEnv()
  return config.env === currentEnv || config.env === 'all'
}

/**
 * 检查用户是否有指定权限
 * @param permission 权限标识
 * @returns 是否有权限
 */
export function hasPermission(permission: string | string[]): boolean {
  // 如果权限过滤未启用，直接返回true
  if (!isPermissionFilterEnabled()) {
    return true
  }

  // 如果环境不匹配，直接返回true（不进行权限过滤）
  if (!isEnvMatch()) {
    return true
  }

  const userStore = useUserStore()
  const permissions = userStore.currentUser.permissions

  // 如果权限列表为空，说明是超级管理员，返回true
  if (permissions.length === 0 && userStore.currentUser.role === 'super_admin') {
    return true
  }

  // 检查单个权限
  if (typeof permission === 'string') {
    return permissions.includes(permission) || permissions.includes('*')
  }

  // 检查多个权限（任意一个满足即可）
  if (Array.isArray(permission)) {
    return permission.some(p => permissions.includes(p) || permissions.includes('*'))
  }

  return false
}

/**
 * 检查用户是否有所有指定权限
 * @param permissions 权限标识数组
 * @returns 是否有所有权限
 */
export function hasAllPermissions(permissions: string[]): boolean {
  // 如果权限过滤未启用，直接返回true
  if (!isPermissionFilterEnabled()) {
    return true
  }

  // 如果环境不匹配，直接返回true（不进行权限过滤）
  if (!isEnvMatch()) {
    return true
  }

  const userStore = useUserStore()
  const userPermissions = userStore.currentUser.permissions

  // 如果权限列表为空，说明是超级管理员，返回true
  if (userPermissions.length === 0 && userStore.currentUser.role === 'super_admin') {
    return true
  }

  // 检查是否有超级权限
  if (userPermissions.includes('*')) {
    return true
  }

  // 检查是否有所有权限
  return permissions.every(p => userPermissions.includes(p))
}

/**
 * 过滤菜单（根据权限）
 * @param menus 菜单列表
 * @returns 过滤后的菜单列表
 */
export function filterMenusByPermission(menus: any[]): any[] {
  // 如果权限过滤未启用，直接返回原菜单
  if (!isPermissionFilterEnabled()) {
    return menus
  }

  // 如果环境不匹配，直接返回原菜单（不进行权限过滤）
  if (!isEnvMatch()) {
    return menus
  }

  const userStore = useUserStore()
  const permissions = userStore.currentUser.permissions

  // 如果权限列表为空，说明是超级管理员，返回所有菜单
  if (permissions.length === 0 && userStore.currentUser.role === 'super_admin') {
    return menus
  }

  // 如果用户有超级权限，返回所有菜单
  if (permissions.includes('*')) {
    return menus
  }

  return menus.filter(menu => {
    // 如果菜单有permissions字段，检查权限
    if (menu.permissions && Array.isArray(menu.permissions)) {
      const hasMenuPermission = menu.permissions.some((p: string) => 
        permissions.includes(p)
      )
      if (!hasMenuPermission) {
        return false
      }
    }

    // 递归过滤子菜单
    if (menu.children && Array.isArray(menu.children)) {
      menu.children = filterMenusByPermission(menu.children)
      // 如果子菜单全部被过滤，且菜单本身没有权限要求，则保留菜单
      // 如果菜单本身有权限要求，子菜单被过滤后，菜单也应该被过滤
      if (menu.children.length === 0 && menu.permissions && menu.permissions.length > 0) {
        return false
      }
    }

    return true
  })
}

