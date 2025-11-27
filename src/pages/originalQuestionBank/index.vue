<template>
  <div class="repo-table">
    <TableToolBar
      placeholder="按姓名/工号搜索"
      :columns="columns1"
      @add="onAdd"
      @edit="onEdit"
      @del="onDel"
      @import="onImport"
      @export="onExport"
      @search="onSearch"
      @advSearch="onAdvSearch"
      @columnChange="onColumnChange"
    />
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        新建题库
      </el-button>

      <div class="search-box">
        <el-input
          v-model="keyword"
          placeholder="搜索题库名称"
          clearable
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" :icon="Search" @click="handleSearch">
          搜索
        </el-button>
      </div>
    </div>

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
        v-for="col in columns"
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
        small
        background
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import TableToolBar from "@/components/tableToolBar/index.vue";

const columns1 = ref([
  { label: "姓名", prop: "name" },
  {
    label: "性别",
    prop: "gender",
    searchType: "select",
    options: [
      { label: "男", value: 1 },
      { label: "女", value: 0 },
    ],
  },
  { label: "生日", prop: "birth", searchType: "date" },
  { label: "入职日期", prop: "entry", searchType: "dateRange" },
]);

// const visibleColumns = computed(() =>
//   columns.value.filter((c) => checkedCols.value.includes(c.prop))
// );
const checkedCols = ref(columns1.value.map((c) => c.prop));

function onAdd() {}
function onEdit() {}
function onDel() {}
function onImport(file: File) {}
function onExport() {}
function onSearch(kw: string) {}
function onAdvSearch(payload: Record<string, any>) {}
function onColumnChange(cols: string[]) {
  checkedCols.value = cols;
}

/* ===================== 类型 ===================== */
interface RepoItem {
  id: number;
  createdAt: string | Date;
  storage: number;
  questionCount: number;
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
  actionButtons?: ActionButton[]; // 有值即视为“操作列”
}

/* ===================== 列配置（按钮也在这里） ===================== */
const columns = ref<Column[]>([
  {
    prop: "createdAt",
    label: "创建日期",
    width: 180,
    formatter: (val) => formatDate(val),
  },
  {
    prop: "storage",
    label: "占用空间",
    width: 140,
    formatter: (val) => formatStorage(val),
  },
  {
    prop: "questionCount",
    label: "题目数量",
    width: 120,
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

/* ===================== 状态 ===================== */
const loading = ref(false);
const keyword = ref("");
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const tableData = ref<RepoItem[]>([]);

/* ===================== 生命周期 ===================== */
onMounted(() => fetchData());

/* ===================== 方法 ===================== */
async function fetchData() {
  loading.value = true;
  try {
    const res = await mockApi({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value,
    });
    tableData.value = res.list;
    total.value = res.total;
  } catch {
    ElMessage.error("数据加载失败");
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  fetchData();
}
function handleCreate() {
  ElMessage.info("新建功能待实现");
}
function handleView(row: RepoItem) {
  ElMessage.info(`查看题库 ID：${row.id}`);
}
function handleDel(row: RepoItem) {
  ElMessage.warning(`删除题库 ID：${row.id}（这里调接口）`);
}

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

const formatStorage = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

/* ===================== Mock API ===================== */
function mockApi(p: { page: number; pageSize: number; keyword?: string }) {
  return new Promise<{ list: RepoItem[]; total: number }>((resolve) => {
    setTimeout(() => {
      const all: RepoItem[] = Array.from({ length: 137 }, (_, idx) => ({
        id: idx + 1,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * idx),
        storage: Math.floor(Math.random() * 1024 * 1024 * 100),
        questionCount: Math.floor(Math.random() * 5000),
      })).filter((v) =>
        p.keyword ? v.id.toString().includes(p.keyword) : true
      );
      const offset = (p.page - 1) * p.pageSize;
      resolve({
        list: all.slice(offset, offset + p.pageSize),
        total: all.length,
      });
    }, 300);
  });
}
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