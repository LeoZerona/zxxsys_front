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
    <div class="task-info-card" v-loading="loadingTask">
      <div class="card-header">
        <h3>任务信息</h3>
        <el-tag
          :type="formatStatus(taskInfo?.status || '').type as any"
          size="large"
        >
          {{ formatStatus(taskInfo?.status || "").text }}
        </el-tag>
      </div>
      <div class="card-body" v-if="taskInfo">
        <div class="info-row">
          <div class="info-item">
            <span class="label">任务名称：</span>
            <span class="value">{{ taskInfo.task_name }}</span>
          </div>
          <div class="info-item">
            <span class="label">题目总数：</span>
            <span class="value">{{ taskInfo.total_questions }}</span>
          </div>
          <div class="info-item">
            <span class="label">进度：</span>
            <span class="value"
              >{{ taskInfo.progress_percentage.toFixed(1) }}%</span
            >
          </div>
        </div>
        <!-- 进度条和当前处理信息 -->
        <div class="info-row" v-if="taskInfo.status === 'running'">
          <div class="info-item full-width">
            <div class="progress-info">
              <div class="progress-label">
                <span>处理进度：</span>
                <span class="progress-text"
                  >{{ taskInfo.processed_groups }} / {{ taskInfo.total_groups }}
                  分组</span
                >
              </div>
              <el-progress
                :percentage="taskInfo.progress_percentage"
                :status="taskInfo.status === 'running' ? undefined : 'success'"
                :stroke-width="8"
              />
            </div>
            <div
              class="current-group-info"
              v-if="currentGroupInfo"
              style="margin-top: 8px; font-size: 12px; color: #909399"
            >
              当前处理：{{ currentGroupInfo }}
            </div>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item">
            <span class="label">完全重复组：</span>
            <span class="value">{{ taskInfo.exact_duplicate_groups }}</span>
          </div>
          <div class="info-item">
            <span class="label">完全重复对：</span>
            <span class="value">{{ taskInfo.exact_duplicate_pairs }}</span>
          </div>
          <div class="info-item">
            <span class="label">相似重复对：</span>
            <span class="value">{{ taskInfo.similar_duplicate_pairs }}</span>
          </div>
        </div>
        <div class="info-row">
          <div class="info-item">
            <span class="label">创建时间：</span>
            <span class="value">{{ formatDate(taskInfo.created_at) }}</span>
          </div>
          <div class="info-item" v-if="taskInfo.started_at">
            <span class="label">开始时间：</span>
            <span class="value">{{ formatDate(taskInfo.started_at) }}</span>
          </div>
          <div class="info-item" v-if="taskInfo.completed_at">
            <span class="label">完成时间：</span>
            <span class="value">{{ formatDate(taskInfo.completed_at) }}</span>
          </div>
        </div>
        <div class="info-row" v-if="taskInfo.error_message">
          <div class="info-item full-width">
            <span class="label">错误信息：</span>
            <span class="value error">{{ taskInfo.error_message }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计信息卡片 -->
    <div
      class="statistics-card"
      v-loading="loadingStatistics"
      v-if="statistics"
    >
      <div class="card-header">
        <h3>统计信息</h3>
      </div>
      <div class="card-body">
        <div class="summary-stats">
          <div class="stat-item">
            <div class="stat-value">
              {{ statistics.summary.total_duplicates }}
            </div>
            <div class="stat-label">总重复数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">
              {{ statistics.summary.exact_duplicate_groups }}
            </div>
            <div class="stat-label">完全重复组</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">
              {{ statistics.summary.exact_duplicate_pairs }}
            </div>
            <div class="stat-label">完全重复对</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">
              {{ statistics.summary.similar_duplicate_pairs }}
            </div>
            <div class="stat-label">相似重复对</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">
              {{ statistics.summary.unique_question_count }}
            </div>
            <div class="stat-label">唯一题目数</div>
          </div>
        </div>

        <!-- 按题型统计 -->
        <div
          class="stats-table"
          v-if="statistics.by_type && statistics.by_type.length > 0"
        >
          <h4>按题型统计</h4>
          <el-table :data="statistics.by_type" stripe border size="small">
            <el-table-column prop="type_name" label="题型" width="120" />
            <el-table-column
              prop="exact_groups"
              label="完全重复组"
              width="140"
              align="center"
            />
            <el-table-column
              prop="similar_pairs"
              label="相似重复对"
              width="140"
              align="center"
            />
          </el-table>
        </div>

        <!-- 按科目统计 -->
        <div
          class="stats-table"
          v-if="statistics.by_subject && statistics.by_subject.length > 0"
        >
          <h4>按科目统计</h4>
          <el-table :data="statistics.by_subject" stripe border size="small">
            <el-table-column prop="subject_name" label="科目" width="120" />
            <el-table-column
              prop="exact_groups"
              label="完全重复组"
              width="140"
              align="center"
            />
            <el-table-column
              prop="similar_pairs"
              label="相似重复对"
              width="140"
              align="center"
            />
          </el-table>
        </div>
      </div>
    </div>

    <!-- Tab 切换：完全重复组和相似重复对 -->
    <el-tabs v-model="activeTab" class="detail-tabs">
      <!-- 完全重复组 -->
      <el-tab-pane label="完全重复组" name="exact">
        <div class="tab-content">
          <!-- 筛选工具栏 -->
          <div class="filter-bar">
            <el-form :inline="true" :model="exactFilterForm">
              <el-form-item label="题型">
                <el-select
                  v-model="exactFilterForm.group_type"
                  placeholder="全部"
                  clearable
                  style="width: 150px"
                >
                  <el-option label="单选题" value="1" />
                  <el-option label="多选题" value="2" />
                  <el-option label="判断题" value="3" />
                  <el-option label="填空题" value="4" />
                  <el-option label="计算分析题" value="8" />
                </el-select>
              </el-form-item>
              <el-form-item label="科目ID">
                <el-input-number
                  v-model="exactFilterForm.subject_id"
                  placeholder="科目ID"
                  :min="1"
                  clearable
                  style="width: 150px"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="fetchExactGroups"
                  >查询</el-button
                >
                <el-button @click="resetExactFilter">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 完全重复组列表 -->
          <el-table
            v-loading="loadingExactGroups"
            :data="exactGroups"
            stripe
            border
            class="data-table"
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column
              prop="question_count"
              label="题目数量"
              width="100"
              align="center"
            />
            <el-table-column prop="group.type_name" label="题型" width="120" />
            <el-table-column
              prop="group.subject_name"
              label="科目"
              width="120"
            />
            <el-table-column
              prop="group.channel_code"
              label="渠道代码"
              width="120"
            />
            <el-table-column
              prop="detected_at"
              label="检测时间"
              width="180"
              :formatter="formatDateColumn"
            />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  @click="handleViewExactGroup(row)"
                >
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-bar">
            <el-pagination
              v-model:current-page="exactPage"
              v-model:page-size="exactPageSize"
              :page-sizes="[10, 20, 50]"
              :total="exactTotal"
              layout="sizes, prev, pager, next, jumper, total"
              size="small"
              background
              @size-change="fetchExactGroups"
              @current-change="fetchExactGroups"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 相似重复对 -->
      <el-tab-pane label="相似重复对" name="similar">
        <div class="tab-content">
          <!-- 筛选工具栏 -->
          <div class="filter-bar">
            <el-form :inline="true" :model="similarFilterForm">
              <el-form-item label="题型">
                <el-select
                  v-model="similarFilterForm.group_type"
                  placeholder="全部"
                  clearable
                  style="width: 150px"
                >
                  <el-option label="单选题" value="1" />
                  <el-option label="多选题" value="2" />
                  <el-option label="判断题" value="3" />
                  <el-option label="填空题" value="4" />
                  <el-option label="计算分析题" value="8" />
                </el-select>
              </el-form-item>
              <el-form-item label="最小相似度">
                <el-input-number
                  v-model="similarFilterForm.min_similarity"
                  :min="0"
                  :max="1"
                  :step="0.05"
                  :precision="2"
                  placeholder="0.8"
                  style="width: 150px"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="fetchSimilarPairs"
                  >查询</el-button
                >
                <el-button @click="resetSimilarFilter">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 相似重复对列表 -->
          <el-table
            v-loading="loadingSimilarPairs"
            :data="similarPairs"
            stripe
            border
            class="data-table"
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column
              prop="question_id_1"
              label="题目ID1"
              width="100"
              align="center"
            />
            <el-table-column
              prop="question_id_2"
              label="题目ID2"
              width="100"
              align="center"
            />
            <el-table-column
              prop="similarity"
              label="相似度"
              width="100"
              align="center"
            >
              <template #default="{ row }">
                <el-tag :type="getSimilarityTagType(row.similarity)">
                  {{ (row.similarity * 100).toFixed(1) }}%
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="group.type_name" label="题型" width="120" />
            <el-table-column
              prop="group.subject_name"
              label="科目"
              width="120"
            />
            <el-table-column
              prop="group.channel_code"
              label="渠道代码"
              width="120"
            />
            <el-table-column
              prop="detected_at"
              label="检测时间"
              width="180"
              :formatter="formatDateColumn"
            />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  @click="handleViewSimilarPair(row)"
                >
                  查看详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-bar">
            <el-pagination
              v-model:current-page="similarPage"
              v-model:page-size="similarPageSize"
              :page-sizes="[10, 20, 50]"
              :total="similarTotal"
              layout="sizes, prev, pager, next, jumper, total"
              size="small"
              background
              @size-change="fetchSimilarPairs"
              @current-change="fetchSimilarPairs"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

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
      :pair-id="currentSimilarPairId"
      @close="handleSimilarPairDialogClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import {
  getDedupTaskDetail,
  getTaskStatistics,
  getExactGroups,
  getSimilarPairs,
  type DedupTask,
  type TaskStatus,
  type ExactDuplicateGroup,
  type SimilarDuplicatePair,
  type TaskStatistics,
} from "@/api/dedup";
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
const taskInfo = ref<DedupTask | null>(null);
const taskName = computed(() => taskInfo.value?.task_name || "");
const currentGroupInfo = ref<string>("");

