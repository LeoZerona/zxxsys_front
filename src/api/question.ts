import request from '@/utils/request'
import type { ApiResponse } from './auth'

// ===================== 类型定义 =====================

// 题目选项
export interface QuestionOption {
  label: string
  content: string
  seq: number
}

// 题目答案
export interface QuestionAnswer {
  correct_answer?: string | string[]
  option_true?: string
  answer_content?: string
  type2?: string // 计算分析题类型：1=分录题, 2=填空题
  sub_questions?: SubQuestion[] // 计算分析题的子题
}

// 计算分析题子题
export interface SubQuestion {
  calcchild_id: number
  type: string // 1=分录题, 2=填空题, 3=不定项选择
  content: string
  answer: {
    answer_content?: string
    option_true?: string
  }
  options?: QuestionOption[]
  analysis?: string
  sort: number
}

// 题目基础信息
export interface Question {
  question_id: number
  type: string // 1=单选, 2=多选, 3=判断, 4=填空, 8=计算分析
  type_name: string
  subject_id?: number
  subject_name?: string
  chapter_id?: number
  content: string
  analysis?: string
  answer: QuestionAnswer
  options: QuestionOption[]
}

// 题目列表请求参数
export interface QuestionListParams {
  type: string // 必填：1=单选, 2=多选, 3=判断, 4=填空, 8=计算分析
  channel_code?: string
  subject_id?: number
  subject_name?: string
  chapter_id?: number
  attr?: string
  page?: number
  page_size?: number
  include_answer?: boolean
  include_analysis?: boolean
}

// 题目列表响应
export interface QuestionListResponse extends ApiResponse {
  data?: {
    list: Question[]
    pagination: {
      page: number
      page_size: number
      total: number
      total_pages: number
    }
  }
}

// 题目详情请求参数
export interface QuestionDetailParams {
  include_answer?: boolean
  include_analysis?: boolean
}

// 题目详情响应
export interface QuestionDetailResponse extends ApiResponse {
  data?: Question
}

// 批量获取题目请求参数
export interface BatchQuestionParams {
  question_ids: number[] // 最多100个
  include_answer?: boolean
  include_analysis?: boolean
}

// 批量获取题目响应
export interface BatchQuestionResponse extends ApiResponse {
  data?: {
    questions: Question[]
    not_found_ids: number[]
  }
}

// 统计信息请求参数
export interface StatisticsParams {
  channel_code?: string
  group_by?: 'type' | 'subject' | 'channel'
}

// 统计项
export interface StatisticsItem {
  type?: string
  type_name?: string
  subject_id?: number
  subject_name?: string
  channel_code?: string
  count: number
}

// 统计信息响应
export interface StatisticsResponse extends ApiResponse {
  data?: {
    total: number
    statistics?: StatisticsItem[]
  }
}

// ===================== API 方法 =====================

/**
 * 获取题目列表
 * @param params 查询参数
 * @returns 题目列表和分页信息
 */
export async function getQuestionList(
  params: QuestionListParams
): Promise<QuestionListResponse> {
  try {
    const response = await request.get<QuestionListResponse>('/questions', {
      params: {
        ...params,
        page: params.page || 1,
        page_size: params.page_size || 20,
        include_answer: params.include_answer !== false,
        include_analysis: params.include_analysis !== false,
      },
    })
    return response
  } catch (error: any) {
    throw error
  }
}

/**
 * 获取单个题目详情
 * @param questionId 题目ID
 * @param params 可选参数
 * @returns 题目详情
 */
export async function getQuestionDetail(
  questionId: number,
  params?: QuestionDetailParams
): Promise<QuestionDetailResponse> {
  try {
    const response = await request.get<QuestionDetailResponse>(
      `/questions/${questionId}`,
      {
        params: {
          include_answer: params?.include_answer !== false,
          include_analysis: params?.include_analysis !== false,
        },
      }
    )
    return response
  } catch (error: any) {
    throw error
  }
}

/**
 * 批量获取题目
 * @param params 批量查询参数
 * @returns 题目列表和未找到的ID列表
 */
export async function batchGetQuestions(
  params: BatchQuestionParams
): Promise<BatchQuestionResponse> {
  try {
    // 验证题目ID数量
    if (!params.question_ids || params.question_ids.length === 0) {
      throw new Error('题目ID列表不能为空')
    }
    if (params.question_ids.length > 100) {
      throw new Error('题目ID列表最多100个')
    }

    const response = await request.post<BatchQuestionResponse>(
      '/questions/batch',
      {
        question_ids: params.question_ids,
        include_answer: params.include_answer !== false,
        include_analysis: params.include_analysis !== false,
      }
    )
    return response
  } catch (error: any) {
    throw error
  }
}

/**
 * 获取题目统计信息
 * @param params 统计参数
 * @returns 统计信息
 */
export async function getQuestionStatistics(
  params?: StatisticsParams
): Promise<StatisticsResponse> {
  try {
    const response = await request.get<StatisticsResponse>(
      '/questions/statistics',
      {
        params: params || {},
      }
    )
    return response
  } catch (error: any) {
    throw error
  }
}

