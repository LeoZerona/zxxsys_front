<template>
  <div class="data-view">
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
                  <el-option
                    v-for="type in questionTypeOptions"
                    :key="type.value"
                    :label="type.label"
                    :value="type.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="科目">
                <el-select
                  v-model="exactFilterForm.subject_id"
                  placeholder="全部"
                  clearable
                  style="width: 150px"
                >
                  <el-option
                    v-for="subject in subjectOptions"
                    :key="subject.id"
                    :label="subject.name"
                    :value="subject.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="题目数量">
                <el-input-number
                  v-model="exactFilterForm.question_count"
                  placeholder="题目数量"
                  :min="1"
                  clearable
                  style="width: 150px"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleFetchExactGroups"
                  >查询</el-button
                >
                <el-button @click="handleResetExactFilter">重置</el-button>
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
            <el-table-column
              type="index"
              label="序号"
              width="80"
              align="center"
              :index="(index) => (exactPage - 1) * exactPageSize + index + 1"
            />
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
              :current-page="exactPage"
              :page-size="exactPageSize"
              :page-sizes="[10, 20, 50]"
              :total="exactTotal"
              layout="sizes, prev, pager, next, jumper, total"
              size="small"
              background
              @size-change="handleExactPageSizeChange"
              @current-change="handleExactPageChange"
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
                  <el-option
                    v-for="type in questionTypeOptions"
                    :key="type.value"
                    :label="type.label"
                    :value="type.value"
                  />
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
                <el-button type="primary" @click="handleFetchSimilarPairs"
                  >查询</el-button
                >
                <el-button @click="handleResetSimilarFilter">重置</el-button>
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
            <el-table-column
              type="index"
              label="序号"
              width="80"
              align="center"
              :index="
                (index) => (similarPage - 1) * similarPageSize + index + 1
              "
            />
            <el-table-column
              prop="question_id"
              label="主题ID"
              width="100"
              align="center"
            />
            <el-table-column label="重复对ID" width="150" align="center">
              <template #default="{ row }">
                {{
                  row.duplicates
                    ? row.duplicates
                        .map((item: any) => item.pair_id)
                        .filter((id: any) => id != null)
                        .join(", ")
                    : "-"
                }}
              </template>
            </el-table-column>
            <el-table-column label="重复题ID" width="150" align="center">
              <template #default="{ row }">
                {{
                  row.duplicates
                    ? row.duplicates
                        .map((item: any) => item.question_id)
                        .filter((id: any) => id != null)
                        .join(", ")
                    : "-"
                }}
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
              :current-page="similarPage"
              :page-size="similarPageSize"
              :page-sizes="[10, 20, 50]"
              :total="similarTotal"
              layout="sizes, prev, pager, next, jumper, total"
              size="small"
              background
              @size-change="handleSimilarPageSizeChange"
              @current-change="handleSimilarPageChange"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { ExactDuplicateGroup, SimilarDuplicatePair } from "@/api/dedup";
import { QUESTION_TYPE_OPTIONS } from "@/constants/questionTypes";
import { formatDateColumn, getSimilarityTagType } from "@/utils/formatters";

interface Props {
  taskId: number;
  subjectOptions: Array<{ id: number; name: string }>;
  exactGroups: ExactDuplicateGroup[];
  loadingExactGroups: boolean;
  exactPage: number;
  exactPageSize: number;
  exactTotal: number;
  exactFilterForm: {
    group_type: string;
    subject_id?: number;
    question_count?: number;
  };
  similarPairs: SimilarDuplicatePair[];
  loadingSimilarPairs: boolean;
  similarPage: number;
  similarPageSize: number;
  similarTotal: number;
  similarFilterForm: {
    group_type: string;
    min_similarity?: number;
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "fetch-exact-groups": [];
  "reset-exact-filter": [];
  "fetch-similar-pairs": [];
  "reset-similar-filter": [];
  "view-exact-group": [group: ExactDuplicateGroup];
  "view-similar-pair": [pair: SimilarDuplicatePair];
  "exact-page-change": [page: number];
  "exact-page-size-change": [size: number];
  "similar-page-change": [page: number];
  "similar-page-size-change": [size: number];
}>();

const activeTab = ref("exact");

// 题型选项
const questionTypeOptions = computed(() => {
  return QUESTION_TYPE_OPTIONS.filter((type) => type.value !== "");
});

// 事件处理
function handleFetchExactGroups() {
  emit("fetch-exact-groups");
}

function handleResetExactFilter() {
  emit("reset-exact-filter");
}

function handleFetchSimilarPairs() {
  emit("fetch-similar-pairs");
}

function handleResetSimilarFilter() {
  emit("reset-similar-filter");
}

function handleViewExactGroup(row: ExactDuplicateGroup) {
  emit("view-exact-group", row);
}

function handleViewSimilarPair(row: SimilarDuplicatePair) {
  emit("view-similar-pair", row);
}

function handleExactPageChange(page: number) {
  emit("exact-page-change", page);
  emit("fetch-exact-groups");
}

function handleExactPageSizeChange(size: number) {
  emit("exact-page-size-change", size);
  emit("fetch-exact-groups");
}

function handleSimilarPageChange(page: number) {
  emit("similar-page-change", page);
  emit("fetch-similar-pairs");
}

function handleSimilarPageSizeChange(size: number) {
  emit("similar-page-size-change", size);
  emit("fetch-similar-pairs");
}
</script>

<style lang="scss" scoped>
.data-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
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
</style>
