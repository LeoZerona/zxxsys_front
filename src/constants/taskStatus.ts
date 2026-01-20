import type { TaskStatus } from "@/api/dedup";

/**
 * 任务状态常量定义
 */

export interface StatusConfig {
  text: string;
  type: "info" | "warning" | "success" | "danger";
}

/**
 * 任务状态映射（列表页）
 */
export const TASK_STATUS_MAP: Record<TaskStatus | string, StatusConfig> = {
  pending: { text: "待启动", type: "info" },
  running: { text: "运行中", type: "warning" },
  paused: { text: "已暂停", type: "warning" },
  completed: { text: "已完成", type: "success" },
  error: { text: "错误", type: "danger" },
  cancelled: { text: "已取消", type: "info" },
};

/**
 * 任务状态映射（详情页，略有不同）
 */
export const TASK_DETAIL_STATUS_MAP: Record<
  TaskStatus | string,
  StatusConfig
> = {
  pending: { text: "待处理", type: "info" },
  running: { text: "运行中", type: "warning" },
  paused: { text: "已暂停", type: "warning" },
  completed: { text: "已完成", type: "success" },
  error: { text: "错误", type: "danger" },
  cancelled: { text: "已取消", type: "info" },
};

/**
 * 获取任务状态配置
 */
export function getTaskStatusConfig(
  status: TaskStatus | string,
  isDetail = false
): StatusConfig {
  const map = isDetail ? TASK_DETAIL_STATUS_MAP : TASK_STATUS_MAP;
  return map[status] || { text: status, type: "info" };
}

