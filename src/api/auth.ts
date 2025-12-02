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

