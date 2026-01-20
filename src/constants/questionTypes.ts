/**
 * 题目类型常量定义
 */

export interface QuestionTypeOption {
  label: string;
  value: string;
}

/**
 * 题目类型代码到名称的映射
 */
export const QUESTION_TYPE_MAP: Record<string, string> = {
  "1": "单选题",
  "2": "多选题",
  "3": "判断题",
  "4": "填空题",
  "8": "计算分析题",
  single: "单选题",
  multiple: "多选题",
  fill: "填空题",
  shortAnswer: "简答题",
  judge: "判断题",
  essay: "论述题",
  calc: "计算分析题",
};

/**
 * 题目类型选项列表（用于下拉选择）
 */
export const QUESTION_TYPE_OPTIONS: QuestionTypeOption[] = [
  { label: "全部", value: "" },
  { label: "单选题", value: "1" },
  { label: "多选题", value: "2" },
  { label: "判断题", value: "3" },
  { label: "填空题", value: "4" },
  { label: "计算分析题", value: "8" },
];

/**
 * 题型代码转换映射（后端代码 -> 前端代码）
 */
export const TYPE_CODE_MAP: Record<string, string> = {
  "1": "single",
  "2": "multiple",
  "3": "judge",
  "4": "fill",
  "8": "calc",
};

/**
 * 获取题型名称
 */
export function getQuestionTypeName(type: string): string {
  return QUESTION_TYPE_MAP[type] || type;
}

/**
 * 将后端题型代码转换为前端格式
 */
export function convertTypeCode(type: string): string {
  return TYPE_CODE_MAP[type] || type;
}

