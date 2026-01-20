<template>
  <section class="table-toolbar">
    <!-- 左侧操作按钮区 -->
    <div class="toolbar-left">
      <div class="btn-group-primary">
        <el-button type="primary" :icon="Plus" size="default" @click="emit('add')">
          添加
        </el-button>
        <el-button :icon="Edit" size="default" @click="emit('edit')">修改</el-button>
        <el-button :icon="Delete" size="default" @click="emit('del')">删除</el-button>
      </div>
      <el-divider direction="vertical" class="divider" />
      <div class="btn-group-secondary">
        <el-upload
          class="upload-btn"
          action=""
          accept=".xlsx,.xls"
          :show-file-list="false"
          :before-upload="beforeUpload"
        >
          <el-button :icon="Upload" size="default">导入</el-button>
        </el-upload>
        <el-button :icon="Download" size="default" @click="emit('export')">导出</el-button>
      </div>
    </div>

    <!-- 右侧搜索和设置区 -->
    <div class="toolbar-right">
      <!-- 搜索框 -->
      <div class="search-wrapper">
        <el-input
          v-model="keyword"
          :placeholder="placeholder"
          clearable
          class="search-input"
          size="default"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon class="search-icon"><Search /></el-icon>
          </template>
        </el-input>
        <el-button 
          type="primary" 
          :icon="Search" 
          size="default"
          class="search-btn"
          @click="handleSearch"
        >
          搜索
        </el-button>
      </div>

      <!-- 高级筛选按钮 -->
      <el-button 
        :icon="Filter" 
        size="default"
        :type="showAdv ? 'primary' : 'default'"
        class="filter-btn"
        @click="showAdv = !showAdv"
      >
        高级筛选
      </el-button>

      <!-- 列显隐选择器 -->
      <el-select
        v-model="checkedCols"
        multiple
        collapse-tags
        collapse-tags-tooltip
        placeholder="列设置"
        class="column-select"
        size="default"
        @change="handleColumnChange"
      >
        <template #prefix>
          <el-icon class="column-icon"><Setting /></el-icon>
        </template>
        <el-option
          v-for="c in allColumns"
          :key="c.prop"
          :label="c.label"
          :value="c.prop"
        >
          <div class="option-item">
            <span>{{ c.label }}</span>
            <span v-if="checkedCols.includes(c.prop)" class="check-badge">
              <el-icon class="check-icon"><Check /></el-icon>
            </span>
          </div>
        </el-option>
        <template #footer>
          <div class="select-footer">
            <el-button text size="small" @click="handleCheckAll(true)">全选</el-button>
            <el-button text size="small" @click="handleInvert">反选</el-button>
            <el-button text size="small" @click="handleCheckAll(false)">清空</el-button>
          </div>
        </template>
      </el-select>
    </div>
  </section>

  <!-- 高级搜索 -->
  <el-collapse-transition>
    <section v-show="showAdv" class="adv-panel">
      <el-form :model="advModel" label-width="100px" inline>
        <el-form-item v-for="c in allColumns" :key="c.prop" :label="c.label">
          <!-- select -->
          <el-select
            v-if="c.searchType === 'select'"
            v-model="advModel[c.prop]"
            clearable
            placeholder="请选择"
          >
            <el-option
              v-for="opt in c.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

          <!-- dateRange -->
          <el-date-picker
            v-else-if="c.searchType === 'dateRange'"
            v-model="advModel[c.prop]"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
          />

          <!-- date -->
          <el-date-picker
            v-else-if="c.searchType === 'date'"
            v-model="advModel[c.prop]"
            type="date"
            value-format="YYYY-MM-DD"
          />

          <!-- input -->
          <el-input
            v-else
            v-model="advModel[c.prop]"
            clearable
            :placeholder="`请输入 ${c.label}`"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleAdvSearch">查询</el-button>
          <el-button @click="resetAdv">重置</el-button>
          <el-button @click="resetAll">重置全部</el-button>
        </el-form-item>
      </el-form>
    </section>
  </el-collapse-transition>
