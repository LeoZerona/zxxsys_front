<template>
  <div class="repo-table">
    <TableToolBar
      ref="tableToolBarRef"
      placeholder="搜索题型、题目数量"
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
    <!-- 顶部工具栏（已集成到 TableToolBar 中，可删除或保留用于其他操作） -->

    <!-- 表格：列、按钮全部由 columns 配置驱动 -->
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
        <!-- 统一渲染入口 -->
        <template #default="{ row }">
          <!-- 普通列 -->
          <span v-if="!col.actionButtons">
            {{
              col.formatter ? col.formatter(row[col.prop], row) : row[col.prop]
            }}
          </span>

          <!-- 操作列：按钮组 -->
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
        :page-sizes="[10, 20, 50]"
        :total="total"
        layout="sizes, prev, pager, next, jumper"
        size="small"
        background
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import TableToolBar from "@/components/tableToolBar/index.vue";
import { getQuestionStatistics } from "@/api/question";

const router = useRouter();

// TableToolBar 列配置类型
interface IColumn {
  label: string;
  prop: string;
  searchType?: "input" | "select" | "date" | "dateRange";
  options?: { label: string; value: string | number }[];
}

// 筛选条件状态 - 与 tableToolBar 组件关联
const searchKeyword = ref("");
const advSearchParams = ref<Record<string, any>>({});

// 表格工具栏引用
const tableToolBarRef = ref<InstanceType<typeof TableToolBar>>();

function onAdd() {
  ElMessage.info("添加功能");
}
function onEdit() {
  ElMessage.info("编辑功能");
}
function onDel() {
  ElMessage.info("删除功能");
}
function onImport(file: File) {
  ElMessage.success(`导入文件: ${file.name}`);
}
function onExport() {
  ElMessage.info("导出功能");
}
/* ===================== 类型 ===================== */
interface RepoItem {
  id: number;
  createdAt: string | Date;
  storage: number;
  questionCount: number;
  type?: string; // 题型代码
  typeName?: string; // 题型名称
}

/** 按钮配置 */
interface ActionButton {
  text: string;
  type?: "primary" | "success" | "warning" | "danger";
  click: (row: RepoItem) => void;
}

/** 列配置 */
interface Column {
  prop: string;
  label: string;
  width?: number | string;
  minWidth?: number | string;
  align?: "left" | "center" | "right";
  fixed?: "left" | "right";
  formatter?: (val: any, row: RepoItem) => string;
  actionButtons?: ActionButton[]; // 有值即视为"操作列"
  // TableToolBar 筛选相关配置
  searchType?: "input" | "select" | "date" | "dateRange";
  options?: { label: string; value: string | number }[];
}

