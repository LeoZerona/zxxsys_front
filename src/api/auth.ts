import request from '@/utils/request'

// API 响应类型定义
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  code?: string // 仅测试模式返回
  cooldown_seconds?: number // 频率限制时返回
}

// 发送验证码响应类型
export interface SendCodeResponse extends ApiResponse {
  code?: string
  cooldown_seconds?: number
}

// 用户注册响应类型
export interface RegisterResponse extends ApiResponse {
  data?: {
    id: number
    email: string
    role: string
    created_at: string
    is_active: boolean
  }
}

// 发送验证码
export async function sendVerificationCode(email: string): Promise<SendCodeResponse> {
  try {
    const response = await request.post<SendCodeResponse>('/send-verification-code', {
      email,
    })
    return response
  } catch (error: any) {
    // 错误已经在拦截器中处理，这里直接抛出
    throw error
  }
}

// 用户注册
export async function register(
  email: string,
  password: string,
  verificationCode: string
): Promise<RegisterResponse> {
  try {
    const response = await request.post<RegisterResponse>('/register', {
      email,
      password,
      verification_code: verificationCode,
    })
    return response
  } catch (error: any) {
    // 错误已经在拦截器中处理，这里直接抛出
    throw error
  }
}

// 登录响应类型
export interface LoginResponse extends ApiResponse {
  data?: {
    user: {
      id: number
      email: string
      role: string
      is_active: boolean
      created_at: string
    }
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
  }
}

// 刷新 Token 响应类型
export interface RefreshTokenResponse extends ApiResponse {
  data?: {
    access_token: string
    token_type: string
    expires_in: number
  }
}

// 用户登录
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    const response = await request.post<LoginResponse>('/login', {
      email,
      password,
    })
    return response
  } catch (error: any) {
    // 错误已经在拦截器中处理，这里直接抛出
    throw error
  }
}

// 刷新 Token
export async function refreshToken(
  refreshToken: string
): Promise<RefreshTokenResponse> {
  try {
    const response = await request.post<RefreshTokenResponse>('/refresh-token', {
      refresh_token: refreshToken,
    })
    return response
  } catch (error: any) {
    // 错误已经在拦截器中处理，这里直接抛出
    throw error
  }
}

// 用户登出
export async function logout(refreshToken?: string): Promise<ApiResponse> {
  try {
    const response = await request.post<ApiResponse>('/logout', {
      refresh_token: refreshToken,
    })
    return response
  } catch (error: any) {
    // 错误已经在拦截器中处理，这里直接抛出
    throw error
  }
}