// 统计信息
const loadingStatistics = ref(false);
const statistics = ref<TaskStatistics | null>(null);

// 完全重复组
const loadingExactGroups = ref(false);
const exactGroups = ref<ExactDuplicateGroup[]>([]);
const exactPage = ref(1);
const exactPageSize = ref(20);
const exactTotal = ref(0);
const exactFilterForm = ref({
  group_type: "",
  subject_id: undefined as number | undefined,
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

// Tab 切换
const activeTab = ref("exact");

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

const formatStatus = (status: TaskStatus | string) => {
  const statusMap: Record<string, { text: string; type: string }> = {
    pending: { text: "待处理", type: "info" },
    running: { text: "运行中", type: "warning" },
    completed: { text: "已完成", type: "success" },
    error: { text: "错误", type: "danger" },
    cancelled: { text: "已取消", type: "info" },
  };
  return statusMap[status] || { text: status, type: "info" };
};

const formatDateColumn = (row: any, column: any, cellValue: any) => {
  return formatDate(cellValue);
};

const getSimilarityTagType = (similarity: number) => {
  if (similarity >= 0.9) return "danger";
  if (similarity >= 0.8) return "warning";
  return "info";
};

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
  } catch (error: any) {
    ElMessage.error(error.message || "获取任务详情失败");
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
  } catch (error: any) {
    ElMessage.error(error.message || "获取统计信息失败");
  } finally {
    loadingStatistics.value = false;
  }
}

