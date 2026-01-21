import request from "@/utils/request";
import type { ApiResponse } from "./auth";

// ===================== 类型定义 =====================

// 任务状态
export type TaskStatus =
  | "pending"
  | "running"
  | "paused"
  | "completed"
  | "error"
  | "cancelled";

// 任务配置
export interface TaskConfig {
  similarity_threshold?: number; // 相似度阈值，默认 0.8
}

// 任务信息
export interface DedupTask {
  id: number;
  task_name: string;
  status: TaskStatus;
  total_groups: number;
  processed_groups: number;
  total_questions: number;
  exact_duplicate_groups: number;
  exact_duplicate_pairs: number;
  similar_duplicate_pairs: number;
  progress_percentage: number;
  analysis_type?: string; // 分析类型，默认 'full'
  estimated_duration?: number; // 预估时长（秒）
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  config?: TaskConfig;
  created_at: string;
  updated_at: string;
}

// 题目组信息
export interface QuestionGroup {
  type: string;
  type_name: string;
  subject_id?: number;
  subject_name?: string;
  channel_code?: string;
}

// 完全重复组
export interface ExactDuplicateGroup {
  id: number;
  task_id: number;
  content_hash: string;
  question_count: number;
  question_ids: number[];
  group: QuestionGroup;
  detected_at: string;
  questions?: QuestionDetail[];
}

// 相似重复对
export interface SimilarDuplicatePair {
  id: number;
  task_id: number;
  question_id_1: number;
  question_id_2: number;
  similarity: number;
  duplicate_type: "similar";
  group: QuestionGroup;
  detected_at: string;
  question_1?: QuestionDetail;
  question_2?: QuestionDetail;
}

// 题目详情
export interface QuestionDetail {
  question_id: number;
  type: string;
  type_name: string;
  subject_id?: number;
  subject_name?: string;
  chapter_id?: number;
  subject_type?: string;
  subject_type_name?: string;
  content: string;
  content_detail?: string;
  attr?: string;
  sort?: number;
  channel_code?: string;
  analysis?: string;
  cleaned_content?: string;
  options?: Array<{
    label: string;
    content: string;
    seq: number;
  }>;
  correct_answer?: string;
  create_time?: string;
}

// 任务统计信息
export interface TaskStatistics {
  task: DedupTask;
  summary: {
    total_duplicates: number;
    exact_duplicate_groups: number;
    exact_duplicate_pairs: number;
    similar_duplicate_pairs: number;
    unique_question_count: number;
  };
  by_type: Array<{
    type: string;
    type_name: string;
    exact_groups: number;
    similar_pairs: number;
  }>;
  by_subject: Array<{
    subject_id: number;
    subject_name: string;
    exact_groups: number;
    similar_pairs: number;
  }>;
}

// 二次验证请求参数
export interface ReverifyTaskParams {
  /**
   * 验证类型：
   * - "similar": 只验证相似重复对（默认）
   * - "all": 验证所有重复对
   */
  verification_type?: "similar" | "all";
  /**
   * 是否重置任务状态让其重新运行，默认 true
   */
  reset_task?: boolean;
  /**
   * 批处理大小（1-200），默认 50
   */
  batch_size?: number;
}

// 二次验证响应数据
export interface ReverifyTaskData {
  total_pairs: number; // 验证的重复对总数
  verified_pairs: number; // 验证通过的重复对数
  filtered_pairs: number; // 被过滤掉的重复对数
  task_reset: boolean; // 是否重置了任务状态
  verification_type: "similar" | "all"; // 验证类型
}

// 二次验证接口响应
export interface ReverifyTaskResponse extends ApiResponse {
  data?: ReverifyTaskData;
}

// 分页信息
export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

// ===================== 请求参数类型 =====================

// 获取任务列表参数
export interface GetTasksParams {
  page?: number;
  page_size?: number;
  status?: TaskStatus;
  task_name?: string; // 任务名称搜索（关键词）
  created_at_start?: string; // 创建时间范围开始（YYYY-MM-DD 格式）
  created_at_end?: string; // 创建时间范围结束（YYYY-MM-DD 格式）
}

