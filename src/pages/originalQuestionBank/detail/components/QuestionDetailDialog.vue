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
        <h4>题目内容</h4>
        <div class="content-box">{{ question.content }}</div>
      </div>

      <!-- 选择题选项 -->
      <div v-if="question.options && question.options.length > 0" class="detail-section">
        <h4>选项</h4>
        <div class="options-list">
          <div
            v-for="(option, index) in question.options"
            :key="index"
            class="option-item"
          >
            <span class="option-label">{{ String.fromCharCode(65 + index) }}.</span>
            <span class="option-content">{{ option }}</span>
          </div>
        </div>
      </div>

      <!-- 正确答案 -->
      <div v-if="question.correctAnswer" class="detail-section">
        <h4>正确答案</h4>
        <div class="content-box answer-box">
          {{ question.correctAnswer }}
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
    }

    .options-list {
      .option-item {
        display: flex;
        padding: 8px 12px;
        margin-bottom: 8px;
        background: #f5f7fa;
        border-radius: 4px;

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
      }
    }
  }
}
</style>