</template>
  
  <script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import {
  Plus,
  Edit,
  Delete,
  Upload,
  Download,
  Search,
  Filter,
  Setting,
  Check,
} from "@element-plus/icons-vue";
import { useDebounceFn } from "@/utils/debounce";

/* ===== 类型 ===== */
interface IOption {
  label: string;
  value: string | number;
}
interface IColumn {
  label: string;
  prop: string;
  searchType?: "input" | "select" | "date" | "dateRange";
  options?: IOption[];
}

/* ===== props / emit ===== */
const props = withDefaults(
  defineProps<{
    placeholder?: string;
    columns: IColumn[];
    // 支持从父组件传入初始值
    modelKeyword?: string;
    modelAdvSearch?: Record<string, any>;
    modelCheckedColumns?: string[];
  }>(),
  { 
    placeholder: "请输入关键字",
    modelKeyword: "",
    modelAdvSearch: () => ({}),
    modelCheckedColumns: () => []
  }
);

const emit = defineEmits<{
  add: [];
  edit: [];
  del: [];
  import: [file: File];
  export: [];
  search: [kw: string];
  "update:modelKeyword": [kw: string];
  advSearch: [payload: Record<string, any>];
  "update:modelAdvSearch": [payload: Record<string, any>];
  columnChange: [visibleCols: string[]];
  "update:modelCheckedColumns": [visibleCols: string[]];
  reset: []; // 重置事件
}>();

/* ===== 普通搜索 ===== */
const keyword = ref(props.modelKeyword || "");
// 监听 props 变化，同步到内部状态
watch(() => props.modelKeyword, (val) => {
  if (val !== undefined && val !== keyword.value) {
    keyword.value = val;
  }
}, { immediate: true });
// 监听内部状态变化，同步到父组件
watch(keyword, (val) => {
  emit("update:modelKeyword", val);
});

/* ===== 高级搜索 ===== */
const showAdv = ref(false);
const advModel = reactive<Record<string, any>>({});

// 初始化高级搜索模型
function initAdvModel() {
  props.columns.forEach((c) => {
    if (props.modelAdvSearch && props.modelAdvSearch[c.prop] !== undefined) {
      advModel[c.prop] = props.modelAdvSearch[c.prop];
    } else {
      advModel[c.prop] = undefined;
    }
  });
}

// 监听 columns 变化，重新初始化
watch(
  () => props.columns,
  () => {
    initAdvModel();
  },
  { immediate: true }
);

// 监听父组件传入的 modelAdvSearch 变化
watch(
  () => props.modelAdvSearch,
  (val) => {
    if (val) {
      Object.keys(advModel).forEach((k) => {
        if (val[k] !== undefined) {
          advModel[k] = val[k];
        }
      });
    }
  },
  { deep: true }
);

function handleAdvSearch() {
  const payload = { ...advModel };
  emit("advSearch", payload);
  emit("update:modelAdvSearch", payload);
}

function resetAdv() {
  Object.keys(advModel).forEach((k) => (advModel[k] = undefined));
  emit("update:modelAdvSearch", {});
  emit("advSearch", {});
}

// 重置所有筛选条件
function resetAll() {
  keyword.value = "";
  resetAdv();
  emit("reset");
}

/* ===== 列显隐 ===== */
const allColumns = computed(() => props.columns);
const checkedCols = ref<string[]>(
  props.modelCheckedColumns && props.modelCheckedColumns.length > 0
    ? [...props.modelCheckedColumns]
    : props.columns.map((c) => c.prop)
);

// 监听 props 变化
watch(
  () => props.modelCheckedColumns,
  (val) => {
    if (val && val.length > 0 && JSON.stringify(val) !== JSON.stringify(checkedCols.value)) {
      checkedCols.value = [...val];
    }
  },
  { immediate: true, deep: true }
);

