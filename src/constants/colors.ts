/**
 * 颜色常量定义（用于图表、标签等）
 */

/**
 * 题型颜色映射
 */
export const QUESTION_TYPE_COLORS: Record<string, string> = {
  "1": "#409EFF", // 单选题 - 蓝色
  "2": "#67C23A", // 多选题 - 绿色
  "3": "#E6A23C", // 判断题 - 橙色
  "4": "#F56C6C", // 填空题 - 红色
  "8": "#909399", // 计算分析题 - 灰色
};

/**
 * 科目颜色列表（循环使用）
 */
export const SUBJECT_COLORS: string[] = [
  "#409EFF",
  "#67C23A",
  "#E6A23C",
  "#F56C6C",
  "#909399",
  "#9C27B0",
  "#FF9800",
  "#00BCD4",
];

/**
 * 获取题型颜色
 */
export function getTypeColor(type?: string): string {
  if (!type) return QUESTION_TYPE_COLORS["1"];
  return QUESTION_TYPE_COLORS[type] || QUESTION_TYPE_COLORS["1"];
}

/**
 * 获取科目颜色（根据科目ID或名称生成）
 */
export function getSubjectColor(
  subjectId?: number,
  subjectName?: string
): string {
  if (subjectId !== undefined) {
    return SUBJECT_COLORS[subjectId % SUBJECT_COLORS.length];
  }
  if (subjectName) {
    // 根据科目名称的哈希值选择颜色
    let hash = 0;
    for (let i = 0; i < subjectName.length; i++) {
      hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
  }
  return SUBJECT_COLORS[0];
}

/**
 * 难度颜色映射
 */
export const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "#67C23A", // 简单 - 绿色
  medium: "#E6A23C", // 中等 - 橙色
  hard: "#F56C6C", // 困难 - 红色
};

/**
 * 获取难度颜色
 */
export function getDifficultyColor(difficulty?: string): string {
  if (!difficulty) return DIFFICULTY_COLORS.medium;
  return DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.medium;
}

