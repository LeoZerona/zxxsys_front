/// <reference types="vite/client" />

/**
 * 环境变量类型定义
 * 这些类型定义用于 TypeScript 识别环境变量
 */
interface ImportMetaEnv {
  // 应用相关
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_APP_ENV: 'development' | 'test' | 'production'
  
  // API 配置
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TARGET: string
  
  // 功能开关
  readonly VITE_USE_MOCK: string
  readonly VITE_DEBUG: string
  
  // 其他配置
  readonly VITE_REQUEST_TIMEOUT: string
  
  // Vite 内置变量
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly SSR: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

