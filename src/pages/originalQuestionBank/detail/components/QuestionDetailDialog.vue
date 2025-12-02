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
          {{ formatSubject(question.subject) }}
        </el-descriptions-item>
        <el-descriptions-item label="题目类型">
          {{ formatQuestionType(question.questionType) }}
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
        <h4 v-if="question.questionType === 'fill'">题目内容（含填空位置）</h4>
        <h4 v-else>题目内容</h4>
        <div class="content-box">{{ question.content }}</div>
      </div>

      <!-- 选择题选项 -->
      <div v-if="(question.questionType === 'single' || question.questionType === 'multiple') && question.options && question.options.length > 0" class="detail-section">
        <h4>选项</h4>
        <div class="options-list">
          <div
            v-for="(option, index) in question.options"
            :key="index"
            class="option-item"
            :class="{ 'is-correct': isOptionCorrect(String.fromCharCode(65 + index)) }"
          >
            <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
            <span class="option-content">{{ option }}</span>
            <span v-if="isOptionCorrect(String.fromCharCode(65 + index))" class="correct-mark">✓ 正确答案</span>
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
          <template v-else-if="question.questionType === 'single' || question.questionType === 'multiple'">
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
                v-show="isOptionCorrect(String.fromCharCode(65 + index))"
                class="answer-option-item"
              >
                {{ String.fromCharCode(65 + index) }}. {{ option }}
              </div>
            </div>
          </template>
          <template v-else>
            {{ question.correctAnswer }}
          </template>
        </div>
      </div>


      <!-- 题目解析 -->
      <div v-if="question.analysis" class="detail-section">
        <h4>题目解析</h4>
        <div class="content-box">{{ question.analysis }}</div>
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

interface QuestionItem {
  questionId: number | string;
  subject: string;
  content: string;
  questionType: "single" | "multiple" | "fill" | "shortAnswer" | "judge" | "essay";
  difficulty: "easy" | "medium" | "hard";
  score: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  options?: string[];
  correctAnswer?: string;
  analysis?: string;
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
  // 处理多选题的多个答案（支持逗号、中文逗号、顿号、空格等分隔符）
  const answers = props.question.correctAnswer
    .split(/[,，、\s]+/)
    .map(a => a.trim())
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
const formatChoiceAnswer = (answer: string | undefined) => {
  if (!answer) return "-";
  // 处理多选题的多个答案，支持多种分隔符：逗号、中文逗号、顿号、空格
  const answers = answer.split(/[,，、\s]+/).map(a => a.trim()).filter(a => a);
  // 如果有多个答案，用顿号分隔；如果只有一个答案，也返回（可能是单选题）
  return answers.length > 0 ? answers.join("、") : answer;
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
  }
}
</style>

