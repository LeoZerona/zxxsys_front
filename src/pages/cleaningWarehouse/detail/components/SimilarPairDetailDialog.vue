<template>
  <el-dialog
    v-model="dialogVisible"
    title="相似重复对详情"
    width="1200px"
    :before-close="handleClose"
  >
    <div v-if="pairData" v-loading="loading" class="pair-detail-content">
      <!-- 基准题目信息 -->
      <el-descriptions :column="4" border class="detail-section">
        <el-descriptions-item label="基准题目ID">{{
          pairData.question_id
        }}</el-descriptions-item>
        <el-descriptions-item label="重复数量">
          {{ pairData.duplicate_count || pairData.duplicates?.length || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="题型">{{
          pairData.group?.type_name
        }}</el-descriptions-item>
        <el-descriptions-item label="科目">{{
          pairData.group?.subject_name || "-"
        }}</el-descriptions-item>
        <el-descriptions-item label="最大相似度">
          <el-tag :type="getSimilarityTagType(pairData.max_similarity || 0)">
            {{ ((pairData.max_similarity || 0) * 100).toFixed(1) }}%
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最小相似度">
          <el-tag :type="getSimilarityTagType(pairData.min_similarity || 0)">
            {{ ((pairData.min_similarity || 0) * 100).toFixed(1) }}%
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="渠道代码">{{
          pairData.group?.channel_code || "-"
        }}</el-descriptions-item>
      </el-descriptions>

      <!-- 基准题目 -->
      <div class="base-question-section">
        <div class="question-card">
          <div class="card-header">
            <h4>基准题目 (ID: {{ pairData.question_id }})</h4>
          </div>
          <div v-if="baseQuestion" class="card-body">
            <QuestionDisplay :question="baseQuestion" />
          </div>
          <div v-else class="card-body empty">题目详情加载中...</div>
        </div>
      </div>

      <!-- 重复题目列表 -->
      <div class="duplicates-section">
        <h3 class="section-title">
          重复题目列表 ({{ pairData.duplicates?.length || 0 }})
        </h3>
        <div
          v-for="(duplicate, index) in pairData.duplicates"
          :key="(duplicate.pair_id as number) || index"
          class="duplicate-item"
        >
          <div class="duplicate-header">
            <div class="duplicate-info">
              <span class="duplicate-label"
                >重复题 {{ (index as number) + 1 }}</span
              >
              <span class="duplicate-id"
                >题目ID: {{ duplicate.question_id }}</span
              >
              <span class="duplicate-pair-id"
                >对ID: {{ duplicate.pair_id }}</span
              >
              <el-tag
                :type="getSimilarityTagType(duplicate.similarity || 0)"
                class="similarity-tag"
              >
                相似度: {{ ((duplicate.similarity || 0) * 100).toFixed(1) }}%
              </el-tag>
            </div>
          </div>
          <div class="question-card">
            <div
              v-if="duplicateQuestions[duplicate.question_id as number]"
              class="card-body"
            >
              <QuestionDisplay
                :question="duplicateQuestions[duplicate.question_id as number]!"
              />
            </div>
            <div v-else class="card-body empty">题目详情加载中...</div>
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
import { ElMessage } from "element-plus";
import { getQuestionDetail } from "@/api/question";
import type { QuestionDetail } from "@/api/dedup";
import QuestionDisplay from "./QuestionDisplay.vue";
import { getSimilarityTagType } from "@/utils/formatters";

const props = defineProps<{
  modelValue: boolean;
  pairData?: any; // 新的数据结构
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
const baseQuestion = ref<QuestionDetail | null>(null);
const duplicateQuestions = ref<Record<number, QuestionDetail>>({});

// 获取题目详情
async function fetchQuestionDetail(
  questionId: number
): Promise<QuestionDetail | null> {
  try {
    // 显式传递参数确保包含答案和解析
    const response = await getQuestionDetail(questionId, {
      include_answer: true,
      include_analysis: true,
    });
    if (response.success && response.data) {
      // 转换数据格式：Question -> QuestionDetail
      const question = response.data as any;

      // 处理答案字段：优先使用 correct_answer，否则从 answer 对象中提取
      let correctAnswer: string | undefined;
      if (question.correct_answer) {
        correctAnswer = Array.isArray(question.correct_answer)
          ? question.correct_answer.join("、")
          : String(question.correct_answer);
      } else if (question.answer) {
        if (question.answer.correct_answer) {
          correctAnswer = Array.isArray(question.answer.correct_answer)
            ? question.answer.correct_answer.join("、")
            : String(question.answer.correct_answer);
        } else if (question.answer.option_true) {
          correctAnswer = String(question.answer.option_true);
        } else if (question.answer.answer_content) {
          correctAnswer = String(question.answer.answer_content);
        }
      }

      const questionDetail: QuestionDetail = {
        question_id: question.question_id,
        type: question.type,
        type_name: question.type_name,
        subject_id: question.subject_id,
        subject_name: question.subject_name,
        chapter_id: question.chapter_id,
        content: question.content,
        analysis: question.analysis,
        options: question.options?.map((opt: any) => ({
          label: opt.label || opt.option_label || "",
          content: opt.content || opt.option_content || "",
          seq: opt.seq || opt.sequence || 0,
        })),
        correct_answer: correctAnswer,
        create_time: question.create_time,
      };
      return questionDetail;
    }
    return null;
  } catch (error: any) {
    console.error(`获取题目 ${questionId} 详情失败:`, error);
    return null;
  }
}

// 加载所有题目详情
async function loadQuestionDetails() {
  if (!props.pairData) return;

  loading.value = true;
  try {
    // 加载基准题目
    if (props.pairData.question_id) {
      const base = await fetchQuestionDetail(props.pairData.question_id);
      if (base) {
        baseQuestion.value = base;
      }
    }

    // 加载所有重复题目
    if (props.pairData.duplicates && Array.isArray(props.pairData.duplicates)) {
      const questionIds: number[] = props.pairData.duplicates.map((dup: any) =>
        Number(dup.question_id)
      );
      const uniqueIds = Array.from(new Set(questionIds));

      // 并行加载所有题目
      const promises = uniqueIds.map((id: number) =>
        fetchQuestionDetail(id).then((question) => {
          if (question) {
            duplicateQuestions.value[id] = question;
          }
        })
      );

      await Promise.all(promises);
    }
  } catch (error: any) {
    console.error("加载题目详情失败:", error);
    ElMessage.error("加载题目详情失败");
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  emit("close");
  baseQuestion.value = null;
  duplicateQuestions.value = {};
}

// 监听对话框打开和pairData变化，加载数据
watch(
  () => props.modelValue,
  (val) => {
    if (val && props.pairData) {
      loadQuestionDetails();
    } else {
      baseQuestion.value = null;
      duplicateQuestions.value = {};
    }
  },
  { immediate: true }
);

// 单独监听pairData变化，当对话框已打开时重新加载数据
watch(
  () => props.pairData,
  (newData) => {
    if (props.modelValue && newData) {
      loadQuestionDetails();
    }
  }
);
</script>

<style lang="scss" scoped>
.pair-detail-content {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.base-question-section {
  margin-bottom: 32px;

  .question-card {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;

    .card-header {
      background: #f5f7fa;
      padding: 12px 16px;
      border-bottom: 1px solid #ebeef5;

      h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        color: #303133;
      }
    }

    .card-body {
      padding: 16px;

      &.empty {
        text-align: center;
        color: #909399;
        padding: 40px;
      }
    }
  }
}

.duplicates-section {
  .section-title {
    font-size: 18px;
    font-weight: 500;
    color: #303133;
    margin: 0 0 16px 0;
    padding-bottom: 12px;
    border-bottom: 2px solid #ebeef5;
  }

  .duplicate-item {
    margin-bottom: 24px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    overflow: hidden;
    background: #fff;

    .duplicate-header {
      background: #f8f9fa;
      padding: 12px 16px;
      border-bottom: 1px solid #ebeef5;

      .duplicate-info {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;

        .duplicate-label {
          font-weight: 500;
          color: #303133;
          font-size: 14px;
        }

        .duplicate-id,
        .duplicate-pair-id {
          color: #606266;
          font-size: 14px;
        }

        .similarity-tag {
          margin-left: auto;
        }
      }
    }

    .question-card {
      .card-body {
        padding: 16px;

        &.empty {
          text-align: center;
          color: #909399;
          padding: 40px;
        }
      }
    }
  }
}
</style>
