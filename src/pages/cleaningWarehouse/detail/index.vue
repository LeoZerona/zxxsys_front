<template>
  <div class="task-detail-page">
    <!-- 面包屑导航和返回按钮 -->
    <div class="page-header">
      <el-breadcrumb separator="/" class="breadcrumb">
        <el-breadcrumb-item :to="{ name: 'CleaningWarehouse' }"
          >清洗库</el-breadcrumb-item
        >
        <el-breadcrumb-item>{{ taskName || "任务详情" }}</el-breadcrumb-item>
      </el-breadcrumb>
      <el-button :icon="ArrowLeft" @click="handleBack">返回</el-button>
    </div>

    <!-- 任务基本信息 -->
    <TaskInfoCard
      :task-info="taskInfo"
      :loading="loadingTask || reverifyLoading"
      :current-group-info="currentGroupInfo"
      :reverify-loading="reverifyLoading"
      @reverify="handleReverifyTask"
    />

    <!-- 视图切换按钮 -->
    <div class="view-toggle-section">
      <el-button-group>
        <el-button
          :type="mainViewMode === 'data' ? 'primary' : 'default'"
          :icon="Document"
          @click="mainViewMode = 'data'"
        >
          重复数据列表
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

    <!-- 内容区域：重复数据列表或统计数据 -->
    <div class="content-area">
      <!-- 重复数据列表 -->
      <DataTableView
        v-show="mainViewMode === 'data'"
        :task-id="taskId"
        :subject-options="subjectOptions"
        :exact-groups="exactGroups"
        :loading-exact-groups="loadingExactGroups"
        :exact-page="exactPage"
        :exact-page-size="exactPageSize"
        :exact-total="exactTotal"
        :exact-filter-form="exactFilterForm"
        :similar-pairs="similarPairs"
        :loading-similar-pairs="loadingSimilarPairs"
        :similar-page="similarPage"
        :similar-page-size="similarPageSize"
        :similar-total="similarTotal"
        :similar-filter-form="similarFilterForm"
        @fetch-exact-groups="fetchExactGroups"
        @reset-exact-filter="resetExactFilter"
        @fetch-similar-pairs="fetchSimilarPairs"
        @reset-similar-filter="resetSimilarFilter"
        @view-exact-group="handleViewExactGroup"
        @view-similar-pair="handleViewSimilarPair"
        @exact-page-change="(page) => (exactPage = page)"
        @exact-page-size-change="(size) => (exactPageSize = size)"
        @similar-page-change="(page) => (similarPage = page)"
        @similar-page-size-change="(size) => (similarPageSize = size)"
      />

      <!-- 统计信息卡片 -->
      <StatisticsView
        v-show="mainViewMode === 'statistics'"
        :statistics="statistics"
        :loading="loadingStatistics"
        v-model:view-mode="statViewMode"
        v-model:active-tab="activeStatTab"
      />
    </div>

    <!-- 完全重复组详情对话框 -->
    <ExactGroupDetailDialog
      v-model="showExactGroupDialog"
      :task-id="taskId"
      :group-id="currentExactGroupId"
      @close="handleExactGroupDialogClose"
    />

    <!-- 相似重复对详情对话框 -->
    <SimilarPairDetailDialog
      v-model="showSimilarPairDialog"
      :task-id="taskId"
      :pair-data="currentSimilarPairData"
      @close="handleSimilarPairDialogClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Document,
  PieChart as PieChartIcon,
} from "@element-plus/icons-vue";
import {
  getDedupTaskDetail,
  getTaskStatistics,
  getExactGroups,
  getSimilarPairs,
  reverifyDedupTask,
  type DedupTask,
  type TaskStatus,
  type ExactDuplicateGroup,
  type SimilarDuplicatePair,
  type TaskStatistics,
  type GetExactGroupsParams,
  type GetSimilarPairsParams,
  type ReverifyTaskData,
} from "@/api/dedup";
import TaskInfoCard from "./components/TaskInfoCard.vue";
import DataTableView from "./components/DataTableView.vue";
import StatisticsView from "./components/StatisticsView.vue";
import ExactGroupDetailDialog from "./components/ExactGroupDetailDialog.vue";
import SimilarPairDetailDialog from "./components/SimilarPairDetailDialog.vue";
import {
  socketManager,
  type TaskProgressData,
  type TaskCompletedData,
  type TaskErrorData,
  type TaskStatusData,
} from "@/utils/socket";
import { usePageRefresh } from "@/utils/usePageRefresh";

