<template>
  <div class="table-view">
    <el-table
      v-loading="loading"
      :data="tableData"
      stripe
      fit
      empty-text="暂无数据"
      class="data-table"
    >
      <el-table-column
        v-for="col in visibleColumns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :align="col.align || 'center'"
        :fixed="col.fixed"
      >
        <template #default="{ row }">
          <span
            v-if="!col.actionButtons"
            :class="{
              'multi-line-answer':
                col.prop === 'correctAnswer' &&
                (row.type === '4' || row.type === '8'),
            }"
          >
            {{
              col.formatter
                ? col.formatter(row[col.prop], row)
                : row[col.prop]
            }}
          </span>
          <div v-else class="action-group">
            <el-button
              v-for="btn in col.actionButtons"
              :key="btn.text"
              link
              :type="btn.type || 'primary'"
              @click="btn.click(row)"
            >
              {{ btn.text }}
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-bar">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="sizes, prev, pager, next, jumper, total"
        size="small"
        background
        @size-change="handlePageSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface ActionButton {
  text: string;
  type?: "primary" | "success" | "warning" | "danger";
  click: (row: QuestionItem) => void;
}

interface Column {
  prop: string;
  label: string;
  width?: number | string;
  minWidth?: number | string;
  align?: "left" | "center" | "right";
  fixed?: "left" | "right";
  formatter?: (val: unknown, row: QuestionItem) => string;
  actionButtons?: ActionButton[];
}

interface QuestionItem {
  questionId: number | string;
  subject: string;
  subjectId?: number;
  content: string;
  questionType:
    | "single"
    | "multiple"
    | "fill"
    | "shortAnswer"
    | "judge"
    | "essay"
    | "calc";
  type?: string;
  difficulty?: "easy" | "medium" | "hard";
  score?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  options?: Array<{ label: string; content: string }> | string[];
  correctAnswer?: string | string[];
  analysis?: string;
  subQuestions?: unknown[];
  answerType2?: string;
}

interface Props {
  loading: boolean;
  tableData: QuestionItem[];
  columns: Column[];
  checkedCols: string[];
  page: number;
  pageSize: number;
  total: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "page-change": [page: number];
  "page-size-change": [size: number];
}>();

// 根据 checkedCols 过滤显示的列（操作列始终显示）
const visibleColumns = computed(() => {
  return props.columns.filter((col) => {
    if (col.actionButtons) return true;
    return props.checkedCols.includes(col.prop);
  });
});

function handlePageChange(page: number) {
  emit("page-change", page);
}

function handlePageSizeChange(size: number) {
  emit("page-size-change", size);
}
</script>

<style lang="scss" scoped>
.table-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.data-table {
  flex: 1;
  min-height: 400px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  overflow: hidden;
}

.action-group {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
  flex-shrink: 0;
}

/* 多行答案样式：支持换行显示（填空题和计算分析题） */
.multi-line-answer {
  white-space: pre-line;
  word-break: break-word;
  line-height: 1.6;
  display: block;
}
</style>

