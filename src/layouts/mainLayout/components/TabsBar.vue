<!-- @/components/TagsBar/index.vue -->
<template>
  <nav class="tabs-container">
    <!-- 横向滚动容器 -->
    <el-scrollbar ref="scrollRef" class="tab-scroll">
      <div class="tag-wrapper">
        <el-tag
          v-for="tab in visitedTabs"
          :key="tab.name"
          :class="['tab-tag', { active: tab.name === activeTab }]"
          closable
          size="small"
          @click="onTabClick(tab)"
          @close.stop="onTabRemove(tab.name)"
          @contextmenu.prevent.stop="openMenu($event, tab)"
        >
          <span class="tag-label">
            <i v-if="tab.name === activeTab" class="active-dot" />
            {{ tab.title }}
          </span>
        </el-tag>
      </div>
    </el-scrollbar>

    <!-- 右键菜单 -->
    <ContextMenu
      ref="ctxRef"
      :menu-list="menuList"
      @click="onContextMenuClick"
    />
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import type { ScrollbarInstance } from "element-plus";
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
  "tab-click": [tab: { name: string; title: string }];
  "tab-remove": [name: string];
  "context-menu-click": [key: string, tab?: { name: string; title: string }];
}>();

/* ---------------- 右键菜单 ---------------- */
const ctxRef = ref<InstanceType<typeof ContextMenu>>();
let rightClickTab: { name: string; title: string } | undefined;

function openMenu(e: MouseEvent, tab: { name: string; title: string }) {
  e.preventDefault();
  e.stopPropagation();
  rightClickTab = tab;
  // 直接传递鼠标事件给 ContextMenu
  ctxRef.value?.openContextMenu(e);
}
function onContextMenuClick(item: ContextMenuType) {
  const key = item.key as string;
  emit("context-menu-click", key, rightClickTab);
  rightClickTab = undefined;
}

/* ---------------- 标签事件 ---------------- */
function onTabClick(tab: { name: string; title: string }) {
  emit("tab-click", tab);
}
function onTabRemove(name: string) {
  emit("tab-remove", name);
}

/* ---------------- 滚轮横向滚动 ---------------- */
const scrollRef = ref<ScrollbarInstance>();
let wrap: HTMLElement | undefined;

function onWheel(e: WheelEvent) {
  if (!wrap) return;
  e.preventDefault();
  wrap.scrollLeft += e.deltaY;
}

onMounted(async () => {
  await nextTick();
  wrap = scrollRef.value?.wrapRef ?? undefined;
  wrap?.addEventListener("wheel", onWheel, { passive: false });
});

onBeforeUnmount(() => {
  wrap?.removeEventListener("wheel", onWheel);
});
</script>

<style scoped lang="scss">
@use "@/styles/globalVariable.scss" as g;

.tabs-container {
  // height: g.$tabsBarHeight;
  background-color: #fff;
  display: flex;
  align-items: center;
  padding: 0 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
}

/* ---------- 滚动条「可见不占位」 ---------- */
.tab-scroll {
  flex: 1;
  overflow: hidden;
  :deep(.el-scrollbar__bar) {
    opacity: 1 !important; // 始终可见
    bottom: 2px; // 避免贴边
  }
  :deep(.el-scrollbar__thumb) {
    background-color: #c1c1c1;
    &:hover {
      background-color: #7d7d7d;
    }
  }
  .tag-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    white-space: nowrap;
  }
}

/* ---------- 标签样式 ---------- */
.tab-tag {
  cursor: pointer;
  user-select: none;
  border: 1px solid #e4e7ed;
  color: #666;
  background-color: #fff;
  // 优化动画：只对特定属性进行过渡，使用更平滑的缓动函数
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.2s ease-out;
  position: relative;
  padding: 0 8px; // 左右两侧一致的内边距，右侧给关闭图标留位

  // hover 时的轻微缩放效果
  &:hover {
    transform: translateY(-1px);
  }

  &.active {
    background-color: g.$menuActiveBg;
    color: #fff;
    border-color: g.$menuActiveBg;
    
    /* 激活状态始终显示关闭图标，默认只显示白色，hover 时显示背景 */
    :deep(.el-tag__close) {
      display: inline-flex;
      color: #fff !important;
      background-color: transparent;
      border-radius: 50%;
      width: 14px;
      height: 14px;
      transition: all 0.2s ease;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
      }
    }
  }

  /* 未激活时隐藏关闭图标 */
  :deep(.el-tag__close) {
    display: none;
  }

  /* hover 时显示关闭图标 */
  &:hover :deep(.el-tag__close) {
    display: inline-flex;
  }

  .tag-label {
    display: inline-flex;
    align-items: center;
  }
}

.active-dot {
  width: 6px;
  height: 6px;
  background-color: #fff;
  border-radius: 50%;
  margin-right: 6px;
}

/* 1. 隐藏滚动条（chrome/edge/firefox） */
.tab-scroll :deep(.el-scrollbar__bar) {
  display: none !important;
}

/* 2. 让内部容器仍可横向滚动 */
.tab-scroll :deep(.el-scrollbar__wrap) {
  overflow-x: auto !important;
  overflow-y: hidden;
  scrollbar-width: none; /* firefox */
}
.tab-scroll :deep(.el-scrollbar__wrap::-webkit-scrollbar) {
  display: none; /* chrome/edge */
}
</style>