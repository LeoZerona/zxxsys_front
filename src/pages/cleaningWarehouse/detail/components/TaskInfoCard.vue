<template>
  <div class="task-info-card" v-loading="loading">
    <div class="card-header">
      <div class="title-wrapper">
        <h3>任务信息</h3>
        <el-tag :type="statusConfig.type" size="large">
          {{ statusConfig.text }}
        </el-tag>
      </div>
      <div class="actions">
        <el-tooltip
          content="仅已完成的任务支持二次验证"
          placement="left"
          v-if="!canReverify"
        >
          <span>
            <el-button
              type="primary"
              size="small"
              :disabled="!canReverify || loading"
            >
              二次验证
            </el-button>
          </span>
        </el-tooltip>
        <el-button
          v-else
          type="primary"
          size="small"
          :loading="reverifyLoading"
          @click="handleReverify"
        >
          二次验证
        </el-button>
      </div>
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
          <span class="value">{{ taskInfo.progress_percentage.toFixed(1) }}%</span>
        </div>
      </div>
      <!-- 进度条和当前处理信息 -->
      <div class="info-row" v-if="taskInfo.status === 'running'">
        <div class="info-item full-width">
          <div class="progress-info">
            <div class="progress-label">
              <span>处理进度：</span>
              <span class="progress-text">
                {{ taskInfo.processed_groups }} / {{ taskInfo.total_groups }} 分组
              </span>
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
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DedupTask } from "@/api/dedup";
import { formatDate, formatTaskDetailStatus } from "@/utils/formatters";

interface Props {
  taskInfo: DedupTask | null;
  loading?: boolean;
  currentGroupInfo?: string;
  // 二次验证加载状态，由父组件控制
  reverifyLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  currentGroupInfo: "",
  reverifyLoading: false,
});

const statusConfig = computed(() => {
  return formatTaskDetailStatus(props.taskInfo?.status || "");
});

const emit = defineEmits<{
  (e: "reverify"): void;
}>();

// 只有任务完成状态才允许二次验证
const canReverify = computed(() => props.taskInfo?.status === "completed");

function handleReverify() {
  if (!canReverify.value || props.loading || props.reverifyLoading) return;
  emit("reverify");
}
</script>

<style lang="scss" scoped>
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
    gap: 16px;

    .title-wrapper {
      display: flex;
      align-items: center;
      gap: 12px;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
        color: #303133;
      }
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
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
  }
}
</style>

