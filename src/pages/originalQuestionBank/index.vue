<template>
  <div class="qbank-table">
    <!-- 工具栏 -->
    <el-row class="toolbar" align="middle">
      <el-col :span="16">
        <el-button type="primary" :icon="Plus" @click="onAdd">添加</el-button>
        <el-button
          type="warning"
          :icon="Edit"
          :disabled="singleSelect"
          @click="onEdit"
          >修改</el-button
        >
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="multiSelect"
          @click="onDelete"
          >删除</el-button
        >

        <el-upload
          style="display: inline-block; margin: 0 8px"
          accept=".xlsx,.xls"
          :show-file-list="false"
          :before-upload="beforeUpload"
        >
          <el-button type="info" :icon="Upload">批量导入</el-button>
        </el-upload>

        <el-button type="success" :icon="Download" @click="onExport"
          >导出 Excel</el-button
        >

        <el-button text :icon="Search" @click="toggleSearch">{{
          showSearch ? "收起" : "高级搜索"
        }}</el-button>
      </el-col>

      <el-col :span="8" style="text-align: right">
        <el-select
          v-model="showCols"
          multiple
          collapse-tags
          placeholder="显示列"
          style="width: 220px"
        >
          <el-option
            v-for="c in allColumns"
            :key="c.prop"
            :label="c.label"
            :value="c.prop"
          />
        </el-select>
      </el-col>
    </el-row>

    <!-- 普通搜索 -->
    <el-row v-if="!showSearch" style="margin: 12px 0">
      <el-input
        v-model="keyword"
        placeholder="请输入题库名称关键字"
        clearable
        style="width: 260px"
        @keyup.enter="loadData"
      />
      <el-button type="primary" style="margin-left: 8px" @click="loadData"
        >搜索</el-button
      >
    </el-row>

    <!-- 高级搜索 -->
    <el-card v-if="showSearch" shadow="never" style="margin-bottom: 12px">
      <el-form :model="searchForm" label-width="100px">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="题库名称">
              <el-input
                v-model="searchForm.name"
                clearable
                placeholder="模糊匹配"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="创建日期">
              <el-date-picker
                v-model="searchForm.createDate"
                type="daterange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="题目数量">
              <el-input-number
                v-model="searchForm.count"
                :min="0"
                placeholder="精确值"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <div style="text-align: right">
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="primary" @click="loadData">查询</el-button>
        </div>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="tableData"
      stripe
      border
      @selection-change="onSelectChange"
    >
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column
        v-for="c in renderColumns"
        :key="c.prop"
        :prop="c.prop"
        :label="c.label"
        :width="c.width"
        align="center"
      >
        <template v-if="c.prop === 'createDate'" #default="scope">
          {{ $filters.date(scope.row.createDate) }}
        </template>
        <template v-if="c.prop === 'storage'" #default="scope">
          {{ formatSize(scope.row.storage) }}
        </template>
        <template v-if="c.prop === 'count'" #default="scope">
          {{ scope.row.count }} 道
        </template>
      </el-table-column>

      <el-table-column label="操作" width="120" align="center">
        <template #default="scope">
          <el-button text type="primary" @click="onView(scope.row)"
            >查看</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="page.current"
      v-model:page-size="page.size"
      :total="page.total"
      layout="total,prev,pager,next"
      style="margin-top: 12px; text-align: right"
      @current-change="loadData"
    />

    <!-- 新增 / 修改 Dialog -->
    <el-dialog
      v-model="dialog"
      :title="isAdd ? '新增题库' : '修改题库'"
      width="420px"
      append-to-body
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
        style="padding-right: 24px"
      >
        <el-form-item label="题库名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="创建日期" prop="createDate">
          <el-date-picker
            v-model="form.createDate"
            type="date"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="占用空间" prop="storage">
          <el-input-number
            v-model="form.storage"
            :min="0"
            :step="1024"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="题目数量" prop="count">
          <el-input-number v-model="form.count" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
  
  <script setup lang="ts">
import { ref, reactive, computed, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Edit,
  Delete,
  Upload,
  Download,
  Search,
} from "@element-plus/icons-vue";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { UploadRawFile } from "element-plus";

/* --------------------- 数据 --------------------- */
interface Row {
  id: number;
  name: string;
  createDate: string | Date;
  storage: number /* 单位 byte */;
  count: number;
}

const loading = ref(false);
const tableData = ref<Row[]>([]);
const selected = ref<Row[]>([]);

const page = reactive({ current: 1, size: 10, total: 0 });

