<template>
  <el-dialog
    v-model="dialogVisible"
    title="题目详情"
    width="800px"
    :before-close="handleClose"
  >
    <div v-if="question" class="question-detail-content">
      <!-- 基本信息 -->
      <el-descriptions :column="2" border>
        <el-descriptions-item label="题目编号">
          {{ question.questionId }}
        </el-descriptions-item>
        <el-descriptions-item label="科目">
          {{ stripHtmlTags(formatSubject(question.subject)) }}
        </el-descriptions-item>
        <el-descriptions-item label="题目类型">
          {{ formatQuestionType(question.questionType || question.type || '') }}
        </el-descriptions-item>
        <el-descriptions-item label="难度等级">
          {{ formatDifficulty(question.difficulty) }}
        </el-descriptions-item>
        <el-descriptions-item label="分值">
          {{ question.score }} 分
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="question.status === 'active' ? 'success' : 'info'">
            {{ question.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <!-- 题目内容 -->
      <div class="detail-section">
        <h4 v-if="question.questionType === 'fill' || question.type === '4'">题目内容（含填空位置）</h4>
        <h4 v-else>题目内容</h4>
        <div class="content-box">{{ stripHtmlTags(question.content) }}</div>
      </div>

      <!-- 选择题选项 -->
      <div v-if="(question.questionType === 'single' || question.questionType === 'multiple' || question.type === '1' || question.type === '2') && question.options && question.options.length > 0" class="detail-section">
        <h4>选项</h4>
        <div class="options-list">
          <div
            v-for="(option, index) in question.options"
            :key="index"
            class="option-item"
            :class="{ 'is-correct': isOptionCorrect(getOptionLabel(option, index)) }"
          >
            <span class="option-label">{{ getOptionLabel(option, index) }}.</span>
            <span class="option-content">{{ getOptionContent(option) }}</span>
            <span v-if="isOptionCorrect(getOptionLabel(option, index))" class="correct-mark">✓ 正确答案</span>
          </div>
        </div>
      </div>

      <!-- 正确答案/参考答案 -->
      <div v-if="question.correctAnswer" class="detail-section">
        <h4 v-if="question.questionType === 'essay'">参考答案</h4>
        <h4 v-else-if="question.questionType === 'shortAnswer'">参考答案</h4>
        <h4 v-else-if="question.questionType === 'fill'">填空答案</h4>
        <h4 v-else-if="question.questionType === 'judge'">正确答案</h4>
        <h4 v-else>正确答案</h4>
        <div class="content-box answer-box" :class="{ 'judge-answer': question.questionType === 'judge' }">
          <template v-if="question.questionType === 'judge'">
            <span class="judge-answer-text">
              {{ formatJudgeAnswer(question.correctAnswer) }}
            </span>
          </template>
          <template v-else-if="question.questionType === 'single' || question.questionType === 'multiple' || question.type === '1' || question.type === '2'">
            <span class="choice-answer-text">
              正确答案：
              <span class="answer-letters">
                {{ formatChoiceAnswer(question.correctAnswer) }}
              </span>
            </span>
            <div v-if="question.options" class="answer-options">
              <div
                v-for="(option, index) in question.options"
                :key="index"
                v-show="isOptionCorrect(getOptionLabel(option, index))"
                class="answer-option-item"
              >
                {{ getOptionLabel(option, index) }}. {{ getOptionContent(option) }}
              </div>
            </div>
          </template>
          <template v-else-if="question.questionType === 'fill' || question.type === '4'">
            <!-- 填空题答案：多个答案分行显示 -->
            <div class="fill-answer-content">
              <template v-if="Array.isArray(question.correctAnswer)">
                <div v-for="(answer, index) in question.correctAnswer" :key="index" class="fill-answer-item">
                  {{ stripHtmlTags(String(answer)) }}
                </div>
              </template>
              <template v-else>
                <div v-for="(answer, index) in getFillAnswers(question.correctAnswer)" :key="index" class="fill-answer-item">
                  {{ stripHtmlTags(answer) }}
                </div>
              </template>
            </div>
          </template>
          <template v-else-if="question.questionType === 'calc' || question.type === '8'">
            <!-- 计算分析题的答案展示 -->
            <div v-if="question.subQuestions && question.subQuestions.length > 0" class="calc-answer-section">
              <div class="calc-answer-header">
                <span class="calc-answer-title">共 {{ question.subQuestions.length }} 道子题</span>
                <span v-if="question.answerType2" class="calc-answer-type">
                  {{ question.answerType2 === '1' ? '分录题' : question.answerType2 === '2' ? '填空题' : '' }}
                </span>
              </div>
              <div
                v-for="(subQ, index) in question.subQuestions"
                :key="subQ.calcchild_id"
                class="sub-question-item"
              >
                <div class="sub-question-header">
                  <span class="sub-question-number">子题 {{ index + 1 }}</span>
                  <span class="sub-question-type">
                    {{ getSubQuestionTypeName(subQ.type) }}
                  </span>
                </div>
                <div class="sub-question-content">
                  <div class="sub-question-text">{{ stripHtmlTags(subQ.content) }}</div>
                  
                  <!-- 子题选项（如果有） -->
                  <div v-if="subQ.options && subQ.options.length > 0" class="sub-question-options">
                    <div
                      v-for="(option, optIndex) in subQ.options"
                      :key="optIndex"
                      class="sub-option-item"
                      :class="{ 'is-correct': isSubOptionCorrect(subQ, getOptionLabel(option, optIndex)) }"
                    >
                      <span class="sub-option-label">{{ getOptionLabel(option, optIndex) }}.</span>
                      <span class="sub-option-content">{{ getOptionContent(option) }}</span>
                    </div>
                  </div>
                  
                  <!-- 子题答案：多个答案分行显示 -->
                  <div class="sub-question-answer">
                    <span class="sub-answer-label">答案：</span>
                    <div class="sub-answer-content">
                      <template v-if="subQ.answer.option_true">
                        <!-- 如果是选项答案，可能有多个选项，分行显示 -->
                        <div v-for="(option, optIdx) in getSubQuestionAnswers(subQ.answer.option_true)" :key="optIdx" class="sub-answer-item">
                          {{ stripHtmlTags(option) }}
                        </div>
                      </template>
                      <template v-else-if="subQ.answer.answer_content">
                        <!-- 如果是文本答案，检查是否包含多个答案，分行显示 -->
                        <div v-for="(answer, ansIdx) in getSubQuestionTextAnswers(subQ.answer.answer_content)" :key="ansIdx" class="sub-answer-item">
                          {{ stripHtmlTags(answer) }}
                        </div>
                      </template>
                      <template v-else>
                        <span class="sub-answer-item">无答案</span>
                      </template>
                    </div>
                  </div>
                  
                  <!-- 子题解析（如果有） -->
                  <div v-if="subQ.analysis" class="sub-question-analysis">
                    <span class="sub-analysis-label">解析：</span>
                    <span class="sub-analysis-content">{{ stripHtmlTags(subQ.analysis) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="calc-answer-empty">暂无子题答案</div>
          </template>
          <template v-else>
            {{ question.correctAnswer }}
          </template>
        </div>
      </div>


      <!-- 题目解析 -->
      <div v-if="question.analysis" class="detail-section">
        <h4>题目解析</h4>
        <div class="content-box">{{ stripHtmlTags(question.analysis) }}</div>
      </div>

      <!-- 其他信息 -->
      <el-descriptions :column="2" border class="detail-section">
        <el-descriptions-item label="知识点" v-if="question.knowledgePoint">
          {{ question.knowledgePoint }}
        </el-descriptions-item>
        <el-descriptions-item label="标签" v-if="question.tags && question.tags.length > 0">
          <el-tag
            v-for="tag in question.tags"
            :key="tag"
            size="small"
            style="margin-right: 8px"
          >
            {{ tag }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="使用次数" v-if="question.usageCount !== undefined">
          {{ question.usageCount }} 次
        </el-descriptions-item>
        <el-descriptions-item label="正确率" v-if="question.correctRate !== undefined">
          {{ question.correctRate }}%
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(question.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ formatDate(question.updatedAt) }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { stripHtmlTags } from "@/utils/common";

// 计算分析题子题
interface SubQuestionItem {
  calcchild_id: number;
  type: string; // 1=分录题, 2=填空题, 3=不定项选择
  content: string;
  answer: {
    answer_content?: string;
    option_true?: string;
  };
  options?: Array<{ label: string; content: string }>;
  analysis?: string;
  sort: number;
}

interface QuestionItem {
  questionId: number | string;
  subject: string;
  content: string;
  questionType: "single" | "multiple" | "fill" | "shortAnswer" | "judge" | "essay" | "calc";
  type?: string; // 题型代码
  difficulty?: "easy" | "medium" | "hard";
  score?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  options?: string[] | Array<{ label: string; content: string }>;
  correctAnswer?: string | string[];
  analysis?: string;
  subQuestions?: SubQuestionItem[]; // 计算分析题的子题
  answerType2?: string; // 计算分析题类型：1=分录题, 2=填空题
  knowledgePoint?: string;
  tags?: string[];
  usageCount?: number;
  correctRate?: number;
  status?: "active" | "inactive";
}

const props = defineProps<{
  modelValue: boolean;
  question: QuestionItem | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  close: [];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

function handleClose() {
  emit("close");
}

const formatDate = (d: string | Date) => {
  const date = new Date(d);
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, "0");
  const D = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${Y}-${M}-${D} ${h}:${m}`;
};

const formatQuestionType = (type: string) => {
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
};

const formatDifficulty = (difficulty: string) => {
  const difficultyMap: Record<string, string> = {
    easy: "简单",
    medium: "中等",
    hard: "困难",
  };
  return difficultyMap[difficulty] || difficulty;
};

const formatSubject = (subject: string) => {
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
};

// 判断选项是否为正确答案
const isOptionCorrect = (optionLabel: string) => {
  if (!props.question?.correctAnswer) return false;
  
  // 处理数组类型的答案
  if (Array.isArray(props.question.correctAnswer)) {
    return props.question.correctAnswer.some(ans => 
      stripHtmlTags(String(ans)) === optionLabel
    );
  }
  
  // 处理字符串类型的答案（支持逗号、中文逗号、顿号、空格等分隔符）
  const answerStr = String(props.question.correctAnswer);
  const answers = answerStr
    .split(/[,，、\s]+/)
    .map(a => stripHtmlTags(a.trim()))
    .filter(a => a);
  return answers.includes(optionLabel);
};

// 格式化判断题答案
const formatJudgeAnswer = (answer: string | undefined) => {
  if (!answer) return "-";
  const answerStr = String(answer).toLowerCase().trim();
  if (answerStr === "true" || answerStr === "对" || answerStr === "正确" || answerStr === "1" || answerStr === "yes") {
    return "对";
  }
  if (answerStr === "false" || answerStr === "错" || answerStr === "错误" || answerStr === "0" || answerStr === "no") {
    return "错";
  }
  return answer;
};

// 格式化选择题答案（多选题用顿号分隔）
const formatChoiceAnswer = (answer: string | string[] | undefined) => {
  if (!answer) return "-";
  // 如果是数组，直接处理
  if (Array.isArray(answer)) {
    return answer.length > 0 ? answer.join("、") : "-";
  }
  // 处理多选题的多个答案，支持多种分隔符：逗号、中文逗号、顿号、空格
  const answers = String(answer).split(/[,，、\s]+/).map(a => a.trim()).filter(a => a);
  // 如果有多个答案，用顿号分隔；如果只有一个答案，也返回（可能是单选题）
  return answers.length > 0 ? answers.join("、") : String(answer);
};

// 获取选项标签（如果是对象则使用label，否则使用默认标签）
const getOptionLabel = (option: string | { label: string; content: string }, index: number): string => {
  if (typeof option === 'object' && option !== null && 'label' in option) {
    return stripHtmlTags(option.label);
  }
  return String.fromCharCode(65 + index);
};

// 获取选项内容（如果是对象则使用content，否则直接使用）
const getOptionContent = (option: string | { label: string; content: string }): string => {
  if (typeof option === 'object' && option !== null && 'content' in option) {
    // 对于单选题，如果选项是对象，只展示content（因为label已经在标签中显示了）
    return stripHtmlTags(option.content);
  }
  return stripHtmlTags(String(option));
};

// 获取子题类型名称
const getSubQuestionTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    "1": "分录题",
    "2": "填空题",
    "3": "不定项选择",
  };
  return typeMap[type] || `类型${type}`;
};

// 判断子题选项是否为正确答案
const isSubOptionCorrect = (subQ: SubQuestionItem, optionLabel: string): boolean => {
  if (!subQ.answer.option_true) return false;
  const answers = String(subQ.answer.option_true)
    .split(/[,，、\s]+/)
    .map(a => stripHtmlTags(a.trim()))
    .filter(a => a);
  return answers.includes(optionLabel);
};

// 获取填空题的多个答案（处理分隔符）
const getFillAnswers = (answer: string | string[] | undefined): string[] => {
  if (!answer) return [];
  if (Array.isArray(answer)) {
    return answer.map(a => String(a));
  }
  // 如果是字符串，检查是否包含分隔符
  const answerStr = String(answer);
  if (/[,，、;；\n]/.test(answerStr)) {
    return answerStr.split(/[,，、;；\n]+/).map(v => v.trim()).filter(v => v);
  }
  return [answerStr];
};

// 获取子题的选项答案（可能有多个选项）
const getSubQuestionAnswers = (optionTrue: string): string[] => {
  if (!optionTrue) return [];
  // 按分隔符分割选项
  return optionTrue.split(/[,，、\s]+/).map(v => v.trim()).filter(v => v);
};

// 获取子题的文本答案（可能有多个答案）
const getSubQuestionTextAnswers = (answerContent: string): string[] => {
  if (!answerContent) return [];
  const answerStr = String(answerContent);
  // 检查是否包含分隔符
  if (/[,，、;；\n]/.test(answerStr)) {
    return answerStr.split(/[,，、;；\n]+/).map(v => v.trim()).filter(v => v);
  }
  return [answerStr];
};
</script>

<style scoped lang="scss">
.question-detail-content {
  .detail-section {
    margin-top: 20px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }

    .content-box {
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;
      line-height: 1.6;
      color: #606266;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .answer-box {
      background: #f0f9ff;
      color: #1890ff;
      font-weight: 500;

      &.judge-answer {
        .judge-answer-text {
          font-size: 18px;
          font-weight: 600;
          color: #409eff;
        }
      }

      .choice-answer-text {
        font-size: 16px;
        font-weight: 500;
        color: #409eff;
        margin-bottom: 12px;
        display: block;

        .answer-letters {
          font-size: 18px;
          font-weight: 600;
          color: #67c23a;
        }
      }

      .answer-options {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e4e7ed;

        .answer-option-item {
          padding: 8px 12px;
          margin-bottom: 8px;
          background: #f0f9ff;
          border-left: 3px solid #409eff;
          color: #409eff;
          font-weight: 500;
          border-radius: 4px;
        }
      }
    }

    .options-list {
      .option-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        margin-bottom: 8px;
        background: #f5f7fa;
        border-radius: 4px;
        transition: all 0.3s;

        &.is-correct {
          background: #f0f9ff;
          border: 1px solid #409eff;
        }

        .option-label {
          font-weight: 500;
          color: #409eff;
          margin-right: 8px;
          min-width: 24px;
        }

        .option-content {
          flex: 1;
          color: #606266;
        }

        &.is-correct .option-content {
          color: #409eff;
          font-weight: 500;
        }

        .correct-mark {
          margin-left: auto;
          color: #67c23a;
          font-weight: 500;
          font-size: 12px;
        }
      }
    }

    .fill-answer-content {
      .fill-answer-item {
        padding: 8px 12px;
        margin-bottom: 8px;
        background: #fff;
        border-left: 3px solid #409eff;
        border-radius: 4px;
        line-height: 1.6;
        color: #303133;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .calc-answer-section {
      .calc-answer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        background: #f0f9ff;
        border-radius: 4px;
        margin-bottom: 16px;

        .calc-answer-title {
          font-size: 16px;
          font-weight: 600;
          color: #409eff;
        }

        .calc-answer-type {
          font-size: 14px;
          color: #606266;
          padding: 4px 12px;
          background: #fff;
          border-radius: 4px;
          border: 1px solid #dcdfe6;
        }
      }

      .sub-question-item {
        margin-bottom: 20px;
        padding: 16px;
        background: #fafafa;
        border-radius: 6px;
        border: 1px solid #e4e7ed;

        &:last-child {
          margin-bottom: 0;
        }

        .sub-question-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e4e7ed;

          .sub-question-number {
            font-size: 15px;
            font-weight: 600;
            color: #409eff;
          }

          .sub-question-type {
            font-size: 13px;
            color: #909399;
            padding: 2px 8px;
            background: #f5f7fa;
            border-radius: 4px;
          }
        }

        .sub-question-content {
          .sub-question-text {
            line-height: 1.8;
            color: #606266;
            margin-bottom: 12px;
            padding: 8px;
            background: #fff;
            border-radius: 4px;
          }

          .sub-question-options {
            margin: 12px 0;

            .sub-option-item {
              display: flex;
              align-items: flex-start;
              padding: 8px 12px;
              margin-bottom: 8px;
              background: #fff;
              border-radius: 4px;
              border: 1px solid #e4e7ed;
              transition: all 0.3s;

              &.is-correct {
                background: #f0f9ff;
                border-color: #409eff;
              }

              .sub-option-label {
                font-weight: 500;
                color: #409eff;
                margin-right: 8px;
                min-width: 24px;
              }

              .sub-option-content {
                flex: 1;
                color: #606266;
                line-height: 1.6;
              }

              &.is-correct .sub-option-content {
                color: #409eff;
                font-weight: 500;
              }
            }
          }

          .sub-question-answer {
            display: flex;
            align-items: flex-start;
            padding: 12px;
            margin-top: 12px;
            background: #f0f9ff;
            border-radius: 4px;
            border-left: 3px solid #409eff;

            .sub-answer-label {
              font-weight: 600;
              color: #409eff;
              margin-right: 8px;
              white-space: nowrap;
            }

            .sub-answer-content {
              flex: 1;
              color: #303133;
              line-height: 1.8;
              word-break: break-word;

              .sub-answer-item {
                display: block;
                padding: 4px 0;
                margin-bottom: 4px;

                &:last-child {
                  margin-bottom: 0;
                }
              }
            }
          }

          .sub-question-analysis {
            display: flex;
            align-items: flex-start;
            padding: 12px;
            margin-top: 12px;
            background: #fff;
            border-radius: 4px;
            border: 1px solid #e4e7ed;

            .sub-analysis-label {
              font-weight: 500;
              color: #909399;
              margin-right: 8px;
              white-space: nowrap;
            }

            .sub-analysis-content {
              flex: 1;
              color: #606266;
              line-height: 1.8;
              word-break: break-word;
            }
          }
        }
      }

      .calc-answer-empty {
        padding: 20px;
        text-align: center;
        color: #909399;
        background: #f5f7fa;
        border-radius: 4px;
      }
    }
  }
}
</style>

