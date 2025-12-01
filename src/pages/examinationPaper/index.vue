<template>
  <!-- 1. 外层包裹 -->
  <div ref="tabsWrapper" class="tabs-wrapper" @wheel.prevent="handleWheel">
    <el-tabs
      v-model="editableTabsValue"
      type="card"
      closable
      @tab-remove="removeTab"
    >
      <el-tab-pane
        v-for="item in editableTabs"
        :key="item.name"
        :label="item.title"
        :name="item.name"
      >
        {{ item.content }}
      </el-tab-pane>
    </el-tabs>
  </div>

  <div style="margin-top: 12px">
    <el-button size="small" @click="addTab">add tab</el-button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { TabPaneName } from "element-plus";

/* ---------------- 数据 ---------------- */
let tabIndex = 2;
const editableTabsValue = ref("2");
const editableTabs = ref([
  { title: "Tab 1", name: "1", content: "Tab 1 content" },
  { title: "Tab 2", name: "2", content: "Tab 2 content" },
]);

/* ---------------- 方法 ---------------- */
const addTab = () => {
  const newTabName = `${++tabIndex}`;
  editableTabs.value.push({
    title: "New Tab",
    name: newTabName,
    content: "New Tab content",
  });
  editableTabsValue.value = newTabName;
};

const removeTab = (targetName: TabPaneName) => {
  const tabs = editableTabs.value;
  let activeName = editableTabsValue.value;
  if (activeName === targetName) {
    const idx = tabs.findIndex((t) => t.name === targetName);
    const next = tabs[idx + 1] || tabs[idx - 1];
    if (next) activeName = next.name;
  }
  editableTabsValue.value = activeName;
  editableTabs.value = tabs.filter((t) => t.name !== targetName);
};

/* ---------------- 滚轮横向滚动 ---------------- */
const tabsWrapper = ref<HTMLDivElement>();

const handleWheel = (e: WheelEvent) => {
  console.log("有效果吗？？？？", e);

  if (!tabsWrapper.value) return;
  // deltaY 的正负表示上下滚动方向，这里取反实现左右滚动
  tabsWrapper.value.scrollLeft += e.deltaY;
};
</script>

<style scoped>
/* 把横向滚动条藏起来，但保留滚动能力 */
.tabs-wrapper {
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none; /* Firefox */
}
.tabs-wrapper::-webkit-scrollbar {
  display: none; /* Chrome / Edge */
}

/* 可选：让滚动更平滑 */
.tabs-wrapper {
  scroll-behavior: smooth;
}
</style>