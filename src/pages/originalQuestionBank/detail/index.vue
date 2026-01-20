<template>
  <div class="question-detail">
    <!-- 面包屑导航和返回按钮 -->
    <div class="page-header">
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ name: 'originalQuestionBank' }"
          >原题库</el-breadcrumb-item
        >
        <el-breadcrumb-item>{{ bankName || "题库内容" }}</el-breadcrumb-item>
      </el-breadcrumb>
      <el-button :icon="ArrowLeft" @click="handleBack">返回</el-button>
    </div>

    <!-- 题目类型快速筛选 -->
    <TypeFilterBar
      v-model="selectedType"
      :question-types="questionTypes"
      @change="handleTypeFilter"
    />

    <!-- 工具栏和视图切换 -->
    <div class="toolbar-section">
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
      <div class="view-toggle">
        <el-button-group>
          <el-button
            :type="mainViewMode === 'table' ? 'primary' : 'default'"
            :icon="Document"
            @click="mainViewMode = 'table'"
          >
            题目列表
          </el-button>
          <el-button
            :type="mainViewMode === 'statistics' ? 'primary' : 'default'"
            :icon="PieChartIcon"
            @click="mainViewMode = 'statistics'"
          >
            数据统计
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 内容区域：题目表格或统计数据 -->
    <div class="content-area">
      <!-- 题目表格 -->
      <QuestionTableView
        v-show="mainViewMode === 'table'"
        :loading="loading"
        :table-data="tableData"
        :columns="columns"
        :checked-cols="checkedCols"
        :page="page"
        :page-size="pageSize"
        :total="total"
        @page-change="(p) => { page = p; fetchData(); }"
        @page-size-change="(s) => { pageSize = s; fetchData(); }"
      />

      <!-- 统计面板 -->
      <QuestionStatisticsView
        v-show="mainViewMode === 'statistics'"
        :loading="loadingStatistics"
        :type-statistics="typeStatistics"
        :subject-statistics="subjectStatistics"
        :total-count="totalCount"
        v-model:view-mode="statViewMode"
        v-model:active-tab="activeStatTab"
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
import {
  ArrowLeft,
  Document,
  PieChart as PieChartIcon,
} from "@element-plus/icons-vue";
import TableToolBar from "@/components/tableToolBar/index.vue";
import QuestionTableView from "./components/QuestionTableView.vue";
import QuestionStatisticsView from "./components/QuestionStatisticsView.vue";
import TypeFilterBar from "./components/TypeFilterBar.vue";
import QuestionDetailDialog from "./components/QuestionDetailDialog.vue";
import QuestionEditDialog from "./components/QuestionEditDialog.vue";
import {
  getQuestionList,
  getQuestionStatistics,
  type Question,
  type StatisticsItem,
  type QuestionListParams,
} from "@/api/question";
import { stripHtmlTags } from "@/utils/common";
import { usePageRefresh } from "@/utils/usePageRefresh";
import { useLoading } from "@/utils/useLoading";
import {
  formatDate,
  formatQuestionType,
  formatDifficulty,
  formatSubject,
} from "@/utils/formatters";

// TableToolBar 列配置类型
interface IColumn {
  label: string;
  prop: string;
  searchType?: "input" | "select" | "date" | "dateRange";
  options?: { label: string; value: string | number }[];
}

/* ===================== 类型定义 ===================== */
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
  subject: string; // 科目
  subjectId?: number; // 科目ID
  content: string;
  questionType:
    | "single"
    | "multiple"
    | "fill"
    | "shortAnswer"
    | "judge"
    | "essay"
    | "calc"; // calc=计算分析题
  type?: string; // 题型代码：1=单选, 2=多选, 3=判断, 4=填空, 8=计算分析
  difficulty?: "easy" | "medium" | "hard";
  score?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  // 详细信息
  options?: Array<{ label: string; content: string }> | string[]; // 选择题选项
  correctAnswer?: string | string[]; // 正确答案（普通题型）
  analysis?: string; // 题目解析
  // 计算分析题特有字段
  subQuestions?: SubQuestionItem[]; // 计算分析题的子题
  answerType2?: string; // 计算分析题类型：1=分录题, 2=填空题
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
const bankId = computed(
  () => (route.params.id as string) || (route.query.id as string)
);
const bankName = ref<string>("");
// 注意：虽然从路由获取了题库ID，但后端暂时不区分，所有题库都返回相同数据

