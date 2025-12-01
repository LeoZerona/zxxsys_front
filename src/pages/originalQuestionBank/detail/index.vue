<template>
  <div class="question-detail">
    <!-- 面包屑导航和返回按钮 -->
    <div class="page-header">
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ name: 'originalQuestionBank' }">原题库</el-breadcrumb-item>
        <el-breadcrumb-item>{{ bankName || '题库内容' }}</el-breadcrumb-item>
      </el-breadcrumb>
      <el-button :icon="ArrowLeft" @click="handleBack">返回</el-button>
    </div>

    <!-- 题目类型快速筛选 -->
    <div class="type-filter-bar">
      <div class="type-label">题目类型：</div>
      <div class="type-buttons">
        <el-button
          v-for="type in questionTypes"
          :key="type.value"
          :type="selectedType === type.value ? 'primary' : 'default'"
          size="small"
          @click="handleTypeFilter(type.value)"
        >
          {{ type.label }}
        </el-button>
      </div>
    </div>

    <!-- 工具栏 -->
    <TableToolBar
      ref="tableToolBarRef"
      placeholder="搜索题目内容"
      :columns="tableToolBarColumns"
      v-model:model-keyword="searchKeyword"
      v-model:model-adv-search="advSearchParams"
      v-model:model-checked-columns="checkedCols"
      @add="onAdd"
      @edit="onEdit"
      @del="onDel"
      @import="onImport"
      @export="onExport"
      @search="onSearch"
      @adv-search="onAdvSearch"
      @column-change="onColumnChange"
      @reset="handleReset"
    />

    <!-- 表格 -->
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
          <span v-if="!col.actionButtons">
            {{
              col.formatter ? col.formatter(row[col.prop], row) : row[col.prop]
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
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="sizes, prev, pager, next, jumper, total"
        small
        background
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>

    <!-- 题目详情对话框 -->
    <QuestionDetailDialog
      v-model="showDetailDialog"
      :question="currentQuestion"
      @close="handleDetailClose"
    />

    <!-- 题目编辑对话框 -->
    <QuestionEditDialog
      v-model="showEditDialog"
      :question="currentQuestion"
      @close="handleEditClose"
      @save="handleEditSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import TableToolBar from "@/components/tableToolBar/index.vue";
import QuestionDetailDialog from "./components/QuestionDetailDialog.vue";
import QuestionEditDialog from "./components/QuestionEditDialog.vue";

// TableToolBar 列配置类型
interface IColumn {
  label: string;
  prop: string;
  searchType?: "input" | "select" | "date" | "dateRange";
  options?: { label: string; value: string | number }[];
}

/* ===================== 类型定义 ===================== */
interface QuestionItem {
  questionId: number | string;
  subject: string; // 科目
  content: string;
  questionType: "single" | "multiple" | "fill" | "shortAnswer" | "judge" | "essay";
  difficulty: "easy" | "medium" | "hard";
  score: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  // 详细信息
  options?: string[]; // 选择题选项
  correctAnswer?: string; // 正确答案
  analysis?: string; // 题目解析
  knowledgePoint?: string;
  tags?: string[];
  usageCount?: number;
  correctRate?: number;
  status?: "active" | "inactive";
}

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
  formatter?: (val: any, row: QuestionItem) => string;
  actionButtons?: ActionButton[];
  searchType?: "input" | "select" | "date" | "dateRange";
  options?: { label: string; value: string | number }[];
}

/* ===================== 路由和参数 ===================== */
const router = useRouter();
const route = useRoute();
const bankId = computed(() => route.params.id as string || route.query.id as string);
const bankName = ref<string>("");

/* ===================== 工具函数 ===================== */
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

/* ===================== 业务方法 ===================== */
const showDetailDialog = ref(false);
const showEditDialog = ref(false);
const currentQuestion = ref<QuestionItem | null>(null);

function handleView(row: QuestionItem) {
  currentQuestion.value = row;
  showDetailDialog.value = true;
}

function handleEdit(row: QuestionItem) {
  currentQuestion.value = { ...row };
  showEditDialog.value = true;
}

function handleTypeFilter(type: string) {
  selectedType.value = type;
  if (type) {
    // 跳转到题目类型专门页面
    router.push({
      name: "questionTypeDetail",
      params: {
        bankId: bankId.value,
        type: type,
      },
    });
  } else {
    // 如果选择"全部"，保持在当前页面，但清除类型筛选
    // 这里可以添加清除筛选的逻辑
  }
}

function handleDel(row: QuestionItem) {
  ElMessage.warning(`删除题目 ID：${row.questionId}（这里调接口）`);
}

function handleBack() {
  // 返回原题库页面
  router.push({ name: "originalQuestionBank" });
}

function handleDetailClose() {
  showDetailDialog.value = false;
  currentQuestion.value = null;
}

function handleEditClose() {
  showEditDialog.value = false;
  currentQuestion.value = null;
}

function handleEditSave() {
  // 保存编辑后的题目
  ElMessage.success("保存成功");
  handleEditClose();
  fetchData(); // 刷新列表
}

/* ===================== 列配置 ===================== */
const columns = ref<Column[]>([
  {
    prop: "questionId",
    label: "题目编号",
    width: 100,
  },
  {
    prop: "subject",
    label: "科目",
    width: 120,
    searchType: "select",
    options: [
      { label: "数学", value: "math" },
      { label: "语文", value: "chinese" },
      { label: "英语", value: "english" },
      { label: "物理", value: "physics" },
      { label: "化学", value: "chemistry" },
      { label: "生物", value: "biology" },
      { label: "历史", value: "history" },
      { label: "地理", value: "geography" },
      { label: "政治", value: "politics" },
    ],
    formatter: (val) => formatSubject(val),
  },
  {
    prop: "content",
    label: "题目内容",
    minWidth: 300,
    align: "left",
    searchType: "input",
    formatter: (val) => {
      // 限制显示长度，超出部分用省略号
      if (typeof val === "string" && val.length > 100) {
        return val.substring(0, 100) + "...";
      }
      return val;
    },
  },
  {
    prop: "questionType",
    label: "题目类型",
    width: 120,
    searchType: "select",
    options: [
      { label: "单选题", value: "single" },
      { label: "多选题", value: "multiple" },
      { label: "填空题", value: "fill" },
      { label: "简答题", value: "shortAnswer" },
      { label: "判断题", value: "judge" },
      { label: "论述题", value: "essay" },
    ],
    formatter: (val) => formatQuestionType(val),
  },
  {
    prop: "difficulty",
    label: "难度等级",
    width: 100,
    searchType: "select",
    options: [
      { label: "简单", value: "easy" },
      { label: "中等", value: "medium" },
      { label: "困难", value: "hard" },
    ],
    formatter: (val) => formatDifficulty(val),
  },
  {
    prop: "score",
    label: "分值",
    width: 80,
    searchType: "input",
  },
  {
    prop: "createdAt",
    label: "创建时间",
    width: 180,
    formatter: (val) => formatDate(val),
    searchType: "dateRange",
  },
  {
    prop: "updatedAt",
    label: "更新时间",
    width: 180,
    formatter: (val) => formatDate(val),
    searchType: "dateRange",
  },
  {
    prop: "action",
    label: "操作",
    minWidth: 180,
    fixed: "right",
    actionButtons: [
      { text: "查看详情", type: "primary", click: handleView },
      { text: "编辑", type: "primary", click: handleEdit },
      { text: "删除", type: "danger", click: handleDel },
    ],
  },
]);

// 题目类型选项
const questionTypes = [
  { label: "全部", value: "" },
  { label: "单选题", value: "single" },
  { label: "多选题", value: "multiple" },
  { label: "填空题", value: "fill" },
  { label: "简答题", value: "shortAnswer" },
  { label: "判断题", value: "judge" },
  { label: "论述题", value: "essay" },
];

const selectedType = ref<string>("");

// 将表格列配置转换为 TableToolBar 需要的格式（排除操作列）
const tableToolBarColumns = computed<IColumn[]>(() => {
  return columns.value
    .filter((col) => !col.actionButtons)
    .map((col) => ({
      label: col.label,
      prop: col.prop,
      searchType: col.searchType || "input",
      options: col.options,
    }));
});

// 列显隐状态（排除操作列）
const checkedCols = ref<string[]>(
  columns.value
    .filter((col) => !col.actionButtons)
    .map((col) => col.prop)
);

// 监听 columns 变化，更新 checkedCols
watch(
  () => columns.value,
  () => {
    const dataColumns = columns.value
      .filter((col) => !col.actionButtons)
      .map((col) => col.prop);
    if (
      checkedCols.value.length === 0 ||
      JSON.stringify([...checkedCols.value].sort()) !==
        JSON.stringify([...dataColumns].sort())
    ) {
      checkedCols.value = dataColumns;
    }
  },
  { immediate: true }
);

// 根据 checkedCols 过滤显示的列（操作列始终显示）
const visibleColumns = computed(() => {
  return columns.value.filter((col) => {
    if (col.actionButtons) return true;
    return checkedCols.value.includes(col.prop);
  });
});

/* ===================== 状态 ===================== */
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const tableData = ref<QuestionItem[]>([]);
const searchKeyword = ref("");
const advSearchParams = ref<Record<string, any>>({});
const tableToolBarRef = ref<InstanceType<typeof TableToolBar>>();

/* ===================== 事件处理 ===================== */
function onAdd() {
  ElMessage.info("添加题目功能");
}

function onEdit() {
  ElMessage.info("批量编辑功能");
}

function onDel() {
  ElMessage.info("批量删除功能");
}

function onImport(file: File) {
  ElMessage.success(`导入文件: ${file.name}`);
}

function onExport() {
  ElMessage.info("导出功能");
}

function onSearch(kw: string) {
  searchKeyword.value = kw;
  page.value = 1;
  fetchData();
}

function onAdvSearch(payload: Record<string, any>) {
  advSearchParams.value = { ...payload };
  page.value = 1;
  fetchData();
}

function onColumnChange(cols: string[]) {
  checkedCols.value = [...cols];
}

function handleReset() {
  searchKeyword.value = "";
  advSearchParams.value = {};
  page.value = 1;
  fetchData();
}

/* ===================== 数据获取 ===================== */
async function fetchData() {
  if (!bankId.value) {
    ElMessage.error("题库ID不存在");
    return;
  }

  loading.value = true;
  try {
    const res = await mockApi({
      bankId: bankId.value,
      page: page.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      ...advSearchParams.value,
    });
    tableData.value = res.list;
    total.value = res.total;
  } catch {
    ElMessage.error("数据加载失败");
  } finally {
    loading.value = false;
  }
}

/* ===================== Mock API ===================== */
function mockApi(p: {
  bankId: string;
  page: number;
  pageSize: number;
  keyword?: string;
  subject?: string;
  questionType?: string;
  difficulty?: string;
  score?: string;
  createdAt?: string[];
  updatedAt?: string[];
}) {
  return new Promise<{ list: QuestionItem[]; total: number }>((resolve) => {
    setTimeout(() => {
      // 生成模拟数据
      const questionTypes: QuestionItem["questionType"][] = [
        "single",
        "multiple",
        "fill",
        "shortAnswer",
        "judge",
        "essay",
      ];
      const difficulties: QuestionItem["difficulty"][] = ["easy", "medium", "hard"];

      const subjects = ["math", "chinese", "english", "physics", "chemistry", "biology", "history", "geography", "politics"];
      
      let all: QuestionItem[] = Array.from({ length: 156 }, (_, idx) => {
        const type = questionTypes[idx % questionTypes.length];
        const isChoice = type === "single" || type === "multiple";
        return {
          questionId: idx + 1,
          subject: subjects[idx % subjects.length],
          content: `这是第 ${idx + 1} 道题目的内容。题目可能包含多个选项，需要仔细分析。${idx % 3 === 0 ? "这是一道比较复杂的题目，需要综合运用多个知识点来解答。" : ""}`,
          questionType: type,
          difficulty: difficulties[idx % difficulties.length],
          score: [5, 10, 15, 20][idx % 4],
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * idx),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (idx - 1)),
          // 详细信息
          options: isChoice ? ["选项A", "选项B", "选项C", "选项D"] : undefined,
          correctAnswer: isChoice ? (type === "single" ? "A" : "A,B") : "这是正确答案",
          analysis: `这是第 ${idx + 1} 道题目的解析内容，帮助理解题目的解题思路。`,
          knowledgePoint: `知识点${Math.floor(idx / 10) + 1}`,
          tags: [`标签${idx % 5 + 1}`, `标签${(idx + 1) % 5 + 1}`],
          usageCount: Math.floor(Math.random() * 100),
          correctRate: Math.floor(Math.random() * 100),
          status: idx % 10 === 0 ? "inactive" : "active",
        };
      });

      // 普通关键词搜索（搜索题目内容）
      if (p.keyword) {
        const keyword = p.keyword.toLowerCase();
        all = all.filter((v) => v.content.toLowerCase().includes(keyword));
      }

      // 高级搜索：科目
      if (p.subject) {
        all = all.filter((v) => v.subject === p.subject);
      }

      // 高级搜索：题目类型
      if (p.questionType) {
        all = all.filter((v) => v.questionType === p.questionType);
      }

      // 高级搜索：难度等级
      if (p.difficulty) {
        all = all.filter((v) => v.difficulty === p.difficulty);
      }

      // 高级搜索：分值
      if (p.score) {
        all = all.filter((v) => v.score.toString().includes(p.score!));
      }

      // 高级搜索：创建时间范围
      if (p.createdAt && Array.isArray(p.createdAt) && p.createdAt.length === 2) {
        const [start, end] = p.createdAt;
        if (start && end) {
          const startDate = new Date(start);
          const endDate = new Date(end);
          endDate.setHours(23, 59, 59, 999);
          all = all.filter((v) => {
            const date = new Date(v.createdAt);
            return date >= startDate && date <= endDate;
          });
        }
      }

      // 高级搜索：更新时间范围
      if (p.updatedAt && Array.isArray(p.updatedAt) && p.updatedAt.length === 2) {
        const [start, end] = p.updatedAt;
        if (start && end) {
          const startDate = new Date(start);
          const endDate = new Date(end);
          endDate.setHours(23, 59, 59, 999);
          all = all.filter((v) => {
            const date = new Date(v.updatedAt);
            return date >= startDate && date <= endDate;
          });
        }
      }

      const offset = (p.page - 1) * p.pageSize;
      resolve({
        list: all.slice(offset, offset + p.pageSize),
        total: all.length,
      });
    }, 300);
  });
}

/* ===================== 生命周期 ===================== */
onMounted(() => {
  // 获取题库名称（可以从路由参数或API获取）
  bankName.value = `题库 ${bankId.value}`;
  // 加载数据
  fetchData();
});
</script>

<style lang="scss" scoped>
.question-detail {
  height: 100%;
  background: #fff;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e4e7ed;

  .breadcrumb {
    font-size: 14px;
    color: #606266;
  }
}

.type-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 16px;

  .type-label {
    font-size: 14px;
    font-weight: 500;
    color: #606266;
    white-space: nowrap;
  }

  .type-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.data-table {
  flex: 1;
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
}
</style>

