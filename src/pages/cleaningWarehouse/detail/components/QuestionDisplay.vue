<template>
  <div class="question-display">
    <!-- 题目基本信息 -->
    <el-descriptions :column="2" border size="small" class="question-info">
      <el-descriptions-item label="题目类型">{{ question.type_name }}</el-descriptions-item>
      <el-descriptions-item label="科目">{{ question.subject_name || '-' }}</el-descriptions-item>
      <el-descriptions-item label="章节ID" v-if="question.chapter_id">{{ question.chapter_id }}</el-descriptions-item>
      <el-descriptions-item label="创建时间" v-if="question.create_time">{{ formatDate(question.create_time) }}</el-descriptions-item>
    </el-descriptions>

    <!-- 题目内容 -->
    <div class="question-content">
      <div class="content-label">题目内容：</div>
      <div class="content-text">{{ stripHtmlTags(question.content) }}</div>
    </div>

    <!-- 选择题选项（单选题、多选题） -->
    <div
      v-if="(question.type === '1' || question.type === '2') && question.options && question.options.length > 0"
      class="question-options"
    >
      <div class="content-label">选项：</div>
      <div class="options-list">
        <div
          v-for="option in question.options"
          :key="option.seq"
          class="option-item"
          :class="{ 'is-correct': isOptionCorrect(option.label, question.correct_answer) }"
        >
          <span class="option-label">{{ option.label }}.</span>
          <span class="option-content">{{ stripHtmlTags(option.content) }}</span>
          <span v-if="isOptionCorrect(option.label, question.correct_answer)" class="correct-mark">✓</span>
        </div>
      </div>
    </div>

    <!-- 正确答案 -->
    <div v-if="question.correct_answer" class="question-answer">
      <div class="content-label">正确答案：</div>
      <div class="answer-text">
        {{ formatAnswer(question.correct_answer, question.type) }}
      </div>
    </div>

    <!-- 题目解析 -->
    <div v-if="question.analysis" class="question-analysis">
      <div class="content-label">解析：</div>
      <div class="content-text">{{ stripHtmlTags(question.analysis) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { stripHtmlTags } from "@/utils/common";
import type { QuestionDetail } from "@/api/dedup";

const props = defineProps<{
  question: QuestionDetail;
}>();

// 工具函数
const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return "-";
  const date = new Date(d);
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, "0");
  const D = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${Y}-${M}-${D} ${h}:${m}`;
};

const isOptionCorrect = (label: string, correctAnswer: string | undefined) => {
  if (!correctAnswer) return false;
  const answers = String(correctAnswer)
    .split(/[,，、\s]+/)
    .map((v) => v.trim())
    .filter((v) => v);
  return answers.includes(label);
};

const formatAnswer = (answer: string, type: string) => {
  if (!answer) return "-";
  
  const cleanAnswer = stripHtmlTags(answer);
  
  // 判断题（type === "3"）
  if (type === "3") {
    const answerStr = cleanAnswer.toLowerCase().trim();
    if (answerStr === "true" || answerStr === "对" || answerStr === "正确" || answerStr === "1" || answerStr === "yes" || answerStr === "t") {
      return "对";
    }
    if (answerStr === "false" || answerStr === "错" || answerStr === "错误" || answerStr === "0" || answerStr === "no" || answerStr === "f") {
      return "错";
    }
    return cleanAnswer;
  }
  
  // 多选题（type === "2"）：多个答案用顿号分隔
  if (type === "2") {
    const answers = cleanAnswer.split(/[,，、\s]+/).map((v) => v.trim()).filter((v) => v);
    return answers.length > 0 ? answers.join("、") : cleanAnswer;
  }
  
  // 填空题（type === "4"）：多个答案分行显示
  if (type === "4") {
    const answers = cleanAnswer.split(/[,，、;；\n]+/).map((v) => v.trim()).filter((v) => v);
    return answers.length > 0 ? answers.join("\n") : cleanAnswer;
  }
  
  // 单选题（type === "1"）：直接显示答案
  if (type === "1") {
    return cleanAnswer;
  }
  
  // 计算分析题（type === "8"）：如果没有子题信息，按普通题目显示
  if (type === "8") {
    return cleanAnswer;
  }
  
  // 其他类型：直接显示去除HTML标签后的内容
  return cleanAnswer;
};
</script>

<style lang="scss" scoped>
.question-display {
  .question-info {
    margin-bottom: 16px;
  }

  .question-content,
  .question-options,
  .question-answer,
  .question-analysis {
    margin-bottom: 16px;

    .content-label {
      font-weight: 500;
      color: #606266;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .content-text,
    .answer-text {
      color: #303133;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 14px;
    }

    .answer-text {
      white-space: pre-line;
    }
  }

  .options-list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .option-item {
      display: flex;
      align-items: flex-start;
      padding: 8px 12px;
      background: #f8f9fa;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      transition: all 0.3s;

      &.is-correct {
        background: #f0f9ff;
        border-color: #409eff;

        .correct-mark {
          color: #409eff;
          font-weight: bold;
          margin-left: auto;
        }
      }

      .option-label {
        font-weight: 500;
        color: #409eff;
        margin-right: 8px;
        min-width: 24px;
      }

      .option-content {
        flex: 1;
        color: #303133;
        line-height: 1.6;
      }
    }
  }
}
</style>