/* ===================== 工具函数（需要在列配置之前定义） ===================== */
const formatDate = (d: string | Date) => {
  const date = new Date(d);
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, "0");
  const D = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${Y}-${M}-${D} ${h}:${m}`;
};

const formatStorage = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

/* ===================== 业务方法（需要在列配置之前定义） ===================== */
function handleView(row: RepoItem) {
  // 跳转到题库内容详情页，传递题型参数
  router.push({
    name: "questionBankDetail",
    params: { id: row.id || "1" },
    query: { type: row.type || "" }, // 传递题型代码
  });
}

function handleDel(row: RepoItem) {
  ElMessage.warning(`删除题库 ID：${row.id}（这里调接口）`);
}

/* ===================== 列配置（按钮也在这里） ===================== */
const columns = ref<Column[]>([
  {
    prop: "typeName",
    label: "题型",
    width: 150,
    formatter: (val) => val || "全部题目",
  },
  {
    prop: "questionCount",
    label: "题目数量",
    width: 120,
    searchType: "input", // 支持输入筛选
  },
  {
    prop: "createdAt",
    label: "创建日期",
    width: 180,
    formatter: (val) => formatDate(val),
    searchType: "dateRange", // 支持日期范围筛选
  },
  {
    prop: "storage",
    label: "占用空间",
    width: 140,
    formatter: (val) => formatStorage(val),
    searchType: "input", // 支持输入筛选
  },
  {
    prop: "action",
    label: "操作",
    minWidth: 120,
    actionButtons: [
      { text: "查看题库内容", type: "primary", click: handleView },
      { text: "删除", type: "danger", click: handleDel },
    ],
  },
]);

// 将表格列配置转换为 TableToolBar 需要的格式（排除操作列）
const tableToolBarColumns = computed<IColumn[]>(() => {
  return columns.value
    .filter((col) => !col.actionButtons) // 排除操作列
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
    // 只有当 checkedCols 为空或与当前列不匹配时才更新
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
    // 操作列始终显示
    if (col.actionButtons) return true;
    // 其他列根据 checkedCols 决定是否显示
    return checkedCols.value.includes(col.prop);
  });
});

/* ===================== 状态 ===================== */
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const tableData = ref<RepoItem[]>([]);

/* ===================== 方法 ===================== */
async function fetchData() {
  loading.value = true;
  try {
    // 获取题目统计信息（按题型分组）
    const response = await getQuestionStatistics({
      group_by: "type",
    });

    if (response.success && response.data) {
      // 将统计信息转换为列表格式
      // 由于所有原题库都是同一个，我们按题型展示
      let list: RepoItem[] = [];

      if (response.data.statistics && response.data.statistics.length > 0) {
        list = response.data.statistics.map((stat, index) => ({
          id: index + 1,
          createdAt: new Date(), // 统一题库，使用当前时间
          storage: 0, // 暂不计算占用空间
          questionCount: stat.count || 0,
          type: stat.type || "",
          typeName: stat.type_name || "",
        }));
      } else {
        // 如果没有统计数据，创建一个默认条目
        list = [
          {
            id: 1,
            createdAt: new Date(),
            storage: 0,
            questionCount: response.data.total || 0,
            type: "",
            typeName: "全部题目",
          },
        ];
      }

      // 应用筛选条件
      let filteredList = [...list];

      // 关键词搜索（搜索题型名称、题目数量）
      if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase();
        filteredList = filteredList.filter((v) => {
          return (
            (v.typeName && v.typeName.toLowerCase().includes(keyword)) ||
            v.questionCount.toString().includes(keyword)
          );
        });
      }

      // 高级搜索：创建日期范围
      if (
        advSearchParams.value.createdAt &&
        Array.isArray(advSearchParams.value.createdAt) &&
        advSearchParams.value.createdAt.length === 2
      ) {
        const [start, end] = advSearchParams.value.createdAt;
        if (start && end) {
          const startDate = new Date(start);
          const endDate = new Date(end);
          endDate.setHours(23, 59, 59, 999);
          filteredList = filteredList.filter((v) => {
            const date = new Date(v.createdAt);
            return date >= startDate && date <= endDate;
          });
        }
      }

      // 高级搜索：题目数量
      if (advSearchParams.value.questionCount) {
        filteredList = filteredList.filter((v) =>
          v.questionCount
            .toString()
            .includes(advSearchParams.value.questionCount!)
        );
      }

      // 分页处理
      const offset = (page.value - 1) * pageSize.value;
      tableData.value = filteredList.slice(offset, offset + pageSize.value);
      total.value = filteredList.length;
    } else {
      tableData.value = [];
      total.value = 0;
    }
  } catch (error: any) {
    console.error("获取题库数据失败:", error);
    ElMessage.error(error.message || "数据加载失败");
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

// 重置所有筛选条件
function handleReset() {
  searchKeyword.value = "";
  advSearchParams.value = {};
  page.value = 1;
  fetchData();
}

// TableToolBar 事件处理
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
  // 更新列显隐状态
  checkedCols.value = [...cols];
}

/* ===================== 生命周期 ===================== */
onMounted(() => fetchData());
</script>

<style lang="scss" scoped>
/* ========== CSS 变量 ========== */
:root {
  --repo-primary: #409eff;
  --repo-border: #ebeef5;
  --repo-bg: #f5f7fa;
  --repo-radius: 8px;
}

.repo-table {
  height: 100%;
  background: #fff;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 顶部工具栏 */
.toolbar {
  display: flex;
  align-items: center;
  background: var(--repo-bg);
  padding: 12px 16px;
  border-radius: var(--repo-radius);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);

  .search-box {
    margin-left: auto;
    display: flex;
    gap: 8px;
  }
}

/* 表格 */
.data-table {
  flex: 1;
  border: 1px solid var(--repo-border);
  border-radius: var(--repo-radius);
  overflow: hidden;
}

/* 操作按钮组 */
.action-group {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 分页条 */
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
}
</style>

<!-- 全局分页样式 -->
<style lang="scss">
.el-pagination.is-background .btn-prev,
.el-pagination.is-background .btn-next,
.el-pagination.is-background .el-pager li {
  border-radius: 6px;
  background: #fff;
  border: 1px solid #dcdfe6;
  &:hover {
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}
.el-pagination.is-background .el-pager li.is-active {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #fff;
}
</style>
