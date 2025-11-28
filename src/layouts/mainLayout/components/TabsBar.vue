<template>
  <nav class="tabs-container" @contextmenu.prevent="openMenu">
    <el-tabs
      :model-value="activeTab"
      type="card"
      closable
      @tab-click="onTabClick"
      @tab-remove="onTabRemove"
    >
      <el-tab-pane v-for="tab in visitedTabs" :key="tab.name" :name="tab.name">
        <template #label>
          <span :class="{ 'active-dot': tab.name === activeTab }">
            {{ tab.title }}
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <ContextMenu
      ref="ctxRef"
      :menu-list="menuList"
      @click="onContextMenuClick"
    />
  </nav>
</template>
  
  <script setup lang="ts">
import { ref } from "vue";
import type { TabPaneName } from "element-plus";
import ContextMenu, {
  type ContextMenuType,
} from "@/components/contextMenu/index.vue";

/* ---------------- props & emit ---------------- */
defineProps<{
  visitedTabs: { name: string; title: string }[];
  activeTab: string;
  menuList: ContextMenuType[];
}>();

const emit = defineEmits<{
  "tab-click": [pane: any];
  "tab-remove": [name: string];
  "context-menu-click": [key: string];
}>();

/* ---------------- 右键菜单 ---------------- */
const ctxRef = ref<InstanceType<typeof ContextMenu>>();

function openMenu(e: MouseEvent) {
  ctxRef.value?.openContextMenu(e);
}
function onContextMenuClick(key: string) {
  emit("context-menu-click", key);
}

/* ---------------- 标签事件 ---------------- */
function onTabClick(pane: any) {
  emit("tab-click", pane);
}
function onTabRemove(name: TabPaneName) {
  emit("tab-remove", name as string);
}
</script>
  
  <style scoped lang="scss">
@use "@/styles/globalVariable.scss" as g;

.tabs-container {
  height: g.$tabsBarHeight;
  background-color: #fff;
  display: flex;
  align-items: center;
  padding: 0 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;

  .el-tabs {
    flex: 1;
    overflow: hidden;
    :deep(.el-tabs__header) {
      margin: 0;
      border-bottom: none;
    }
    :deep(.el-tabs__nav) {
      border: none;
    }
    :deep(.el-tabs__item) {
      border: 1px solid #e4e7ed;
      height: 26px;
      line-height: 32px;
      padding: 0 6px;
      margin: 0 3px;
      font-size: 12px;
      color: #666;
      border-radius: 4px;
      &.is-active {
        background-color: g.$menuActiveBg;
        color: #fff;
        padding: 0 12px;
      }
    }
    :deep(.el-tabs__item:nth-child(2)) {
      padding: 0 6px;
    }
    :deep(.el-tabs__item:last-child) {
      padding: 0 6px;
    }
  }

  .active-dot::before {
    content: "";
    display: inline-block;
    width: 6px;
    height: 6px;
    background-color: white;
    border-radius: 50%;
    margin-right: 6px;
    vertical-align: middle;
  }
}
/* 隐藏 ElementPlus 自带的左右箭头 */
:deep(.el-tabs__nav-prev),
:deep(.el-tabs__nav-next) {
  display: none !important;
}

/* 给导航栏加上滚轮能力 */
:deep(.el-tabs__header) {
  overflow-x: auto; /* 横向超出时出现滚动条 */
  scrollbar-width: none; /* Firefox 隐藏滚动条 */
  -ms-overflow-style: none; /* IE/Edge 隐藏滚动条 */
  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari 隐藏滚动条 */
  }
}

/* 让滚轮事件作用在 header 上 */
:deep(.el-tabs__header) {
  pointer-events: auto; /* 默认即可，保险写一下 */
}

:deep(.el-tabs__nav-wrap.is-scrollable) {
  padding: 0px;
}
</style>