import request from "@/utils/request";
import type { ApiResponse } from "./auth";

// ===================== 类型定义 =====================

// 任务状态
export type TaskStatus =
  | "pending"
  | "running"
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
}

// 创建任务参数
export interface CreateTaskParams {
  task_name?: string;
  config?: TaskConfig;
}

// 获取完全重复组列表参数
export interface GetExactGroupsParams {
  page?: number;
  page_size?: number;
  group_type?: string; // 1=单选, 2=多选, 3=判断, 4=填空, 8=计算分析
  subject_id?: number;
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
    const response = await request.get<TaskListResponse>("/dedup/tasks", {
      params: {
        page: params?.page || 1,
        page_size: params?.page_size || 20,
        ...(params?.status && { status: params.status }),
      },
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
