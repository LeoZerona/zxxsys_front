import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ElMessage } from 'element-plus'

// API 基础配置
// 开发环境使用代理（通过 vite.config.ts 配置），生产环境使用完整 URL
// 优先使用环境变量，如果没有则根据环境自动选择
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? '/api' : 'http://192.168.0.101:5000/api')

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json',
  },
})

// 开发环境下打印 API 基础地址，方便调试
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL)
}

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 可以在这里添加 token 等认证信息
    // const token = localStorage.getItem('token')
    // if (token && config.headers) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
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
          ElMessage.error(data?.message || '请求参数错误')
          break
        case 401:
          ElMessage.error('未授权，请重新登录')
          // 可以在这里清除 token 并跳转到登录页
          // localStorage.removeItem('token')
          // router.push('/login')
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