// 监听 columns 变化，更新 checkedCols
watch(
  allColumns,
  (cols) => {
    // 如果父组件没有传入初始值，则默认全选
    if (!props.modelCheckedColumns || props.modelCheckedColumns.length === 0) {
      checkedCols.value = cols.map((c) => c.prop);
    }
  },
  { immediate: true }
);

// 列显隐变化处理
function handleColumnChange(val: string[]) {
  checkedCols.value = val;
  emit("columnChange", [...val]);
  emit("update:modelCheckedColumns", [...val]);
}


// 监听内部状态变化，同步到父组件
watch(
  checkedCols,
  (v) => {
    emit("columnChange", [...v]);
    emit("update:modelCheckedColumns", [...v]);
  },
  { deep: true }
);


/* 列显隐 – 全选 / 反选 / 清空 */
function handleCheckAll(checked: boolean) {
  checkedCols.value = checked ? allColumns.value.map((c) => c.prop) : [];
}
function handleInvert() {
  const set = new Set(checkedCols.value);
  checkedCols.value = allColumns.value
    .map((c) => c.prop)
    .filter((p) => !set.has(p));
}

/* ===== 普通搜索处理（带防抖） ===== */
const debouncedSearch = useDebounceFn(() => {
  emit("search", keyword.value);
}, 300);

function handleSearch() {
  debouncedSearch();
}

/* ===== 导入 ===== */
function beforeUpload(file: File) {
  emit("import", file);
  return false;
}

// 暴露重置方法给父组件
defineExpose({
  resetAll,
  resetAdv,
  keyword,
  advModel,
  checkedCols,
});
</script>
  
  <style scoped lang="scss">
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: nowrap;
}

/* 左侧操作区 */
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;

  .btn-group-primary,
  .btn-group-secondary {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .divider {
    height: 24px;
    margin: 0;
    border-color: #e4e7ed;
  }

  .upload-btn {
    display: inline-block;
  }
}

/* 右侧搜索和设置区 */
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: flex-end;
  min-width: 0;

  .search-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    max-width: 400px;
    min-width: 200px;

    .search-input {
      flex: 1;
      min-width: 180px;

      :deep(.el-input__wrapper) {
        padding-left: 12px;
        padding-right: 12px;
      }

      :deep(.el-input__prefix) {
        left: 12px;
        width: auto;
      }

      .search-icon {
        color: #909399;
        font-size: 16px;
        margin-right: 8px;
      }
    }

    .search-btn {
      flex-shrink: 0;
    }
  }

  .filter-btn {
    flex-shrink: 0;
    transition: all 0.3s;
  }

  .column-select {
    width: 140px;
    flex-shrink: 0;

    .column-icon {
      color: #909399;
      font-size: 16px;
    }

    :deep(.el-select__tags) {
      max-width: calc(100% - 30px);
    }
  }
}

/* 下拉选项样式 */
:deep(.el-select-dropdown__item) {
  // 隐藏默认的checkbox
  .el-checkbox {
    display: none;
  }
  
  // 调整选项内容布局
  .option-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-left: 0;

    .check-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      background-color: var(--el-color-primary);
      border-radius: 50%;
      flex-shrink: 0;

      .check-icon {
        color: #fff;
        font-size: 12px;
        font-weight: bold;
      }
    }
  }
}

/* 高级搜索面板 */
.adv-panel {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 16px;
  border: 1px solid #e4e7ed;

  :deep(.el-form) {
    .el-form-item {
      margin-bottom: 16px;
    }
  }
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .toolbar-right {
    .search-wrapper {
      max-width: 300px;
    }
  }
}

@media (max-width: 768px) {
  .table-toolbar {
    flex-wrap: wrap;
    padding: 12px;
  }

  .toolbar-left {
    width: 100%;
    justify-content: space-between;
  }

  .toolbar-right {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>