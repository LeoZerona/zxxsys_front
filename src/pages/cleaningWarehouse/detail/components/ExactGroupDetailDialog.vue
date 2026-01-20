<template>
  <el-dialog
    v-model="dialogVisible"
    title="完全重复组详情"
    width="900px"
    :before-close="handleClose"
  >
    <div v-if="groupDetail" v-loading="loading" class="group-detail-content">
      <!-- 组信息 -->
      <el-descriptions :column="3" border class="detail-section">
        <el-descriptions-item label="组ID">{{ groupDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="题目数量">{{ groupDetail.question_count }}</el-descriptions-item>
        <el-descriptions-item label="题型">{{ groupDetail.group.type_name }}</el-descriptions-item>
        <el-descriptions-item label="科目">{{ groupDetail.group.subject_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="渠道代码">{{ groupDetail.group.channel_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="检测时间">{{ formatDate(groupDetail.detected_at) }}</el-descriptions-item>
      </el-descriptions>

      <!-- 题目列表 -->
      <div class="detail-section">
        <h4>重复题目列表（共 {{ groupDetail.questions?.length || 0 }} 道）</h4>
        <div
          v-for="(question, index) in groupDetail.questions"
          :key="question.question_id"
          class="question-item"
        >
          <div class="question-header">
            <el-tag size="small" type="info">题目 {{ index + 1 }}</el-tag>
            <span class="question-id">ID: {{ question.question_id }}</span>
          </div>

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
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { stripHtmlTags } from "@/utils/common";
import { getExactGroupDetail, type ExactDuplicateGroup } from "@/api/dedup";
import { formatDate } from "@/utils/formatters";

const props = defineProps<{
  modelValue: boolean;
  groupId?: number;
  taskId?: number;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  close: [];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const loading = ref(false);
const groupDetail = ref<ExactDuplicateGroup | null>(null);

// 导入格式化工具函数
import { formatDate } from "@/utils/formatters";

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

// 获取组详情
async function fetchGroupDetail() {
  if (!props.taskId || !props.groupId) return;
  
  loading.value = true;
  try {
    const response = await getExactGroupDetail(props.taskId, props.groupId);
    if (response.success && response.data) {
      groupDetail.value = response.data;
    }
  } catch (error: any) {
    console.error("获取完全重复组详情失败:", error);
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  emit("close");
  groupDetail.value = null;
}

// 监听对话框打开，加载数据
watch(
  () => props.modelValue,
  (val) => {
    if (val && props.taskId && props.groupId) {
      fetchGroupDetail();
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.group-detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;

  h4 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 500;
    color: #303133;
  }
}

.question-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fafafa;

  &:last-child {
    margin-bottom: 0;
  }

  .question-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .question-id {
      font-size: 14px;
      color: #909399;
    }
  }

  .question-info {
    margin-bottom: 12px;
  }

  .question-content,
  .question-options,
  .question-answer,
  .question-analysis {
    margin-bottom: 12px;

    .content-label {
      font-weight: 500;
      color: #606266;
      margin-bottom: 8px;
    }

    .content-text,
    .answer-text {
      color: #303133;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;
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
      background: #fff;
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

