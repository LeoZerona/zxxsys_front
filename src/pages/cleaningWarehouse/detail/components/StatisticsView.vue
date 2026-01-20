<template>
  <div
    class="statistics-card"
    v-loading="loading"
    v-if="statistics"
  >
    <div class="card-header">
      <h3>统计信息</h3>
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

      <el-tabs
        v-model="localActiveTab"
        type="card"
        class="stat-tabs"
        v-if="localViewMode === 'table' || localViewMode === 'chart'"
      >
        <!-- 按题型统计 -->
        <el-tab-pane label="按题型统计" name="type">
          <div class="stat-content">
            <!-- 表格视图 -->
            <div
              v-show="localViewMode === 'table'"
              class="stat-table-section"
              v-if="statistics.by_type && statistics.by_type.length > 0"
            >
              <el-table
                :data="statistics.by_type"
                stripe
                border
                size="small"
                style="width: 100%"
                empty-text="暂无统计数据"
              >
                <el-table-column
                  prop="type_name"
                  label="题型"
                  width="150"
                />
                <el-table-column
                  prop="exact_groups"
                  label="完全重复组"
                  width="150"
                  align="right"
                >
                  <template #default="{ row }">
                    <span class="stat-number">{{
                      row.exact_groups.toLocaleString()
                    }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="similar_pairs"
                  label="相似重复对"
                  width="150"
                  align="right"
                >
                  <template #default="{ row }">
                    <span class="stat-number">{{
                      row.similar_pairs.toLocaleString()
                    }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="总计" width="150" align="right">
                  <template #default="{ row }">
                    <span class="stat-number">{{
                      (
                        row.exact_groups + row.similar_pairs
                      ).toLocaleString()
                    }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 图表视图 -->
            <div
              v-show="localViewMode === 'chart'"
              class="stat-chart-section"
              v-if="statistics.by_type && statistics.by_type.length > 0"
            >
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
            <div
              v-show="localViewMode === 'table'"
              class="stat-table-section"
              v-if="
                statistics.by_subject && statistics.by_subject.length > 0
              "
            >
              <el-table
                :data="statistics.by_subject"
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
                  prop="exact_groups"
                  label="完全重复组"
                  width="150"
                  align="right"
                >
                  <template #default="{ row }">
                    <span class="stat-number">{{
                      row.exact_groups.toLocaleString()
                    }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="similar_pairs"
                  label="相似重复对"
                  width="150"
                  align="right"
                >
                  <template #default="{ row }">
                    <span class="stat-number">{{
                      row.similar_pairs.toLocaleString()
                    }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="总计" width="150" align="right">
                  <template #default="{ row }">
                    <span class="stat-number">{{
                      (
                        row.exact_groups + row.similar_pairs
                      ).toLocaleString()
                    }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 图表视图 -->
            <div
              v-show="localViewMode === 'chart'"
              class="stat-chart-section"
              v-if="
                statistics.by_subject && statistics.by_subject.length > 0
              "
            >
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
import type { TaskStatistics } from "@/api/dedup";
import { createTypePieChart, createSubjectBarChart } from "@/utils/chartConfig";

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
  statistics: TaskStatistics | null;
  loading?: boolean;
  viewMode?: "table" | "chart";
  activeTab?: "type" | "subject";
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
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

// 题型统计图表配置
const typeChartOption = computed(() => {
  if (!props.statistics?.by_type || props.statistics.by_type.length === 0) {
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

  return createTypePieChart(props.statistics.by_type, {
    title: "题型分布",
    seriesName: "重复数据",
    showExactGroups: true,
  });
});

// 科目统计图表配置
const subjectChartOption = computed(() => {
  if (!props.statistics?.by_subject || props.statistics.by_subject.length === 0) {
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

  return createSubjectBarChart(props.statistics.by_subject, {
    title: "科目分布",
    seriesName: "重复数据",
    showExactGroups: true,
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

