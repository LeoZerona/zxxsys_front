<template>
  <el-dialog
    v-model="dialogVisible"
    title="相似重复对详情"
    width="1200px"
    :before-close="handleClose"
  >
    <div v-if="pairDetail" v-loading="loading" class="pair-detail-content">
      <!-- 对信息 -->
      <el-descriptions :column="4" border class="detail-section">
        <el-descriptions-item label="对ID">{{ pairDetail.id }}</el-descriptions-item>
        <el-descriptions-item label="相似度">
          <el-tag :type="getSimilarityTagType(pairDetail.similarity)">
            {{ (pairDetail.similarity * 100).toFixed(1) }}%
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="题型">{{ pairDetail.group.type_name }}</el-descriptions-item>
        <el-descriptions-item label="科目">{{ pairDetail.group.subject_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="题目ID1">{{ pairDetail.question_id_1 }}</el-descriptions-item>
        <el-descriptions-item label="题目ID2">{{ pairDetail.question_id_2 }}</el-descriptions-item>
        <el-descriptions-item label="渠道代码">{{ pairDetail.group.channel_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="检测时间">{{ formatDate(pairDetail.detected_at) }}</el-descriptions-item>
      </el-descriptions>

      <!-- 题目对比 -->
      <div class="questions-comparison">
        <!-- 题目1 -->
        <div class="question-card">
          <div class="card-header">
            <h4>题目 1 (ID: {{ pairDetail.question_id_1 }})</h4>
          </div>
          <div v-if="pairDetail.question_1" class="card-body">
            <QuestionDisplay :question="pairDetail.question_1" />
          </div>
          <div v-else class="card-body empty">
            题目详情加载中...
          </div>
        </div>

        <!-- 题目2 -->
        <div class="question-card">
          <div class="card-header">
            <h4>题目 2 (ID: {{ pairDetail.question_id_2 }})</h4>
          </div>
          <div v-if="pairDetail.question_2" class="card-body">
            <QuestionDisplay :question="pairDetail.question_2" />
          </div>
          <div v-else class="card-body empty">
            题目详情加载中...
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
import { getSimilarPairDetail, type SimilarDuplicatePair } from "@/api/dedup";
import QuestionDisplay from "./QuestionDisplay.vue";

const props = defineProps<{
  modelValue: boolean;
  pairId?: number;
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
const pairDetail = ref<SimilarDuplicatePair | null>(null);

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

const getSimilarityTagType = (similarity: number) => {
  if (similarity >= 0.9) return "danger";
  if (similarity >= 0.8) return "warning";
  return "info";
};

// 获取对详情
async function fetchPairDetail() {
  if (!props.taskId || !props.pairId) return;
  
  loading.value = true;
  try {
    const response = await getSimilarPairDetail(props.taskId, props.pairId);
    if (response.success && response.data) {
      pairDetail.value = response.data;
    }
  } catch (error: any) {
    console.error("获取相似重复对详情失败:", error);
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  emit("close");
  pairDetail.value = null;
}

// 监听对话框打开，加载数据
watch(
  () => props.modelValue,
  (val) => {
    if (val && props.taskId && props.pairId) {
      fetchPairDetail();
    }
  },
  { immediate: true }
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

.questions-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 24px;

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
</style>

