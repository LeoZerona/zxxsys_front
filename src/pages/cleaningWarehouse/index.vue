<template>
  <div class="dedup-page">
    <!-- 工具栏 -->
    <TableToolBar
      placeholder="搜索任务名称"
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

    <!-- 任务列表表格 -->
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
          <!-- 状态列特殊处理 -->
          <el-tag
            v-if="col.prop === 'status'"
            :type="formatStatus(row.status).type as any"
            size="small"
          >
            {{ formatStatus(row.status).text }}
          </el-tag>
          <!-- 普通列 -->
          <span v-else-if="!col.actionButtons">
            {{
              col.formatter ? col.formatter(row[col.prop], row) : row[col.prop]
            }}
          </span>
          <!-- 操作列 -->
          <div v-else class="action-group">
            <el-button
              v-for="btn in typeof col.actionButtons === 'function' ? col.actionButtons(row) : col.actionButtons"
              :key="btn.text"
              link
              :type="btn.type || 'primary'"
              :disabled="btn.disabled ? btn.disabled(row) : false"
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

    <!-- 创建任务对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建去重任务"
      width="500px"
      @close="handleCreateDialogClose"
    >
      <el-form :model="createForm" label-width="120px">
        <el-form-item label="任务名称">
          <el-input
            v-model="createForm.task_name"
            placeholder="留空则自动生成"
            clearable
          />
        </el-form-item>
        <el-form-item label="分析类型">
          <el-select
            v-model="createForm.analysis_type"
            placeholder="请选择分析类型"
            clearable
            style="width: 100%"
          >
            <el-option label="全量分析" value="full" />
            <el-option label="增量分析" value="incremental" />
          </el-select>
          <div class="form-tip">默认：全量分析</div>
        </el-form-item>
        <el-form-item label="相似度阈值">
          <el-input-number
            v-model="createForm.similarity_threshold"
            :min="0"
            :max="1"
            :step="0.05"
            :precision="2"
            placeholder="默认 0.8"
            style="width: 100%"
          />
          <div class="form-tip">相似度阈值范围：0-1，默认 0.8</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateTask" :loading="creating">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import TableToolBar from "@/components/tableToolBar/index.vue";
import { usePageRefresh } from "@/utils/usePageRefresh";
import { useLoading } from "@/utils/useLoading";
import {
  getDedupTasks,
  createDedupTask,
  deleteDedupTask,
  startDedupTask,
  cancelDedupTask,
  pauseDedupTask,
  resumeDedupTask,
  type DedupTask,
  type TaskStatus,
} from "@/api/dedup";
import {
  socketManager,
  type TaskProgressData,
  type TaskCompletedData,
  type TaskErrorData,
} from "@/utils/socket";

const router = useRouter();

// TableToolBar 列配置类型
interface IColumn {
  label: string;
  prop: string;
  searchType?: "input" | "select" | "date" | "dateRange";
  options?: { label: string; value: string | number }[];
}

// 筛选条件状态
const searchKeyword = ref("");
const advSearchParams = ref<Record<string, any>>({});

// 列配置类型
interface ActionButton {
  text: string;
  type?: "primary" | "success" | "warning" | "danger";
  disabled?: (row: DedupTask) => boolean;
  click: (row: DedupTask) => void;
}

interface Column {
  prop: string;
  label: string;
  width?: number | string;
  minWidth?: number | string;
  align?: "left" | "center" | "right";
  fixed?: "left" | "right";
  formatter?: (val: any, row: DedupTask) => string;
  actionButtons?: ActionButton[] | ((row: DedupTask) => ActionButton[]);
  searchType?: "input" | "select" | "date" | "dateRange";
  options?: { label: string; value: string | number }[];
}

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

const formatStatus = (status: TaskStatus) => {
  const statusMap: Record<TaskStatus, { text: string; type: string }> = {
    pending: { text: "待启动", type: "info" },
    running: { text: "运行中", type: "warning" },
    paused: { text: "已暂停", type: "warning" },
    completed: { text: "已完成", type: "success" },
    error: { text: "错误", type: "danger" },
    cancelled: { text: "已取消", type: "info" },
  };
  return statusMap[status] || { text: status, type: "info" };
};

const formatProgress = (percentage: number | null | undefined) => {
  if (percentage == null || isNaN(percentage)) {
    return "-";
  }
  return `${percentage.toFixed(1)}%`;
};

// 业务方法
function handleViewDetail(row: DedupTask) {
  router.push({
    name: "dedupTaskDetail",
    params: { id: row.id },
  });
}