const router = useRouter();
const route = useRoute();
const taskId = computed(() => Number(route.params.id));

// 任务信息
const loadingTask = ref(false);
const reverifyLoading = ref(false);
const taskInfo = ref<DedupTask | null>(null);
const taskName = computed(() => taskInfo.value?.task_name || "");
const currentGroupInfo = ref<string>("");

// 主视图模式
const mainViewMode = ref<"data" | "statistics">("data"); // 主视图模式：重复数据列表或统计数据

// 统计信息
const loadingStatistics = ref(false);
const statistics = ref<TaskStatistics | null>(null);
const activeStatTab = ref<"type" | "subject">("type"); // 统计标签页：按题型或按科目
const statViewMode = ref<"table" | "chart">("table"); // 统计视图模式：表格或图表

// 科目选项（从统计数据中提取）
const subjectOptions = computed(() => {
  if (!statistics.value?.by_subject) return [];
  return statistics.value.by_subject.map((item) => ({
    id: item.subject_id,
    name: item.subject_name || `科目${item.subject_id}`,
  }));
});

// 完全重复组
const loadingExactGroups = ref(false);
const exactGroups = ref<ExactDuplicateGroup[]>([]);
const exactPage = ref(1);
const exactPageSize = ref(20);
const exactTotal = ref(0);
const exactFilterForm = ref({
  group_type: "",
  subject_id: undefined as number | undefined,
  question_count: undefined as number | undefined,
});

// 相似重复对
const loadingSimilarPairs = ref(false);
const similarPairs = ref<SimilarDuplicatePair[]>([]);
const similarPage = ref(1);
const similarPageSize = ref(20);
const similarTotal = ref(0);
const similarFilterForm = ref({
  group_type: "",
  min_similarity: undefined as number | undefined,
});

// 业务方法
function handleBack() {
  router.push({ name: "CleaningWarehouse" });
}