const keyword = ref("");
const showSearch = ref(false);
const searchForm = reactive({
  name: "",
  createDate: [],
  count: undefined as number | undefined,
});

const showCols = ref(["name", "createDate", "storage", "count"]);

const allColumns = [
  { label: "题库名称", prop: "name", width: 160 },
  { label: "创建日期", prop: "createDate", width: 140 },
  { label: "题库空间", prop: "storage", width: 120 },
  { label: "题目数量", prop: "count", width: 100 },
];

const renderColumns = computed(() =>
  allColumns.filter((c) => showCols.value.includes(c.prop))
);

/* --------------------- 弹窗表单 --------------------- */
const dialog = ref(false);
const isAdd = ref(true);
const form = reactive<Partial<Row>>({});
const formRef = ref();
const rules = {
  name: [{ required: true, message: "请输入题库名称", trigger: "blur" }],
  createDate: [{ required: true, message: "请选择日期", trigger: "change" }],
  storage: [{ required: true, message: "请输入占用空间", trigger: "blur" }],
  count: [{ required: true, message: "请输入题目数量", trigger: "blur" }],
};

/* --------------------- 计算 --------------------- */
const singleSelect = computed(() => selected.value.length !== 1);
const multiSelect = computed(() => selected.value.length === 0);

/* --------------------- 方法 --------------------- */
const loadData = async () => {
  loading.value = true;
  // 模拟接口
  setTimeout(() => {
    const base: Row[] = Array.from({ length: 28 }, (_, i) => ({
      id: i + 1,
      name: `题库${i + 1}`,
      createDate: new Date(2025, 10, i + 1).toISOString(),
      storage: 1024 * 1024 * (Math.random() * 100).toFixed(2),
      count: Math.floor(Math.random() * 500),
    }));
    tableData.value = base.slice(
      (page.current - 1) * page.size,
      page.current * page.size
    );
    page.total = base.length;
    loading.value = false;
  }, 300);
};
loadData();

const onSelectChange = (rows: Row[]) => (selected.value = rows);

const toggleSearch = () => (showSearch.value = !showSearch.value);

const resetSearch = () => {
  Object.assign(searchForm, {
    name: "",
    createDate: [],
    count: undefined,
  });
  loadData();
};

/* 新增 / 修改 */
const onAdd = () => {
  isAdd.value = true;
  Object.assign(form, {});
  dialog.value = true;
  nextTick(() => formRef.value.clearValidate());
};
const onEdit = () => {
  isAdd.value = false;
  Object.assign(form, JSON.parse(JSON.stringify(selected.value[0])));
  dialog.value = true;
};
const submit = () => {
  formRef.value.validate((valid: boolean) => {
    if (!valid) return;
    ElMessage.success(isAdd.value ? "添加成功" : "修改成功");
    dialog.value = false;
    loadData();
  });
};

/* 删除 */
const onDelete = () => {
  ElMessageBox.confirm("确认删除选中数据？", "提示").then(() => {
    ElMessage.success("删除成功");
    loadData();
  });
};

/* 导出 */
const onExport = () => {
  const sheet = XLSX.utils.json_to_bytes(
    tableData.value.map((r) => ({
      题库名称: r.name,
      创建日期: (r.createDate as Date).toLocaleDateString(),
      题库空间: formatSize(r.storage),
      题目数量: r.count,
    }))
  );
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "题库");
  const blob = new Blob(
    [XLSX.write(book, { bookType: "xlsx", type: "array" })],
    {
      type: "application/octet-stream",
    }
  );
  saveAs(blob, `题库列表_${new Date().toLocaleDateString()}.xlsx`);
};

/* 批量导入 */
const beforeUpload = (file: UploadRawFile) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const wb = XLSX.read(e.target!.result, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const arr = XLSX.utils.sheet_to_json(sheet) as any[];
    // 仅演示：把第一行打印
    console.log("导入数据", arr);
    ElMessage.success(`已读取 ${arr.length} 条记录`);
    loadData();
  };
  reader.readAsArrayBuffer(file);
  return false; /* 手动处理，不自动上传 */
};

/* 查看 */
const onView = (row: Row) => ElMessage.info(`查看「${row.name}」`);

/* 工具函数 */
const formatSize = (byte: number) => {
  if (byte < 1024) return byte + " B";
  if (byte < 1024 * 1024) return (byte / 1024).toFixed(2) + " KB";
  return (byte / 1024 / 1024).toFixed(2) + " MB";
};
</script>
  
  <style scoped lang="scss">
.qbank-table {
  padding: 12px;
  background: #fff;
}
.toolbar {
  margin-bottom: 12px;
}
</style>