<template>
  <div
    class="statistics-panel"
    v-loading="loading"
  >
    <div class="panel-header">
      <h3 class="panel-title">数据统计</h3>
      <div class="view-switcher">
        <el-radio-group v-model="localViewMode" size="small">
          <el-radio-button label="table">
            <el-icon><Document /></el-icon>
            <span>表格</span>
          </el-radio-button>
          <el-radio-button label="chart">
            <el-icon><PieChartIcon /></el-icon>
            <span>图表</span>
          </el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-tabs v-model="localActiveTab" type="card" class="stat-tabs">
      <!-- 按题型统计 -->
      <el-tab-pane label="按题型统计" name="type">
        <div class="stat-content">
          <!-- 表格视图 -->
          <div v-show="localViewMode === 'table'" class="stat-table-section">
            <el-table
              :data="typeStatistics"
              stripe
              border
              size="small"
              style="width: 100%"
              empty-text="暂无统计数据"
            >
              <el-table-column prop="type_name" label="题型" width="150" />
              <el-table-column
                prop="count"
                label="题目数量"
                width="150"
                align="right"
              >
                <template #default="{ row }">
                  <span class="stat-number">{{
                    row.count.toLocaleString()
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column label="占比" width="150" align="right">
                <template #default="{ row }">
                  <span class="stat-percentage">
                    {{ getPercentage(row.count, totalCount) }}%
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="进度条" min-width="200">
                <template #default="{ row }">
                  <el-progress
                    :percentage="getPercentage(row.count, totalCount)"
                    :color="getTypeColor(row.type || '')"
                    :stroke-width="20"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 图表视图 -->
          <div v-show="localViewMode === 'chart'" class="stat-chart-section">
            <div class="chart-container">
              <v-chart
                :option="typeChartOption"
                :loading="loading"
                autoresize
                class="chart-wrapper"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 按科目统计 -->
      <el-tab-pane label="按科目统计" name="subject">
        <div class="stat-content">
          <!-- 表格视图 -->
          <div v-show="localViewMode === 'table'" class="stat-table-section">
            <el-table
              :data="subjectStatistics"
              stripe
              border
              size="small"
              style="width: 100%"
              empty-text="暂无统计数据"
            >
              <el-table-column
                prop="subject_name"
                label="科目"
                width="200"
              />
              <el-table-column
                prop="count"
                label="题目数量"
                width="150"
                align="right"
              >
                <template #default="{ row }">
                  <span class="stat-number">{{
                    row.count.toLocaleString()
                  }}</span>
                </template>
              </el-table-column>
              <el-table-column label="占比" width="150" align="right">
                <template #default="{ row }">
                  <span class="stat-percentage">
                    {{ getPercentage(row.count, totalCount) }}%
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="进度条" min-width="200">
                <template #default="{ row }">
                  <el-progress
                    :percentage="getPercentage(row.count, totalCount)"
                    :color="getSubjectColor(row.subject_id, row.subject_name)"
                    :stroke-width="20"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 图表视图 -->
          <div v-show="localViewMode === 'chart'" class="stat-chart-section">
            <div class="chart-container">
              <v-chart
                :option="subjectChartOption"
                :loading="loading"
                autoresize
                class="chart-wrapper"
              />
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { Document, PieChart as PieChartIcon } from "@element-plus/icons-vue";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { PieChart, BarChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
} from "echarts/components";
import VChart from "vue-echarts";
import type { StatisticsItem } from "@/api/question";
import { createTypePieChart, createSubjectBarChart } from "@/utils/chartConfig";
import { getTypeColor, getSubjectColor } from "@/constants";

// 注册 ECharts 组件
use([
  CanvasRenderer,
  PieChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
]);

interface Props {
  loading: boolean;
  typeStatistics: StatisticsItem[];
  subjectStatistics: StatisticsItem[];
  totalCount: number;
  viewMode?: "table" | "chart";
  activeTab?: "type" | "subject";
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: "table",
  activeTab: "type",
});

const emit = defineEmits<{
  "update:viewMode": [value: "table" | "chart"];
  "update:activeTab": [value: "type" | "subject"];
}>();

const localViewMode = computed({
  get: () => props.viewMode,
  set: (val) => emit("update:viewMode", val),
});

const localActiveTab = computed({
  get: () => props.activeTab,
  set: (val) => emit("update:activeTab", val),
});

// 计算百分比
function getPercentage(count: number, total: number): number {
  if (!total || total === 0) return 0;
  return Number(((count / total) * 100).toFixed(2));
}

// 题型统计图表配置
const typeChartOption = computed(() => {
  if (!props.typeStatistics || props.typeStatistics.length === 0) {
    return {
      title: {
        text: "暂无数据",
        left: "center",
        top: "middle",
        textStyle: {
          color: "#909399",
          fontSize: 16,
        },
      },
    };
  }

  return createTypePieChart(props.typeStatistics, {
    title: "题型分布",
    seriesName: "题目数量",
    showExactGroups: false,
  });
});

// 科目统计图表配置
const subjectChartOption = computed(() => {
  if (!props.subjectStatistics || props.subjectStatistics.length === 0) {
    return {
      title: {
        text: "暂无数据",
        left: "center",
        top: "middle",
        textStyle: {
          color: "#909399",
          fontSize: 16,
        },
      },
    };
  }

  return createSubjectBarChart(props.subjectStatistics, {
    title: "科目分布",
    seriesName: "题目数量",
    total: props.totalCount,
    showExactGroups: false,
    getPercentage: (count: number, total: number) => {
      return getPercentage(count, total);
    },
  });
});

// 监听视图模式切换，确保图表正确显示
watch(
  [localViewMode, localActiveTab],
  async () => {
    if (localViewMode.value === "chart") {
      await nextTick();
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 100);
    }
  },
  { immediate: false }
);
</script>

<style lang="scss" scoped>
.statistics-panel {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: visible;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f0f2f5;
    flex-shrink: 0;

    .panel-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
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

  .stat-tabs {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;

    :deep(.el-tabs__header) {
      margin-bottom: 20px;
      flex-shrink: 0;
    }

    :deep(.el-tabs__item) {
      font-size: 14px;
      font-weight: 500;
    }

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
    min-height: 300px;
  }

  .stat-table-section {
    width: 100%;

    :deep(.el-table) {
      border-radius: 6px;
      overflow: hidden;
      width: 100%;
    }

    :deep(.el-table__body-wrapper) {
      max-height: none;
    }

    .stat-number {
      font-weight: 600;
      color: #303133;
      font-size: 14px;
    }

    .stat-percentage {
      font-weight: 600;
      color: #409eff;
      font-size: 14px;
    }

    :deep(.el-progress) {
      .el-progress-bar__outer {
        border-radius: 10px;
        background-color: #f0f2f5;
      }

      .el-progress-bar__inner {
        border-radius: 10px;
      }
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
</style>