async function handleStart(row: DedupTask) {
  try {
    await ElMessageBox.confirm("确定要启动此任务吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await startDedupTask(row.id);
    ElMessage.success("任务已启动");
    
    // 加入该任务的 WebSocket 房间以接收实时进度
    socketManager.joinTask(row.id);
    
    fetchData();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "启动任务失败");
    }
  }
}

async function handleCancel(row: DedupTask) {
  try {
    await ElMessageBox.confirm("确定要取消此任务吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await cancelDedupTask(row.id);
    ElMessage.success("任务已取消");
    fetchData();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "取消任务失败");
    }
  }
}

async function handlePause(row: DedupTask) {
  try {
    await ElMessageBox.confirm("确定要暂停此任务吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    const result = await pauseDedupTask(row.id);
    ElMessage.success("任务已暂停");
    
    // 更新任务状态
    if (result.data) {
      const taskIndex = tableData.value.findIndex((task) => task.id === row.id);
      if (taskIndex !== -1) {
        tableData.value[taskIndex] = { ...result.data };
      }
    }
    
    fetchData();
  } catch (error: any) {
    if (error !== "cancel") {
      // 检查是否是数据库错误
      const errorMessage = error.message || "";
      if (
        errorMessage.includes("Data truncated") ||
        errorMessage.includes("status") ||
        errorMessage.includes("pymysql")
      ) {
        ElMessage.error(
          "暂停任务失败：数据库字段不支持 'paused' 状态。请联系后端开发人员更新数据库 schema，在 status 字段中添加 'paused' 状态。"
        );
        console.error("数据库错误详情:", error);
      } else {
        ElMessage.error(errorMessage || "暂停任务失败");
      }
    }
  }
}

async function handleResume(row: DedupTask) {
  try {
    await ElMessageBox.confirm("确定要继续此任务吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    const result = await resumeDedupTask(row.id);
    ElMessage.success("任务已恢复运行");
    
    // 更新任务状态
    if (result.data) {
      const taskIndex = tableData.value.findIndex((task) => task.id === row.id);
      if (taskIndex !== -1) {
        tableData.value[taskIndex] = { ...result.data };
      }
    }
    
    // 加入该任务的 WebSocket 房间以接收实时进度
    socketManager.joinTask(row.id);
    
    fetchData();
  } catch (error: any) {
    if (error !== "cancel") {
      // 检查是否是数据库错误
      const errorMessage = error.message || "";
      if (
        errorMessage.includes("Data truncated") ||
        errorMessage.includes("status") ||
        errorMessage.includes("pymysql")
      ) {
        ElMessage.error(
          "恢复任务失败：数据库字段不支持 'paused' 状态。请联系后端开发人员更新数据库 schema，在 status 字段中添加 'paused' 状态。"
        );
        console.error("数据库错误详情:", error);
      } else {
        ElMessage.error(errorMessage || "恢复任务失败");
      }
    }
  }
}

async function handleDelete(row: DedupTask) {
  try {
    await ElMessageBox.confirm("确定要删除此任务吗？删除后无法恢复。", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    await deleteDedupTask(row.id);
    ElMessage.success("任务已删除");
    fetchData();
  } catch (error: any) {
    if (error !== "cancel") {
      ElMessage.error(error.message || "删除任务失败");
    }
  }
}

// 列配置
const columns = ref<Column[]>([
  {
    prop: "task_name",
    label: "任务名称",
    minWidth: 200,
    align: "left",
    searchType: "input",
  },
  {
    prop: "status",
    label: "状态",
    width: 120,
    formatter: (val) => formatStatus(val).text,
  },
  {
    prop: "progress_percentage",
    label: "进度",
    width: 120,
    formatter: (val) => formatProgress(val),
  },
  {
    prop: "total_questions",
    label: "题目总数",
    width: 120,
  },
  {
    prop: "estimated_duration",
    label: "预估时长",
    width: 120,
    formatter: (val) => {
      if (!val) return "-";
      const minutes = Math.floor(val / 60);
      const seconds = val % 60;
      if (minutes > 0) {
        return `${minutes}分${seconds}秒`;
      }
      return `${seconds}秒`;
    },
  },
  {
    prop: "exact_duplicate_groups",
    label: "完全重复组",
    width: 140,
  },
  {
    prop: "exact_duplicate_pairs",
    label: "完全重复对",
    width: 140,
  },
  {
    prop: "similar_duplicate_pairs",
    label: "相似重复对",
    width: 140,
  },
  {
    prop: "created_at",
    label: "创建时间",
    width: 180,
    formatter: (val) => formatDate(val),
    searchType: "dateRange",
  },
  {
    prop: "started_at",
    label: "开始时间",
    width: 180,
    formatter: (val) => formatDate(val),
  },
  {
    prop: "completed_at",
    label: "完成时间",
    width: 180,
    formatter: (val) => formatDate(val),
  },
  {
    prop: "action",
    label: "操作",
    minWidth: 280,
    fixed: "right",
    actionButtons: (row: DedupTask) => {
      const buttons: ActionButton[] = [
        {
          text: "查看详情",
          type: "primary",
          click: handleViewDetail,
        },
      ];

      // 根据任务状态添加不同的操作按钮
      if (row.status === "pending") {
        // 待启动任务：启动，删除
        buttons.push(
          {
            text: "启动",
            type: "success",
            click: handleStart,
          },
          {
            text: "删除",
            type: "danger",
            click: handleDelete,
          }
        );
      } else if (row.status === "running") {
        // 正在运行的任务：暂停，删除
        buttons.push(
          {
            text: "暂停",
            type: "warning",
            click: handlePause,
          },
          {
            text: "删除",
            type: "danger",
            click: handleDelete,
          }
        );
      } else if (row.status === "paused") {
        // 暂停的任务：继续，取消，删除
        buttons.push(
          {
            text: "继续",
            type: "success",
            click: handleResume,
          },
          {
            text: "取消",
            type: "warning",
            click: handleCancel,
          },
          {
            text: "删除",
            type: "danger",
            click: handleDelete,
          }
        );
      } else {
        // 其他状态（completed, error, cancelled）：只显示删除
        buttons.push({
          text: "删除",
          type: "danger",
          click: handleDelete,
        });
      }

      return buttons;
    },
  },
]);

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

// 根据 checkedCols 过滤显示的列（操作列始终显示）
const visibleColumns = computed(() => {
  return columns.value.filter((col) => {
    if (col.actionButtons) return true;
    return checkedCols.value.includes(col.prop);
  });
});

// 状态
const { loading, withLoading } = useLoading();
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const tableData = ref<DedupTask[]>([]);
const showCreateDialog = ref(false);
const creating = ref(false);
const createForm = ref({
  task_name: "",
  analysis_type: "full",
  similarity_threshold: 0.8,
});

// 数据获取
async function fetchData() {
  await withLoading(async () => {
    try {
      const params: any = {
        page: page.value,
        page_size: pageSize.value,
      };

      // 状态筛选
      if (advSearchParams.value.status) {
        params.status = advSearchParams.value.status;
      }

      const response = await getDedupTasks(params);

      if (response.success && response.data) {
        let filteredList = [...response.data.list];

        // 关键词搜索（搜索任务名称）
        if (searchKeyword.value) {
          const keyword = searchKeyword.value.toLowerCase();
          filteredList = filteredList.filter((task) =>
            task.task_name.toLowerCase().includes(keyword)
          );
        }

        // 高级搜索：创建时间范围
        if (
          advSearchParams.value.created_at &&
          Array.isArray(advSearchParams.value.created_at) &&
          advSearchParams.value.created_at.length === 2
        ) {
          const [start, end] = advSearchParams.value.created_at;
          if (start && end) {
            const startDate = new Date(start);
            const endDate = new Date(end);
            endDate.setHours(23, 59, 59, 999);
            filteredList = filteredList.filter((task) => {
              const date = new Date(task.created_at);
              return date >= startDate && date <= endDate;
            });
          }
        }

        tableData.value = filteredList;
        total.value = response.data.pagination.total;
      } else {
        tableData.value = [];
        total.value = 0;
      }
    } catch (error: any) {
      console.error("获取任务列表失败:", error);
      ElMessage.error(error.message || "数据加载失败");
      tableData.value = [];
      total.value = 0;
      throw error; // 重新抛出错误，让 withLoading 处理
    }
  });
}

// 重置所有筛选条件
function handleReset() {
  searchKeyword.value = "";
  advSearchParams.value = {};
  page.value = 1;
  fetchData();
}

// TableToolBar 事件处理
function onAdd() {
  showCreateDialog.value = true;
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

// 创建任务
async function handleCreateTask() {
  if (creating.value) return;

  creating.value = true;
  try {
    const config: any = {};
    if (createForm.value.similarity_threshold !== undefined) {
      config.similarity_threshold = createForm.value.similarity_threshold;
    }

    await createDedupTask({
      task_name: createForm.value.task_name || undefined,
      analysis_type: createForm.value.analysis_type || "full",
      config: Object.keys(config).length > 0 ? config : undefined,
    });

    ElMessage.success("任务创建成功");
    showCreateDialog.value = false;
    handleCreateDialogClose();
    fetchData();
  } catch (error: any) {
    ElMessage.error(error.message || "创建任务失败");
  } finally {
    creating.value = false;
  }
}

function handleCreateDialogClose() {
  createForm.value = {
    task_name: "",
    analysis_type: "full",
    similarity_threshold: 0.8,
  };
}

// WebSocket 处理函数
function handleTaskProgress(data: TaskProgressData) {
  // 更新对应任务的数据
  const taskIndex = tableData.value.findIndex(
    (task) => task.id === data.task_id
  );
  if (taskIndex !== -1) {
    const task = tableData.value[taskIndex];
    task.status = data.status as TaskStatus;
    task.processed_groups = data.processed_groups;
    task.total_groups = data.total_groups;
    task.progress_percentage = data.progress_percentage;
    // 触发响应式更新
    tableData.value[taskIndex] = { ...task };
  }
}

function handleTaskCompleted(data: TaskCompletedData) {
  // 更新任务为完成状态
  const taskIndex = tableData.value.findIndex(
    (task) => task.id === data.task_id
  );
  if (taskIndex !== -1) {
    const task = tableData.value[taskIndex];
    Object.assign(task, data.data);
    tableData.value[taskIndex] = { ...task };
  }
  ElMessage.success(`任务 ${data.task_id} 已完成`);
  // 刷新统计数据
  fetchData();
}

function handleTaskError(data: TaskErrorData) {
  // 更新任务为错误状态
  const taskIndex = tableData.value.findIndex(
    (task) => task.id === data.task_id
  );
  if (taskIndex !== -1) {
    const task = tableData.value[taskIndex];
    task.status = "error";
    task.error_message = data.error;
    tableData.value[taskIndex] = { ...task };
  }
  ElMessage.error(`任务 ${data.task_id} 执行失败: ${data.error}`);
}

// 加入所有运行中的任务房间
function joinRunningTasks() {
  const runningTasks = tableData.value.filter(
    (task) => task.status === "running"
  );
  runningTasks.forEach((task) => {
    socketManager.joinTask(task.id);
  });
}

// 生命周期
let refreshInterval: number | null = null;

onMounted(() => {
  fetchData().then(() => {
    // 检查是否有运行中的任务，如果有才连接 WebSocket
    const runningTasks = tableData.value.filter(
      (task) => task.status === "running"
    );
    
    if (runningTasks.length > 0) {
      // 数据加载完成后，连接 WebSocket 并加入运行中的任务房间
      socketManager.connect();
      
      // 监听任务进度更新
      socketManager.onTaskProgress(handleTaskProgress);
      
      // 监听任务完成
      socketManager.onTaskCompleted(handleTaskCompleted);
      
      // 监听任务错误
      socketManager.onTaskError(handleTaskError);
      
      // 等待 WebSocket 连接成功后加入任务房间
      const socket = socketManager.getSocket();
      if (socket) {
        socket.once("connect", () => {
          joinRunningTasks();
        });
        if (socket.connected) {
          joinRunningTasks();
        }
      }
    }
  });

  // 保留轮询作为备用方案（间隔改为30秒，主要用于非运行中的任务状态更新）
  refreshInterval = window.setInterval(() => {
    fetchData().then(() => {
      // 检查是否有新的运行中任务需要加入 WebSocket 房间
      const runningTasks = tableData.value.filter(
        (task) => task.status === "running"
      );
      runningTasks.forEach((task) => {
        socketManager.joinTask(task.id);
      });
    });
  }, 30000);
});

// 注册页面刷新功能
usePageRefresh(fetchData);

// 组件卸载时清理
onUnmounted(() => {
  // 清除定时器
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  
  // 移除 WebSocket 监听器
  socketManager.offTaskProgress(handleTaskProgress);
  socketManager.offTaskCompleted(handleTaskCompleted);
  socketManager.offTaskError(handleTaskError);
  
  // 离开所有任务房间（但不断开连接，因为可能其他页面也在使用）
  tableData.value.forEach((task) => {
    socketManager.leaveTask(task.id);
  });
});
</script>

<style lang="scss" scoped>
.dedup-page {
  height: 100%;
  background: #fff;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-table {
  flex: 1;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.action-group {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding: 8px 0;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
