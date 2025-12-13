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
        size="small"
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
import { getQuestionList, type Question } from "@/api/question";

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
  subjectId?: number; // 科目ID
  content: string;
  questionType: "single" | "multiple" | "fill" | "shortAnswer" | "judge" | "essay" | "calc"; // calc=计算分析题
  type?: string; // 题型代码：1=单选, 2=多选, 3=判断, 4=填空, 8=计算分析
  difficulty?: "easy" | "medium" | "hard";
  score?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // 详细信息
  options?: Array<{ label: string; content: string }> | string[]; // 选择题选项
  correctAnswer?: string | string[]; // 正确答案
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
// 从路由参数获取题型，如果没有则显示全部
const routeType = computed(() => route.query.type as string || '');

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
  // 更新筛选条件并重新获取数据
  page.value = 1;
  fetchData();
}

// 将后端题型代码转换为前端格式
function convertTypeCode(type: string): string {
  const typeMap: Record<string, string> = {
    "1": "single",
    "2": "multiple",
    "3": "judge",
    "4": "fill",
    "8": "calc",
  };
  return typeMap[type] || type;
}

// 将后端题目数据转换为前端格式
function convertQuestion(question: Question): QuestionItem {
  const typeCode = question.type;
  const convertedType = convertTypeCode(typeCode);
  
  // 处理答案
  let correctAnswer: string | string[] = "";
  if (question.answer) {
    if (question.answer.correct_answer) {
      correctAnswer = question.answer.correct_answer;
    } else if (question.answer.answer_content) {
      correctAnswer = question.answer.answer_content;
    } else if (question.answer.option_true) {
      correctAnswer = question.answer.option_true;
    }
  }

  // 处理选项
  let options: Array<{ label: string; content: string }> | string[] = [];
  if (question.options && question.options.length > 0) {
    options = question.options.map(opt => ({
      label: opt.label,
      content: opt.content,
    }));
  }

  return {
    questionId: question.question_id,
    subject: question.subject_name || "",
    subjectId: question.subject_id,
    content: question.content,
    questionType: convertedType as any,
    type: typeCode,
    correctAnswer: correctAnswer,
    analysis: question.analysis,
    options: options,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
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

/* ===================== 列配置（根据题目类型动态调整） ===================== */
const columns = computed<Column[]>(() => {
  const baseColumns: Column[] = [
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
        // 科目选项可以从API获取，这里先使用示例数据
        { label: "会计学", value: "会计学" },
        { label: "财务管理", value: "财务管理" },
      ],
      formatter: (val) => formatSubject(val),
    },
    {
      prop: "content",
      label: selectedType.value === "fill" ? "题目内容（含填空）" : "题目内容",
      minWidth: 300,
      align: "left",
      searchType: "input",
      formatter: (val) => {
        // 填空题可能需要显示更长的内容
        const maxLength = selectedType.value === "fill" ? 150 : 100;
        if (typeof val === "string" && val.length > maxLength) {
          return val.substring(0, maxLength) + "...";
        }
        return val;
      },
    },
  ];

  // 如果选择了特定类型，不显示题目类型列；如果选择"全部"，显示题目类型列
  if (!selectedType.value) {
    baseColumns.push({
      prop: "type",
      label: "题目类型",
      width: 120,
      searchType: "select",
      options: [
        { label: "单选题", value: "1" },
        { label: "多选题", value: "2" },
        { label: "判断题", value: "3" },
        { label: "填空题", value: "4" },
        { label: "计算分析题", value: "8" },
      ],
      formatter: (val) => formatQuestionType(val),
    });
  }

  // 根据题目类型添加特定字段
  if (selectedType.value === "1" || selectedType.value === "2") {
    // 选择题：显示选项和正确答案
    baseColumns.push({
      prop: "options",
      label: "选项",
      minWidth: 400,
      align: "left",
      formatter: (_val, row) => {
        if (row.options && row.options.length > 0) {
          // 选项横向一排显示，用分隔符连接
          const optionsList = Array.isArray(row.options) ? row.options : [];
          return optionsList
            .map((opt: any) => {
              if (typeof opt === 'string') {
                return opt;
              }
              return `${opt.label}. ${opt.content}`;
            })
            .join(" | ");
        }
        return "-";
      },
    });
    baseColumns.push({
      prop: "correctAnswer",
      label: "正确答案",
      width: 180,
      formatter: (val, row) => {
        if (!val) return "-";
        // 多选题：显示多个答案，用顿号分隔
        if (row.questionType === "multiple" || row.type === "2") {
          // 如果是数组，直接处理
          if (Array.isArray(val)) {
            return val.join("、");
          }
          // 如果是字符串，支持多种分隔符：逗号、中文逗号、顿号、空格
          const answers = String(val).split(/[,，、\s]+/).map(v => v.trim()).filter(v => v);
          if (answers.length > 0) {
            return answers.join("、");
          }
          return String(val);
        }
        // 单选题：显示单个选项字母
        return Array.isArray(val) ? val.join("、") : String(val);
      },
    });
  } else if (selectedType.value === "4") {
    // 填空题：显示填空答案（题目内容已在baseColumns中）
    baseColumns.push({
      prop: "correctAnswer",
      label: "填空答案",
      minWidth: 250,
      align: "left",
      formatter: (val) => {
        if (typeof val === "string" && val.length > 80) {
          return val.substring(0, 80) + "...";
        }
        return val || "-";
      },
    });
  } else if (selectedType.value === "3") {
    // 判断题：显示正确答案（对/错），明确显示
    baseColumns.push({
      prop: "correctAnswer",
      label: "正确答案",
      width: 120,
      formatter: (val) => {
        if (!val) return "-";
        // 统一格式化为"对"或"错"
        const answerStr = String(val).toLowerCase().trim();
        if (answerStr === "true" || answerStr === "对" || answerStr === "正确" || answerStr === "1" || answerStr === "yes") {
          return "对";
        }
        if (answerStr === "false" || answerStr === "错" || answerStr === "错误" || answerStr === "0" || answerStr === "no") {
          return "错";
        }
        return val;
      },
    });
  } else if (selectedType.value === "8") {
    // 计算分析题：显示子题数量
    baseColumns.push({
      prop: "correctAnswer",
      label: "子题数量",
      width: 120,
      formatter: (val, row) => {
        // 如果有子题，显示子题数量
        if (row.options && Array.isArray(row.options) && row.options.length > 0) {
          return `${row.options.length} 道子题`;
        }
        return "-";
      },
    });
  } else if (selectedType.value === "") {
    // 简答题/论述题：显示参考答案
    baseColumns.push({
      prop: "correctAnswer",
      label: "参考答案",
      minWidth: 300,
      align: "left",
      formatter: (val) => {
        if (typeof val === "string" && val.length > 100) {
          return val.substring(0, 100) + "...";
        }
        return val || "-";
      },
    });
  } else if (!selectedType.value) {
    // 如果选择"全部"，根据每行的题目类型动态显示答案列
    // 这里简化处理，显示一个通用的答案列
    baseColumns.push({
      prop: "correctAnswer",
      label: "正确答案/参考答案",
      minWidth: 200,
      align: "left",
      formatter: (val, row) => {
        if (!val) return "-";
        // 根据题目类型格式化答案
        if (row.questionType === "judge" || row.type === "3") {
          const answerStr = String(val).toLowerCase().trim();
          if (answerStr === "true" || answerStr === "对" || answerStr === "正确" || answerStr === "1" || answerStr === "yes") {
            return "对";
          }
          if (answerStr === "false" || answerStr === "错" || answerStr === "错误" || answerStr === "0" || answerStr === "no") {
            return "错";
          }
        } else if (row.questionType === "multiple" || row.type === "2") {
          const answers = val.split(/[,，、\s]+/).map(v => v.trim()).filter(v => v);
          if (answers.length > 0) {
            return answers.join("、");
          }
        }
        if (typeof val === "string" && val.length > 80) {
          return val.substring(0, 80) + "...";
        }
        return val;
      },
    });
  }

  baseColumns.push(
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
    }
  );

  return baseColumns;
});