async function fetchTaskDetail() {
  if (!taskId.value) return;
  loadingTask.value = true;
  try {
    const response = await getDedupTaskDetail(taskId.value);
    if (response.success && response.data) {
      taskInfo.value = response.data;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "获取任务详情失败";
    ElMessage.error(message);
  } finally {
    loadingTask.value = false;
  }
}

async function fetchStatistics() {
  if (!taskId.value) return;
  loadingStatistics.value = true;
  try {
    const response = await getTaskStatistics(taskId.value);
    if (response.success && response.data) {
      statistics.value = response.data;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "获取统计信息失败";
    ElMessage.error(message);
  } finally {
    loadingStatistics.value = false;
  }
}

async function fetchExactGroups() {
  if (!taskId.value) return;
  loadingExactGroups.value = true;
  try {
    const params: GetExactGroupsParams = {
      page: exactPage.value,
      page_size: exactPageSize.value,
    };
    if (exactFilterForm.value.group_type) {
      params.group_type = exactFilterForm.value.group_type;
    }
    if (exactFilterForm.value.subject_id) {
      params.subject_id = exactFilterForm.value.subject_id;
    }
    if (exactFilterForm.value.question_count) {
      params.question_count = exactFilterForm.value.question_count;
    }

    const response = await getExactGroups(taskId.value, params);
    if (response.success && response.data) {
      exactGroups.value = response.data.list || [];
      exactTotal.value = response.data.pagination?.total || 0;
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "获取完全重复组列表失败";
    ElMessage.error(message);
  } finally {
    loadingExactGroups.value = false;
  }
}

async function fetchSimilarPairs() {
  if (!taskId.value) return;
  loadingSimilarPairs.value = true;
  try {
    const params: GetSimilarPairsParams = {
      page: similarPage.value,
      page_size: similarPageSize.value,
    };
    if (similarFilterForm.value.group_type) {
      params.group_type = similarFilterForm.value.group_type;
    }
    if (similarFilterForm.value.min_similarity !== undefined) {
      params.min_similarity = similarFilterForm.value.min_similarity;
    }

    const response = await getSimilarPairs(taskId.value, params);
    if (response.success && response.data) {
      similarPairs.value = response.data.list || [];
      similarTotal.value = response.data.pagination?.total || 0;
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "获取相似重复对列表失败";
    ElMessage.error(message);
  } finally {
    loadingSimilarPairs.value = false;
  }
}

// 对话框状态
const showExactGroupDialog = ref(false);
const showSimilarPairDialog = ref(false);
const currentExactGroupId = ref<number | undefined>();
const currentSimilarPairData = ref<any>(null);

function handleViewExactGroup(row: ExactDuplicateGroup) {
  currentExactGroupId.value = row.id;
  showExactGroupDialog.value = true;
}

function handleViewSimilarPair(row: any) {
  // 根据新的数据结构，row 包含 question_id（基准题目）和 duplicates 数组
  // 传递完整的 row 数据，包含所有 duplicates 和相似度信息
  if (
    row.duplicates &&
    Array.isArray(row.duplicates) &&
    row.duplicates.length > 0
  ) {
    currentSimilarPairData.value = row;
    showSimilarPairDialog.value = true;
  } else {
    ElMessage.warning("该记录没有重复对信息");
  }
}

function handleExactGroupDialogClose() {
  showExactGroupDialog.value = false;
  currentExactGroupId.value = undefined;
}

function handleSimilarPairDialogClose() {
  showSimilarPairDialog.value = false;
  currentSimilarPairData.value = null;
}

function resetExactFilter() {
  exactFilterForm.value = {
    group_type: "",
    subject_id: undefined,
    question_count: undefined,
  };
  exactPage.value = 1;
  fetchExactGroups();
}

function resetSimilarFilter() {
  similarFilterForm.value = {
    group_type: "",
    min_similarity: undefined,
  };
  similarPage.value = 1;
  fetchSimilarPairs();
}

// WebSocket 处理函数
function handleTaskProgress(data: TaskProgressData) {
  if (data.task_id !== taskId.value) return;

  // 更新任务信息
  if (taskInfo.value) {
    taskInfo.value.status = data.status as TaskStatus;
    taskInfo.value.processed_groups = data.processed_groups;
    taskInfo.value.total_groups = data.total_groups;
    taskInfo.value.progress_percentage = data.progress_percentage;

    // 更新当前处理的分组信息
    if (data.current_group) {
      const parts = [];
      if (data.current_group.type_name) {
        parts.push(data.current_group.type_name);
      }
      if (data.current_group.subject_name) {
        parts.push(data.current_group.subject_name);
      }
      if (data.current_group.channel_code) {
        parts.push(`渠道: ${data.current_group.channel_code}`);
      }
      currentGroupInfo.value = parts.join(" - ");
    } else if (data.message) {
      currentGroupInfo.value = data.message;
    } else {
      currentGroupInfo.value = "";
    }
  }
}

function handleTaskCompleted(data: TaskCompletedData) {
  if (data.task_id !== taskId.value) return;

  // 更新任务信息
  if (taskInfo.value && data.data) {
    Object.assign(taskInfo.value, data.data);
  }

  // 清除当前处理信息
  currentGroupInfo.value = "";

  ElMessage.success("任务已完成！");

  // 刷新统计信息和列表数据
  fetchStatistics();
  fetchExactGroups();
  fetchSimilarPairs();
}

// 二次验证
async function handleReverifyTask() {
  if (!taskId.value || !taskInfo.value) return;

  if (taskInfo.value.status !== "completed") {
    ElMessage.warning("只有状态为已完成的任务才能进行二次验证");
    return;
  }

  try {
    await ElMessageBox.confirm(
      "将对已完成的去重任务进行二次验证，过滤误判的重复题目对，并可选择重置任务状态重新运行。确定继续吗？",
      "二次验证确认",
      {
        type: "warning",
        confirmButtonText: "开始验证",
        cancelButtonText: "取消",
      }
    );
  } catch {
    // 用户取消
    return;
  }

  reverifyLoading.value = true;
  try {
    const response = await reverifyDedupTask(taskId.value, {
      // 默认：只验证相似重复对，并重置任务状态，批大小 50
      verification_type: "similar",
      reset_task: true,
      batch_size: 50,
    });

    if (response.success) {
      const data = (response.data || {}) as ReverifyTaskData;
      const msg =
        response.message ||
        `二次验证完成，共验证 ${data.total_pairs ?? 0} 对重复题目，` +
          `保留 ${data.verified_pairs ?? 0} 对，过滤 ${data.filtered_pairs ?? 0} 对，` +
          (data.task_reset ? "任务已重置为待运行状态" : "任务状态未修改");

      ElMessage.success(msg);

      // 验证完成后刷新任务信息、统计和列表
      await fetchTaskDetail();
      fetchStatistics();
      fetchExactGroups();
      fetchSimilarPairs();
    } else {
      ElMessage.error(response.message || "二次验证失败");
    }
  } catch (error: any) {
    const msg =
      error?.response?.data?.message ||
      error?.message ||
      "二次验证失败，请稍后重试";
    ElMessage.error(msg);
  } finally {
    reverifyLoading.value = false;
  }
}

function handleTaskError(data: TaskErrorData) {
  if (data.task_id !== taskId.value) return;

  // 更新任务信息
  if (taskInfo.value) {
    taskInfo.value.status = "error";
    taskInfo.value.error_message = data.error;
  }

  ElMessage.error(`任务执行失败: ${data.error}`);
}

function handleTaskStatus(data: TaskStatusData) {
  if (data.task_id !== taskId.value) return;

  // 初始化任务状态
  if (data.data) {
    taskInfo.value = data.data as DedupTask;
    currentGroupInfo.value = "";
  }
}

// 统一的刷新函数
async function refreshPageData() {
  await fetchTaskDetail();
  fetchStatistics();
  fetchExactGroups();
  fetchSimilarPairs();
}

// 生命周期
onMounted(() => {
  fetchTaskDetail().then(() => {
    // 如果任务正在运行，连接 WebSocket 并加入任务房间
    if (taskInfo.value?.status === "running") {
      socketManager.connect();
      socketManager.joinTask(taskId.value);
    }
  });

  fetchStatistics();
  fetchExactGroups();
  fetchSimilarPairs();

  // 监听 WebSocket 事件
  socketManager.onTaskProgress(handleTaskProgress);
  socketManager.onTaskCompleted(handleTaskCompleted);
  socketManager.onTaskError(handleTaskError);
  socketManager.onTaskStatus(handleTaskStatus);

  // 如果 WebSocket 已连接，立即加入任务房间
  if (socketManager.isConnected()) {
    socketManager.joinTask(taskId.value);
  } else {
    // 等待连接成功后加入
    const socket = socketManager.getSocket();
    if (socket) {
      socket.once("connect", () => {
        socketManager.joinTask(taskId.value);
      });
    }
  }
});

// 注册页面刷新功能
usePageRefresh(refreshPageData);

// 组件卸载时清理
onUnmounted(() => {
  // 离开任务房间
  socketManager.leaveTask(taskId.value);

  // 移除 WebSocket 监听器
  socketManager.offTaskProgress(handleTaskProgress);
  socketManager.offTaskCompleted(handleTaskCompleted);
  socketManager.offTaskError(handleTaskError);
  socketManager.offTaskStatus(handleTaskStatus);
});
</script>

<style lang="scss" scoped>
.task-detail-page {
  height: 100%;
  background: #f5f7fa;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 16px;
  border-radius: 8px;

  .breadcrumb {
    font-size: 14px;
    color: #606266;
  }
}

.view-toggle-section {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .data-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
}

.task-info-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: #303133;
    }
  }

  .card-body {
    .info-row {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .info-item {
        display: flex;
        align-items: center;
        min-width: 200px;

        &.full-width {
          width: 100%;
          flex-direction: column;
          align-items: flex-start;
        }

        .label {
          color: #909399;
          margin-right: 8px;
          white-space: nowrap;
        }

        .value {
          color: #303133;
          font-weight: 500;

          &.error {
            color: #f56c6c;
          }
        }

        .progress-info {
          width: 100%;

          .progress-label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 14px;
            color: #606266;

            .progress-text {
              font-weight: 500;
              color: #409eff;
            }
          }
        }
      }
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      margin-bottom: 30px;

      .stat-item {
        text-align: center;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #409eff;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }
    }

    .stats-table {
      margin-top: 24px;

      h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 500;
        color: #303133;
      }

      // 表格包装容器，添加滚动条
      .stats-table-wrapper {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #ebeef5;
        border-radius: 4px;

        // 确保表格头部在滚动时保持可见
        :deep(.el-table__header-wrapper) {
          position: sticky;
          top: 0;
          z-index: 10;
          background: #fff;
        }

        // 自定义滚动条样式（可选，让滚动条更美观）
        &::-webkit-scrollbar {
          width: 8px;
        }

        &::-webkit-scrollbar-track {
          background: #f5f7fa;
          border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb {
          background: #c0c4cc;
          border-radius: 4px;

          &:hover {
            background: #a4a9ae;
          }
        }
      }
    }
  }
}

.detail-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.el-tabs__content) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  :deep(.el-tab-pane) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .tab-content {
    padding-top: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;

    .filter-bar {
      margin-bottom: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 6px;
      flex-shrink: 0;
    }

    .data-table {
      margin-bottom: 16px;
      flex: 1 1 auto;
      min-height: 400px;
      overflow: auto;
    }

    .pagination-bar {
      display: flex;
      justify-content: flex-end;
      padding: 8px 0;
      flex-shrink: 0;
      margin-top: auto;
    }
  }
}

.statistics-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
    flex-shrink: 0;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: #303133;
    }

    .view-switcher {
      :deep(.el-radio-group) {
        .el-radio-button {
          .el-radio-button__inner {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            font-size: 14px;

            .el-icon {
              font-size: 16px;
            }
          }
        }
      }
    }
  }

  .card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      margin-bottom: 30px;

      .stat-item {
        text-align: center;
        padding: 20px;
        background: #f8f9fa;
        border-radius: 8px;

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #409eff;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }
    }

    .stat-tabs {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;

      :deep(.el-tabs__content) {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      :deep(.el-tab-pane) {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
    }

    .stat-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .stat-table-section {
      width: 100%;

      .stat-number {
        font-weight: 600;
        color: #303133;
        font-size: 14px;
      }
    }

    .stat-chart-section {
      width: 100%;
      min-height: 500px;
      display: block;

      .chart-container {
        background: #fafafa;
        border-radius: 8px;
        padding: 20px;
        border: 1px solid #ebeef5;
        width: 100%;
        min-height: 500px;
        box-sizing: border-box;
        position: relative;
      }

      .chart-wrapper {
        width: 100% !important;
        height: 450px !important;
        min-height: 450px !important;
        display: block !important;
      }
    }
  }
}
</style>
