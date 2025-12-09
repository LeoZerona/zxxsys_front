import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ElMessage } from 'element-plus'

// API 基础配置
// 优先使用环境变量 VITE_API_BASE_URL
// 如果没有配置，则根据环境自动选择：
// - 开发环境：使用代理路径 '/api'
// - 测试/生产环境：使用完整 URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? '/api' : 'http://192.168.0.101:5000/api')

// 请求超时时间（从环境变量读取，默认 10 秒）
const REQUEST_TIMEOUT = Number(import.meta.env.VITE_REQUEST_TIMEOUT) || 10000

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 打印当前环境信息（仅在开发环境或调试模式开启时）
if (import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true') {
  console.log('=== 环境配置信息 ===')
  console.log('环境模式:', import.meta.env.MODE)
  console.log('应用环境:', import.meta.env.VITE_APP_ENV)
  console.log('API Base URL:', API_BASE_URL)
  console.log('请求超时:', REQUEST_TIMEOUT + 'ms')
  console.log('==================')
}

// Token 刷新标志，防止并发刷新
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

// 订阅 Token 刷新
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

// 通知所有订阅者
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token))
  refreshSubscribers = []
}

// 检查并刷新 Token
async function checkAndRefreshToken(): Promise<string | null> {
  const refreshTokenValue = localStorage.getItem('refresh_token')
  const expiresAt = localStorage.getItem('token_expires_at')
  
  if (!refreshTokenValue || !expiresAt) {
    return null
  }
  
  // 检查是否即将过期（提前5分钟）
  const expiresAtTime = parseInt(expiresAt)
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000
  
  // 如果还没到刷新时间，直接返回当前 token
  if (now < expiresAtTime - fiveMinutes) {
    return localStorage.getItem('access_token')
  }
  
  // 如果正在刷新，等待刷新完成
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => {
        resolve(token)
      })
    })
  }
  
  // 开始刷新
  isRefreshing = true
  try {
    const { refreshToken } = await import('@/api/auth')
    const response = await refreshToken(refreshTokenValue)
    
    if (response.success && response.data) {
      const { access_token, expires_in } = response.data
      const newExpiresAt = Date.now() + (expires_in - 300) * 1000
      
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('token_expires_at', newExpiresAt.toString())
      
      // 通知所有订阅者
      onTokenRefreshed(access_token)
      isRefreshing = false
      
      return access_token
    }
  } catch (error) {
    // 刷新失败，清除 token
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('token_expires_at')
    isRefreshing = false
    return null
  }
  
  isRefreshing = false
  return null
}

// 请求拦截器
request.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 检查并刷新 Token（如果需要）
    const token = await checkAndRefreshToken()
    
    // 添加 token 等认证信息
    const accessToken = token || localStorage.getItem('access_token')
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response
    
    // 如果后端返回的数据格式是 { success, message, data }
    if (data && typeof data === 'object' && 'success' in data) {
      // 如果 success 为 false，说明业务逻辑失败
      if (!data.success) {
        const message = data.message || '请求失败'
        // 验证码相关错误不在这里显示消息，由业务代码处理
        const captchaErrorCodes = ['REQUIRES_CAPTCHA', 'INVALID_CAPTCHA']
        if (data.code && captchaErrorCodes.includes(data.code)) {
          // 返回错误对象，包含完整信息，由业务代码处理
          return Promise.reject({
            message,
            code: data.code,
            requires_captcha: data.requires_captcha,
            attempt_count: data.attempt_count,
          })
        }
        ElMessage.error(message)
        return Promise.reject(new Error(message))
      }
      // 返回数据部分
      return data
    }
    
    // 如果后端直接返回数据，则直接返回
    return data
  },
  (error: AxiosError<any>) => {
    // 处理 HTTP 错误
    if (error.response) {
      const { status, data } = error.response
      
      // 根据状态码处理不同错误
      switch (status) {
        case 400:
          // 验证码相关错误不在这里显示消息，由业务代码处理
          const captchaErrorCodes = ['REQUIRES_CAPTCHA', 'INVALID_CAPTCHA']
          if (data?.code && captchaErrorCodes.includes(data.code)) {
            // 验证码相关错误，不显示通用错误消息，由业务代码处理
            break
          }
          ElMessage.error(data?.message || '请求参数错误')
          break
        case 401:
          // 处理 Token 过期或无效
          const errorCode = data?.code
          if (errorCode === 'INVALID_TOKEN' || errorCode === 'TOKEN_EXPIRED' || errorCode === 'INVALID_REFRESH_TOKEN' || errorCode === 'TOKEN_REVOKED' || errorCode === 'USER_NOT_FOUND') {
            // 清除 token
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('token_expires_at')
            
            // 清除用户状态
            import('@/stores/modules/user').then(({ useUserStore }) => {
              const userStore = useUserStore()
              userStore.clearCurrentUser()
              userStore.clearToken()
            })
            
            ElMessage.error(data?.message || '登录已过期，请重新登录')
            
            // 跳转到登录页
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
              window.location.href = '/login'
            }
          } else {
            ElMessage.error(data?.message || '未授权，请重新登录')
          }
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 429:
          // 频率限制
          const message = data?.message || '请求过于频繁，请稍后再试'
          ElMessage.warning(message)
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        case 502:
          ElMessage.error('网关错误')
          break
        case 503:
          ElMessage.error('服务不可用')
          break
        default:
          ElMessage.error(data?.message || `请求失败 (${status})`)
      }
      
      // 返回错误信息，包含 cooldown_seconds 等额外信息
      return Promise.reject({
        message: data?.message || '请求失败',
        status,
        data: data?.data,
        cooldown_seconds: data?.cooldown_seconds,
        code: data?.code,
        requires_captcha: data?.requires_captcha,
        attempt_count: data?.attempt_count,
      })
    } else if (error.request) {
      // 请求已发出但没有收到响应
      const errorMsg = '网络错误，请检查后端服务是否启动或网络连接是否正常'
      console.error('请求失败:', {
        message: errorMsg,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL + error.config?.url,
        error: error.message
      })
      ElMessage.error(errorMsg)
      return Promise.reject(new Error(errorMsg))
    } else {
      // 其他错误
      console.error('请求配置错误:', error)
      ElMessage.error('请求配置错误')
      return Promise.reject(error)
    }
  }
)

export default request