async function fetchExactGroups() {
  if (!taskId.value) return;
  loadingExactGroups.value = true;
  try {
    const params: any = {
      page: exactPage.value,
      page_size: exactPageSize.value,
    };
    if (exactFilterForm.value.group_type) {
      params.group_type = exactFilterForm.value.group_type;
    }
    if (exactFilterForm.value.subject_id) {
      params.subject_id = exactFilterForm.value.subject_id;
    }

    const response = await getExactGroups(taskId.value, params);
    if (response.success && response.data) {
      exactGroups.value = response.data.list || [];
      exactTotal.value = response.data.pagination?.total || 0;
    }
  } catch (error: any) {
    ElMessage.error(error.message || "获取完全重复组列表失败");
  } finally {
    loadingExactGroups.value = false;
  }
}

async function fetchSimilarPairs() {
  if (!taskId.value) return;
  loadingSimilarPairs.value = true;
  try {
    const params: any = {
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
  } catch (error: any) {
    ElMessage.error(error.message || "获取相似重复对列表失败");
  } finally {
    loadingSimilarPairs.value = false;
  }
}

// 对话框状态
const showExactGroupDialog = ref(false);
const showSimilarPairDialog = ref(false);
const currentExactGroupId = ref<number | undefined>();
const currentSimilarPairId = ref<number | undefined>();

function handleViewExactGroup(row: ExactDuplicateGroup) {
  currentExactGroupId.value = row.id;
  showExactGroupDialog.value = true;
}

function handleViewSimilarPair(row: SimilarDuplicatePair) {
  currentSimilarPairId.value = row.id;
  showSimilarPairDialog.value = true;
}

function handleExactGroupDialogClose() {
  showExactGroupDialog.value = false;
  currentExactGroupId.value = undefined;
}

function handleSimilarPairDialogClose() {
  showSimilarPairDialog.value = false;
  currentSimilarPairId.value = undefined;
}

function resetExactFilter() {
  exactFilterForm.value = {
    group_type: "",
    subject_id: undefined,
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

.task-info-card,
.statistics-card {
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
    }
  }
}

.detail-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

  .tab-content {
    padding-top: 16px;

    .filter-bar {
      margin-bottom: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 6px;
    }

    .data-table {
      margin-bottom: 16px;
    }

    .pagination-bar {
      display: flex;
      justify-content: flex-end;
      padding: 8px 0;
    }
  }
}
</style>