// 创建任务参数
export interface CreateTaskParams {
  task_name?: string;
  analysis_type?: string; // 分析类型，默认 'full'
  config?: TaskConfig;
}

// 获取完全重复组列表参数
export interface GetExactGroupsParams {
  page?: number;
  page_size?: number;
  group_type?: string; // 1=单选, 2=多选, 3=判断, 4=填空, 8=计算分析
  subject_id?: number;
  question_count?: number; // 题目数量筛选
}

// 获取相似重复对列表参数
export interface GetSimilarPairsParams {
  page?: number;
  page_size?: number;
  min_similarity?: number;
  group_type?: string;
}

// ===================== 响应类型 =====================

// 任务列表响应
export interface TaskListResponse extends ApiResponse {
  data?: {
    list: DedupTask[];
    pagination: Pagination;
  };
}

// 任务详情响应
export interface TaskDetailResponse extends ApiResponse {
  data?: DedupTask;
}

// 完全重复组列表响应
export interface ExactGroupListResponse extends ApiResponse {
  data?: {
    list: ExactDuplicateGroup[];
    pagination: Pagination;
  };
}

// 完全重复组详情响应
export interface ExactGroupDetailResponse extends ApiResponse {
  data?: ExactDuplicateGroup;
}

// 相似重复对列表响应
export interface SimilarPairListResponse extends ApiResponse {
  data?: {
    list: SimilarDuplicatePair[];
    pagination: Pagination;
  };
}

// 相似重复对详情响应
export interface SimilarPairDetailResponse extends ApiResponse {
  data?: SimilarDuplicatePair;
}

// 任务统计响应
export interface TaskStatisticsResponse extends ApiResponse {
  data?: TaskStatistics;
}

// ===================== API 方法 =====================

/**
 * 获取任务列表
 */
export async function getDedupTasks(
  params?: GetTasksParams
): Promise<TaskListResponse> {
  try {
    // 构建请求参数，过滤 undefined 和空值
    const requestParams: Record<string, any> = {
      page: params?.page || 1,
      page_size: params?.page_size || 20,
    };
    if (params?.status) requestParams.status = params.status;
    if (params?.task_name) requestParams.task_name = params.task_name;
    if (params?.created_at_start) requestParams.created_at_start = params.created_at_start;
    if (params?.created_at_end) requestParams.created_at_end = params.created_at_end;
    
    const response = await request.get<TaskListResponse>("/dedup/tasks", {
      params: requestParams,
    });
    return response as unknown as TaskListResponse;
  } catch (error: any) {
    throw error;
  }
}

/**
 * 创建新任务
 */
export async function createDedupTask(
  params?: CreateTaskParams
): Promise<TaskDetailResponse> {
  try {
    const response = await request.post<TaskDetailResponse>("/dedup/tasks", {
      task_name: params?.task_name,
      analysis_type: params?.analysis_type,
      config: params?.config,
    });
    return response as unknown as TaskDetailResponse;
  } catch (error: any) {
    throw error;
  }
}

/**
 * 获取任务详情
 */
export async function getDedupTaskDetail(
  taskId: number
): Promise<TaskDetailResponse> {
  try {
    const response = await request.get<TaskDetailResponse>(
      `/dedup/tasks/${taskId}`
    );
    return response as unknown as TaskDetailResponse;
  } catch (error: any) {
    throw error;
  }
}

/**
 * 删除任务
 */
export async function deleteDedupTask(taskId: number): Promise<ApiResponse> {
  try {
    const response = await request.delete<ApiResponse>(
      `/dedup/tasks/${taskId}`
    );
    return response as unknown as ApiResponse;
  } catch (error: any) {
    throw error;
  }
}

/**
 * 启动任务
 */
export async function startDedupTask(
  taskId: number
): Promise<TaskDetailResponse> {
  try {
    const response = await request.post<TaskDetailResponse>(
      `/dedup/tasks/${taskId}/start`
    );
    return response as unknown as TaskDetailResponse;
  } catch (error: any) {
    throw error;
  }
}

/**
 * 取消任务
 */
export async function cancelDedupTask(
  taskId: number
): Promise<TaskDetailResponse> {
  try {
    const response = await request.post<TaskDetailResponse>(
      `/dedup/tasks/${taskId}/cancel`
    );
    return response as unknown as TaskDetailResponse;
  } catch (error: any) {
    throw error;
  }
}