/* ===================== 工具函数 ===================== */
// 格式化工具函数已在顶部导入

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

  // 处理答案（去除HTML标签）
  let correctAnswer: string | string[] = "";
  let subQuestions: SubQuestionItem[] | undefined = undefined;
  let answerType2: string | undefined = undefined;

  if (question.answer) {
    // 计算分析题（type=8）的特殊处理
    if (typeCode === "8" && question.answer.sub_questions) {
      answerType2 = question.answer.type2;
      subQuestions = question.answer.sub_questions.map((subQ) => ({
        calcchild_id: subQ.calcchild_id,
        type: subQ.type,
        content: stripHtmlTags(subQ.content),
        answer: {
          answer_content: subQ.answer.answer_content
            ? stripHtmlTags(subQ.answer.answer_content)
            : undefined,
          option_true: subQ.answer.option_true
            ? stripHtmlTags(subQ.answer.option_true)
            : undefined,
        },
        options: subQ.options
          ? subQ.options.map((opt) => ({
              label: stripHtmlTags(opt.label),
              content: stripHtmlTags(opt.content),
            }))
          : undefined,
        analysis: subQ.analysis ? stripHtmlTags(subQ.analysis) : undefined,
        sort: subQ.sort,
      }));
      // 计算分析题的答案：格式化为（1）答案1（2）答案2...，多个答案分行显示
      const answerParts: string[] = [];
      subQuestions.forEach((subQ, index) => {
        let answerText = "";
        if (subQ.answer.option_true) {
          // 如果是选项答案（可能包含多个选项，用逗号等分隔）
          const options = String(subQ.answer.option_true)
            .split(/[,，、\s]+/)
            .map((v) => v.trim())
            .filter((v) => v);
          answerText = options.join("、"); // 多个选项用顿号连接
        } else if (subQ.answer.answer_content) {
          answerText = subQ.answer.answer_content;
        } else {
          answerText = "无答案";
        }
        // 如果答案过长，截断显示
        if (answerText.length > 30) {
          answerText = answerText.substring(0, 30) + "...";
        }
        answerParts.push(`（${index + 1}）${answerText}`);
      });
      // 使用换行符连接，每个子题答案一行
      correctAnswer = answerParts.join("\n");
    } else {
      // 普通题型的答案处理
      if (question.answer.correct_answer) {
        if (Array.isArray(question.answer.correct_answer)) {
          correctAnswer = question.answer.correct_answer.map((ans) =>
            stripHtmlTags(ans)
          );
        } else {
          correctAnswer = stripHtmlTags(question.answer.correct_answer);
        }
      } else if (question.answer.answer_content) {
        correctAnswer = stripHtmlTags(question.answer.answer_content);
      } else if (question.answer.option_true) {
        correctAnswer = stripHtmlTags(question.answer.option_true);
      }
    }
  }

  // 处理选项（去除HTML标签）
  let options: Array<{ label: string; content: string }> | string[] = [];
  if (question.options && question.options.length > 0) {
    options = question.options.map((opt) => ({
      label: stripHtmlTags(opt.label),
      content: stripHtmlTags(opt.content),
    }));
  }

  return {
    questionId: question.question_id,
    subject: stripHtmlTags(question.subject_name || ""),
    subjectId: question.subject_id,
    content: stripHtmlTags(question.content), // 去除题目内容中的HTML标签
    questionType: convertedType as any,
    type: typeCode,
    correctAnswer: correctAnswer,
    analysis: question.analysis ? stripHtmlTags(question.analysis) : undefined, // 去除解析中的HTML标签
    options: options,
    subQuestions: subQuestions, // 计算分析题的子题
    answerType2: answerType2, // 计算分析题类型
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
      width: 150,
      formatter: (val, row) => {
        // 如果是计算分析题，在编号后显示子题数量
        if (
          row.type === "8" &&
          row.subQuestions &&
          row.subQuestions.length > 0
        ) {
          return `${val} (${row.subQuestions.length}道子题)`;
        }
        return val;
      },
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
      label: selectedType.value === "4" ? "题目内容（含填空）" : "题目内容",
      minWidth: 300,
      align: "left",
      searchType: "input",
      formatter: (val) => {
        // 去除HTML标签
        const cleanContent = stripHtmlTags(val);
        // 填空题可能需要显示更长的内容
        const maxLength = selectedType.value === "4" ? 150 : 100;
        if (cleanContent.length > maxLength) {
          return cleanContent.substring(0, maxLength) + "...";
        }
        return cleanContent;
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
              if (typeof opt === "string") {
                return stripHtmlTags(opt);
              }
              // 对于对象类型的选项，只显示content（因为label已经在标签中显示了）
              return stripHtmlTags(opt.content || "");
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
        // 去除HTML标签
        let cleanAnswer: string | string[] = Array.isArray(val)
          ? val.map((v) => stripHtmlTags(String(v)))
          : stripHtmlTags(String(val));

        // 多选题：显示多个答案，用顿号分隔
        if (row.questionType === "multiple" || row.type === "2") {
          // 如果是数组，直接处理
          if (Array.isArray(cleanAnswer)) {
            return cleanAnswer.join("、");
          }
          // 如果是字符串，支持多种分隔符：逗号、中文逗号、顿号、空格
          const answers = String(cleanAnswer)
            .split(/[,，、\s]+/)
            .map((v) => v.trim())
            .filter((v) => v);
          if (answers.length > 0) {
            return answers.join("、");
          }
          return String(cleanAnswer);
        }
        // 单选题：显示单个选项字母
        return Array.isArray(cleanAnswer)
          ? cleanAnswer.join("、")
          : String(cleanAnswer);
      },
    });
  } else if (selectedType.value === "4") {
    // 填空题：显示填空答案（题目内容已在baseColumns中），多个答案分行显示
    baseColumns.push({
      prop: "correctAnswer",
      label: "填空答案",
      minWidth: 250,
      align: "left",
      formatter: (val) => {
        if (!val) return "-";
        let cleanAnswer: string;
        if (Array.isArray(val)) {
          // 如果是数组，每个答案一行
          cleanAnswer = val.map((v) => stripHtmlTags(String(v))).join("\n");
        } else {
          // 如果是字符串，检查是否包含分隔符（逗号、中文逗号、顿号、分号等）
          const answerStr = stripHtmlTags(String(val));
          // 检查是否包含多个答案的分隔符
          if (/[,，、;；\n]/.test(answerStr)) {
            // 按分隔符分割，每个答案一行
            cleanAnswer = answerStr
              .split(/[,，、;；\n]+/)
              .map((v) => v.trim())
              .filter((v) => v)
              .join("\n");
          } else {
            cleanAnswer = answerStr;
          }
        }
        // 如果答案过长，在表格中截断显示
        if (cleanAnswer.length > 150) {
          return cleanAnswer.substring(0, 150) + "...";
        }
        return cleanAnswer;
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
        // 去除HTML标签后再判断
        const cleanAnswer = stripHtmlTags(String(val));
        const answerStr = cleanAnswer.toLowerCase().trim();
        if (
          answerStr === "true" ||
          answerStr === "对" ||
          answerStr === "正确" ||
          answerStr === "1" ||
          answerStr === "yes"
        ) {
          return "对";
        }
        if (
          answerStr === "false" ||
          answerStr === "错" ||
          answerStr === "错误" ||
          answerStr === "0" ||
          answerStr === "no"
        ) {
          return "错";
        }
        return cleanAnswer;
      },
    });
  } else if (selectedType.value === "8") {
    // 计算分析题：显示答案内容，格式为（1）答案1（2）答案2...，每个子题答案一行
    baseColumns.push({
      prop: "correctAnswer",
      label: "正确答案",
      minWidth: 400,
      align: "left",
      formatter: (val) => {
        if (!val) return "-";
        // 答案已经在 convertQuestion 中格式化为（1）答案1\n（2）答案2...的格式（使用换行符分隔）
        // 在表格中，换行符会被渲染为换行
        const answerStr = String(val);
        // 如果答案过长，在表格中适当截断（保留前几行）
        if (answerStr.length > 400) {
          const lines = answerStr.split("\n");
          if (lines.length > 3) {
            return lines.slice(0, 3).join("\n") + "\n...";
          }
          return answerStr.substring(0, 400) + "...";
        }
        return answerStr;
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
          if (
            answerStr === "true" ||
            answerStr === "对" ||
            answerStr === "正确" ||
            answerStr === "1" ||
            answerStr === "yes"
          ) {
            return "对";
          }
          if (
            answerStr === "false" ||
            answerStr === "错" ||
            answerStr === "错误" ||
            answerStr === "0" ||
            answerStr === "no"
          ) {
            return "错";
          }
        } else if (row.questionType === "multiple" || row.type === "2") {
          const answers = val
            .split(/[,，、\s]+/)
            .map((v: string) => v.trim())
            .filter((v: string) => v);
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

// 默认选择第一个类型（全部）
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
  columns.value.filter((col) => !col.actionButtons).map((col) => col.prop)
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


/* ===================== 状态 ===================== */
const { loading, withLoading } = useLoading();
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const tableData = ref<QuestionItem[]>([]);
const searchKeyword = ref("");
const advSearchParams = ref<Record<string, any>>({});
const tableToolBarRef = ref<InstanceType<typeof TableToolBar>>();

/* ===================== 主视图模式 ===================== */
const mainViewMode = ref<"table" | "statistics">("table"); // 主视图模式：题目表格或统计数据

/* ===================== 统计数据 ===================== */
const loadingStatistics = ref(false);
const activeStatTab = ref<"type" | "subject">("type");
const statViewMode = ref<"table" | "chart">("table"); // 统计视图模式：表格或图表
const typeStatistics = ref<StatisticsItem[]>([]);
const subjectStatistics = ref<StatisticsItem[]>([]);
const totalCount = ref(0);

// 获取统计数据
async function fetchStatistics() {
  loadingStatistics.value = true;
  try {
    // 获取按题型统计
    const typeResponse = await getQuestionStatistics({ group_by: "type" });
    if (typeResponse.success && typeResponse.data) {
      typeStatistics.value = typeResponse.data.statistics || [];
      totalCount.value = typeResponse.data.total || 0;
    }

    // 获取按科目统计
    const subjectResponse = await getQuestionStatistics({
      group_by: "subject",
    });
    if (subjectResponse.success && subjectResponse.data) {
      subjectStatistics.value = subjectResponse.data.statistics || [];
      // 如果题型统计没有总数，使用科目统计的总数
      if (!totalCount.value) {
        totalCount.value = subjectResponse.data.total || 0;
      }
    }
  } catch (error: unknown) {
    console.error("获取统计数据失败:", error);
    const message =
      error instanceof Error ? error.message : "获取统计数据失败";
    ElMessage.error(message);
  } finally {
    loadingStatistics.value = false;
  }
}

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

function onAdvSearch(payload: Record<string, unknown>) {
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
  selectedType.value = ""; // 重置为默认类型（全部）
  page.value = 1;
  fetchData();
}

/* ===================== 数据获取 ===================== */
async function fetchData() {
  await withLoading(async () => {
    try {
      // 构建查询参数
      const params: QuestionListParams = {
        page: page.value,
        page_size: pageSize.value,
        include_answer: true,
        include_analysis: true,
      };

      // 如果选择了具体题型，才添加 type 参数
      // 如果选择"全部"（selectedType.value 为空字符串），则不传 type 参数
      if (selectedType.value) {
        params.type = selectedType.value;
      }

      // 添加搜索关键字参数（搜索题目内容）
      if (searchKeyword.value && searchKeyword.value.trim()) {
        params.keyword = searchKeyword.value.trim();
      }

      // 添加高级搜索参数
      // 高级搜索中的题目内容字段
      if (
        advSearchParams.value.content &&
        advSearchParams.value.content.trim()
      ) {
        params.keyword = advSearchParams.value.content.trim();
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

      // 高级搜索：题目类型
      if (advSearchParams.value.type) {
        // 注意：如果高级搜索中选择了题目类型，会覆盖 selectedType
        // 这里可以根据实际需求决定是否允许覆盖
      }

      // 高级搜索：难度等级
      if (advSearchParams.value.difficulty) {
        params.difficulty = advSearchParams.value.difficulty;
      }

      // 高级搜索：分值
      if (advSearchParams.value.score) {
        params.score = advSearchParams.value.score;
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
    } catch (error: unknown) {
      console.error("获取题目列表失败:", error);
      // 注意：错误消息已经在响应拦截器中显示，这里不再重复显示
      // 只处理数据状态
      tableData.value = [];
      total.value = 0;
      throw error; // 重新抛出错误，让 withLoading 处理
    }
  });
}

/* ===================== 生命周期 ===================== */
onMounted(() => {
  // 获取题库名称（可以从路由参数或API获取）
  bankName.value = `题库 ${bankId.value}`;
  // 注意：虽然显示了题库ID，但后端暂时不区分，所有题库都返回相同数据
  // 默认选择"全部"，并自动加载数据
  fetchData();
  // 获取统计数据
  fetchStatistics();
});

// 注册页面刷新功能
usePageRefresh(fetchData);
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
  overflow-y: auto; // 允许垂直滚动
  min-height: 0; // 确保flex布局正常工作

  // 确保所有子元素都能正常显示
  > * {
    flex-shrink: 0; // 默认不收缩
  }

  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
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

.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;

  .view-toggle {
    flex-shrink: 0;
  }
}
</style>
