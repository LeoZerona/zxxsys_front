import type { TaskStatus } from "@/api/dedup";

/**
 * 格式化日期时间
 * @param d 日期字符串、Date 对象或 null/undefined
 * @returns 格式化后的日期字符串，格式：YYYY-MM-DD HH:mm，如果输入为空则返回 "-"
 */
export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "-";
  const date = new Date(d);
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, "0");
  const D = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${Y}-${M}-${D} ${h}:${m}`;
}

/**
 * 格式化任务状态
 * @param status 任务状态
 * @returns 包含显示文本和标签类型的对象
 */
export function formatStatus(
  status: TaskStatus | string
): { text: string; type: string } {
  const statusMap: Record<string, { text: string; type: string }> = {
    pending: { text: "待启动", type: "info" },
    running: { text: "运行中", type: "warning" },
    paused: { text: "已暂停", type: "warning" },
    completed: { text: "已完成", type: "success" },
    error: { text: "错误", type: "danger" },
    cancelled: { text: "已取消", type: "info" },
  };
  return statusMap[status] || { text: status, type: "info" };
}

/**
 * 格式化任务详情页状态（略有不同）
 * @param status 任务状态
 * @returns 包含显示文本和标签类型的对象
 */
export function formatTaskDetailStatus(
  status: TaskStatus | string
): { text: string; type: string } {
  const statusMap: Record<string, { text: string; type: string }> = {
    pending: { text: "待处理", type: "info" },
    running: { text: "运行中", type: "warning" },
    completed: { text: "已完成", type: "success" },
    error: { text: "错误", type: "danger" },
    cancelled: { text: "已取消", type: "info" },
  };
  return statusMap[status] || { text: status, type: "info" };
}

/**
 * 格式化进度百分比
 * @param percentage 进度百分比（0-100）或 null/undefined
 * @returns 格式化后的进度字符串，格式：XX.X%，如果输入为空或 NaN 则返回 "-"
 */
export function formatProgress(
  percentage: number | null | undefined
): string {
  if (percentage == null || isNaN(percentage)) {
    return "-";
  }
  return `${percentage.toFixed(1)}%`;
}

/**
 * 格式化题目类型
 * @param type 题型代码或名称
 * @returns 格式化后的题型名称
 */
export function formatQuestionType(type: string): string {
  const typeMap: Record<string, string> = {
    single: "单选题",
    multiple: "多选题",
    fill: "填空题",
    shortAnswer: "简答题",
    judge: "判断题",
    essay: "论述题",
    calc: "计算分析题",
    "1": "单选题",
    "2": "多选题",
    "3": "判断题",
    "4": "填空题",
    "8": "计算分析题",
  };
  return typeMap[type] || type;
}

/**
 * 格式化难度等级
 * @param difficulty 难度代码
 * @returns 格式化后的难度名称
 */
export function formatDifficulty(difficulty: string): string {
  const difficultyMap: Record<string, string> = {
    easy: "简单",
    medium: "中等",
    hard: "困难",
  };
  return difficultyMap[difficulty] || difficulty;
}

/**
 * 格式化科目名称
 * @param subject 科目代码或名称
 * @returns 格式化后的科目名称
 */
export function formatSubject(subject: string): string {
  const subjectMap: Record<string, string> = {
    math: "数学",
    chinese: "语文",
    english: "英语",
    physics: "物理",
    chemistry: "化学",
    biology: "生物",
    history: "历史",
    geography: "地理",
    politics: "政治",
  };
  return subjectMap[subject] || subject;
}

/**
 * 格式化表格列的日期值（用于 el-table 的 formatter）
 * @param row 行数据
 * @param column 列配置
 * @param cellValue 单元格值
 * @returns 格式化后的日期字符串
 */
export function formatDateColumn(
  row: any,
  column: any,
  cellValue: any
): string {
  return formatDate(cellValue);
}

/**
 * 根据相似度获取标签类型
 * @param similarity 相似度（0-1）
 * @returns Element Plus 标签类型
 */
export function getSimilarityTagType(
  similarity: number
): "danger" | "warning" | "info" {
  if (similarity >= 0.9) return "danger";
  if (similarity >= 0.8) return "warning";
  return "info";
}