/**
 * 暂停任务
 */
export async function pauseDedupTask(
  taskId: number
): Promise<TaskDetailResponse> {
  try {
    const response = await request.post<TaskDetailResponse>(
      `/dedup/tasks/${taskId}/pause`
    );
    return response as unknown as TaskDetailResponse;
  } catch (error: any) {
    throw error;
  }
}

/**
 * 继续任务
 */
export async function resumeDedupTask(
  taskId: number
): Promise<TaskDetailResponse> {
  try {
    const response = await request.post<TaskDetailResponse>(
      `/dedup/tasks/${taskId}/resume`
    );
    return response as unknown as TaskDetailResponse;
  } catch (error: any) {
    throw error;
  }
}

/**
 * 获取完全重复组列表
 */
export async function getExactGroups(
  taskId: number,
  params?: GetExactGroupsParams
): Promise<ExactGroupListResponse> {
  try {
    const response = await request.get<ExactGroupListResponse>(
      `/dedup/tasks/${taskId}/exact-groups`,
      {
        params: {
          page: params?.page || 1,
          page_size: params?.page_size || 20,
          ...(params?.group_type && { group_type: params.group_type }),
          ...(params?.subject_id && { subject_id: params.subject_id }),
          ...(params?.question_count && { question_count: params.question_count }),
        },
      }
    );
    return response as unknown as ExactGroupListResponse;
  } catch (error: any) {
    throw error;
  }
}

/**
 * 获取完全重复组详情
 */
export async function getExactGroupDetail(
  taskId: number,
  groupId: number
): Promise<ExactGroupDetailResponse> {
  try {
    const response = await request.get<ExactGroupDetailResponse>(
      `/dedup/tasks/${taskId}/exact-groups/${groupId}`
    );
    return response as unknown as ExactGroupDetailResponse;
  } catch (error: any) {
    throw error;
  }
}

/**
 * 获取相似重复对列表
 */
export async function getSimilarPairs(
  taskId: number,
  params?: GetSimilarPairsParams
): Promise<SimilarPairListResponse> {
  try {
    const response = await request.get<SimilarPairListResponse>(
      `/dedup/tasks/${taskId}/similar-pairs`,
      {
        params: {
          page: params?.page || 1,
          page_size: params?.page_size || 20,
          ...(params?.min_similarity && {
            min_similarity: params.min_similarity,
          }),
          ...(params?.group_type && { group_type: params.group_type }),
        },
      }
    );
    return response as unknown as SimilarPairListResponse;
  } catch (error: any) {
    throw error;
  }
}

/**
 * 获取相似重复对详情
 */
export async function getSimilarPairDetail(
  taskId: number,
  pairId: number
): Promise<SimilarPairDetailResponse> {
  try {
    const response = await request.get<SimilarPairDetailResponse>(
      `/dedup/tasks/${taskId}/similar-pairs/${pairId}`
    );
    return response as unknown as SimilarPairDetailResponse;
  } catch (error: any) {
    throw error;
  }
}

/**
 * 获取任务统计信息
 */
export async function getTaskStatistics(
  taskId: number
): Promise<TaskStatisticsResponse> {
  try {
    const response = await request.get<TaskStatisticsResponse>(
      `/dedup/tasks/${taskId}/statistics`
    );
    return response as unknown as TaskStatisticsResponse;
  } catch (error: any) {
    throw error;
  }
}

/**
 * 去重任务二次验证
 */
export async function reverifyDedupTask(
  taskId: number,
  params?: ReverifyTaskParams
): Promise<ReverifyTaskResponse> {
  try {
    const payload: ReverifyTaskParams = {
      verification_type: params?.verification_type ?? "similar",
      reset_task: params?.reset_task ?? true,
      batch_size: params?.batch_size ?? 50,
    };

    const response = await request.post<ReverifyTaskResponse>(
      `/dedup/tasks/${taskId}/reverify`,
      payload
    );

    return response as unknown as ReverifyTaskResponse;
  } catch (error: any) {
    throw error;
  }
}