// 题目类型选项（使用后端题型代码）
const questionTypes = [
  { label: "全部", value: "" },
  { label: "单选题", value: "1" },
  { label: "多选题", value: "2" },
  { label: "判断题", value: "3" },
  { label: "填空题", value: "4" },
  { label: "计算分析题", value: "8" },
];

const selectedType = ref<string>(routeType.value || "");

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
  selectedType.value = ""; // 重置题目类型筛选
  page.value = 1;
  fetchData();
}

/* ===================== 数据获取 ===================== */
async function fetchData() {
  // 如果没有选择题型，不能调用接口（type是必填参数）
  if (!selectedType.value) {
    // 显示全部时，可以显示提示或加载所有题型的数据
    // 这里我们默认加载单选题作为示例，或者可以提示用户选择题型
    if (tableData.value.length === 0) {
      ElMessage.info("请选择题目类型");
    }
    return;
  }

  loading.value = true;
  try {
    // 构建查询参数
    const params: any = {
      type: selectedType.value, // 必填参数
      page: page.value,
      page_size: pageSize.value,
      include_answer: true,
      include_analysis: true,
    };

    // 添加高级搜索参数
    if (searchKeyword.value) {
      // 如果关键词搜索，可以通过科目名称或其他字段搜索
      // 这里简化处理，实际可以根据后端支持的搜索字段调整
    }

    if (advSearchParams.value.subject) {
      params.subject_name = advSearchParams.value.subject;
    }

    if (advSearchParams.value.subject_id) {
      params.subject_id = advSearchParams.value.subject_id;
    }

    if (advSearchParams.value.chapter_id) {
      params.chapter_id = advSearchParams.value.chapter_id;
    }

    // 调用API获取题目列表
    const response = await getQuestionList(params);

    if (response.success && response.data) {
      // 转换数据格式
      tableData.value = response.data.list.map(convertQuestion);
      total.value = response.data.pagination.total;
    } else {
      tableData.value = [];
      total.value = 0;
    }
  } catch (error: any) {
    console.error('获取题目列表失败:', error);
    ElMessage.error(error.message || "数据加载失败");
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}


/* ===================== 生命周期 ===================== */
onMounted(() => {
  // 获取题库名称（可以从路由参数或API获取）
  bankName.value = `题库 ${bankId.value}`;
  
  // 如果从路由参数获取到了题型，自动加载数据
  if (selectedType.value) {
    fetchData();
  } else {
    // 如果没有题型，提示用户选择题型
    ElMessage.info("请选择题型查看题目");
  }
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

