<template>
  <section class="table-toolbar">
    <!-- 左侧按钮群 -->
    <article class="toolbar-btn-group">
      <el-button type="primary" :icon="Plus" @click="emit('add')"
        >添加</el-button
      >
      <el-button :icon="Edit" @click="emit('edit')">修改</el-button>
      <el-button :icon="Delete" @click="emit('del')">删除</el-button>

      <el-upload
        class="upload-btn"
        action=""
        accept=".xlsx,.xls"
        :show-file-list="false"
        :before-upload="beforeUpload"
      >
        <el-button :icon="Upload">导入</el-button>
      </el-upload>

      <el-button :icon="Download" @click="emit('export')">导出</el-button>
    </article>

    <!-- 右侧搜索区 -->
    <article class="toolbar-search-group">
      <el-input
        v-model="keyword"
        :placeholder="placeholder"
        clearable
        class="search-input"
        @keyup.enter="emit('search', keyword)"
      >
        <template #append>
          <el-button :icon="Search" @click="emit('search', keyword)" />
        </template>
      </el-input>

      <el-button :icon="Filter" circle @click="showAdv = !showAdv" />

      <!-- 列显隐 – el-select 多选 -->
      <el-select
        v-model="checkedCols"
        multiple
        collapse-tags
        collapse-tags-tooltip
        placeholder="显示字段"
        class="column-select"
        @change="emit('columnChange', checkedCols)"
      >
        <template #prefix>
          <el-icon><View /></el-icon>
        </template>

        <el-option
          v-for="c in allColumns"
          :key="c.prop"
          :label="c.label"
          :value="c.prop"
        >
          <span>{{ c.label }}</span>
          <el-tag v-if="checkedCols.includes(c.prop)" size="small" round
            >✓</el-tag
          >
        </el-option>

        <template #footer>
          <div class="select-footer">
            <el-button text @click="handleCheckAll(true)">全选</el-button>
            <el-button text @click="handleInvert">反选</el-button>
            <el-button text @click="handleCheckAll(false)">清空</el-button>
          </div>
        </template>
      </el-select>
    </article>
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
  View,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

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
  }>(),
  { placeholder: "请输入关键字" }
);

const emit = defineEmits<{
  add: [];
  edit: [];
  del: [];
  import: [file: File];
  export: [];
  search: [kw: string];
  advSearch: [payload: Record<string, any>];
  columnChange: [visibleCols: string[]];
}>();

/* ===== 普通搜索 ===== */
const keyword = ref("");

/* ===== 高级搜索 ===== */
const showAdv = ref(false);
const advModel = reactive<Record<string, any>>({});
watch(
  () => props.columns,
  (cols) => cols.forEach((c) => (advModel[c.prop] = undefined)),
  { immediate: true }
);
function handleAdvSearch() {
  emit("advSearch", { ...advModel });
}
function resetAdv() {
  Object.keys(advModel).forEach((k) => (advModel[k] = undefined));
}

/* ===== 列显隐 ===== */
const allColumns = computed(() => props.columns);
const checkedCols = ref<string[]>([]);
watch(allColumns, (cols) => (checkedCols.value = cols.map((c) => c.prop)), {
  immediate: true,
});
watch(checkedCols, (v) => emit("columnChange", v));

const checkAll = computed({
  get: () =>
    checkedCols.value.length > 0 &&
    checkedCols.value.length === allColumns.value.length,
  set: (val) => handleCheckAll(val),
});
const isInd = computed(
  () =>
    checkedCols.value.length > 0 &&
    checkedCols.value.length < allColumns.value.length
);
// function handleCheckAll(val: boolean) {
//   checkedCols.value = val ? allColumns.value.map((c) => c.prop) : [];
// }
// function handleInvert() {
//   const set = new Set(checkedCols.value);
//   checkedCols.value = allColumns.value
//     .map((c) => c.prop)
//     .filter((p) => !set.has(p));
// }

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
const dropVisible = ref(false);

/* ===== 导入 ===== */
function beforeUpload(file: File) {
  emit("import", file);
  return false;
}
</script>
  
  <style scoped lang="scss">
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 12px;
}

.toolbar-btn-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.upload-btn {
  display: inline-block;
}

.toolbar-search-group {
  display: flex;
  gap: 8px;
  align-items: center;
  .search-input {
    width: 240px;
  }
}

/* 列显隐下拉 */
.column-drop {
  .active {
    color: var(--el-color-primary);
    transform: rotate(180deg);
    transition: transform 0.2s;
  }
}
.column-menu {
  padding: 8px 12px;
  width: 220px;
  .menu-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .column-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 260px;
    overflow-y: auto;
    .column-item {
      width: 100%;
      height: 32px;
      line-height: 32px;
    }
  }
}

/* 高级搜索 */
.adv-panel {
  background: #fafbfc;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
}

/* 让 el-select 宽度更紧凑 */
.column-select {
  width: 180px;
  .el-icon {
    margin-right: 4px;
  }
  .el-tag {
    margin-left: auto;
  }
}

/* 底部按钮栏 */
.select-footer {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>