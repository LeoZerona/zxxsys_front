<template>
  <aside class="sidebar">
    <!-- 收起按钮 - 收起时单独显示在顶部 -->
    <div class="collapse-button" v-if="isCollapse" @click="toggleCollapse">
      <el-icon class="icon" :size="18">
        <Expand />
      </el-icon>
    </div>

    <!-- 工具栏 - 包含输入框和收起按钮，展开时显示 -->
    <div class="tool" v-show="!isCollapse">
      <el-input
        v-model="menuKey"
        class="responsive-input"
        placeholder="输入菜单检索"
        :prefix-icon="Search"
        @input="handleInput"
        @keyup.enter="handleSearch"
        @blur="handleSearch"
      />
      <el-icon class="icon" @click="toggleCollapse">
        <Fold />
      </el-icon>
    </div>

    <el-menu
      :default-active="activeMenu"
      class="el-menu-vertical"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#1890ff"
      :collapse="isCollapse"
      @select="handleSelect"
    >
      <RecurseMenu :menuList="filteredMenu" :keyword="menuKey" />
    </el-menu>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import type { PropType } from "vue";
import {
  Monitor,
  User,
  Document,
  Setting,
  Search,
  Expand,
  Fold,
} from "@element-plus/icons-vue";
import RecurseMenu from "./components/RecurseMenu.vue";
import type { MenuItem } from "./components/RecurseMenu.vue";

const defaultMenu: MenuItem[] = [
  {
    name: "dashboard",
    title: "仪表盘",
    icon: Monitor,
  },
  {
    name: "user",
    title: "用户管理",
    icon: User,
    children: [
      { name: "user-list", title: "用户列表" },
      { name: "user-role", title: "角色管理" },
    ],
  },
  {
    name: "content",
    title: "内容管理",
    icon: Document,
    children: [
      { name: "article-list", title: "文章列表" },
      { name: "category", title: "分类管理" },
    ],
  },
  {
    name: "settings",
    title: "系统设置",
    icon: Setting,
  },
];

const filteredMenu = ref<MenuItem[]>([]);
const props = defineProps({
  activeMenu: { type: String, default: "" },
  menuData: { type: Array as PropType<MenuItem[]>, default: () => [] },
  collapse: { type: Boolean, default: false },
});

const menuData = computed(() =>
  props.menuData.length ? props.menuData : defaultMenu
);

const emit = defineEmits<{
  select: [name: string];
  "toggle-collapse": [];
}>();

const menuKey = ref("");
// 使用 props 传入的 collapse 状态，如果没有则使用本地状态
const localCollapse = ref(false);
const isCollapse = computed(() => {
  // 如果传入了 collapse prop，优先使用 prop
  if (props.collapse !== undefined) {
    return props.collapse;
  }
  return localCollapse.value;
});

const handleSelect = (name: string) => {
  emit("select", name);
};

function filterMenu(list: MenuItem[], key: string): MenuItem[] {
  if (!key.trim()) return list;
  const res: MenuItem[] = [];
  list.forEach((item) => {
    const match = item.title.toLowerCase().includes(key.toLowerCase());
    if (item.children) {
      const children = filterMenu(item.children, key);
      if (children.length || match) {
        res.push({
          ...item,
          children: children.length ? children : item.children,
        });
      }
    } else if (match) {
      res.push(item);
    }
  });
  return res;
}

let debounceTimer: number | null = null;
function handleInput() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    handleSearch();
  }, 300);
}

function handleSearch() {
  const key = menuKey.value;
  const source = props.menuData.length ? props.menuData : defaultMenu;
  filteredMenu.value = filterMenu(source, key);
}

// 切换侧边栏收缩状态
function toggleCollapse() {
  if (props.collapse === undefined) {
    // 如果没有传入 collapse prop，使用本地状态
    localCollapse.value = !localCollapse.value;
  } else {
    // 如果传入了 collapse prop，发出事件通知父组件
    emit("toggle-collapse");
  }
}

// 响应式处理：监听窗口大小变化，自动触发收起
const BREAKPOINT = 768; // 与 CSS 媒体查询保持一致
let resizeTimer: number | null = null;

function handleResize() {
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }
  resizeTimer = window.setTimeout(() => {
    const windowWidth = window.innerWidth;
    const shouldCollapse = windowWidth <= BREAKPOINT;

    // 如果窗口宽度小于等于断点，且当前未收起，则自动收起
    if (shouldCollapse && !isCollapse.value) {
      if (props.collapse === undefined) {
        localCollapse.value = true;
      } else {
        // 如果父组件控制状态，发出事件
        if (!props.collapse) {
          emit("toggle-collapse");
        }
      }
    }
  }, 100);
}

// 监听窗口大小变化
onMounted(() => {
  window.addEventListener("resize", handleResize);
  // 初始化时检查一次
  handleResize();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }
});

handleSearch();
</script>

<style scoped lang="scss">
@use "@/styles/globalVariable.scss" as g;
.sidebar {
  width: 100%; // 继承父容器宽度
  height: 100%; // 填满父容器高度
  background-color: g.$menuBg;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;

  // 收起按钮 - 收起时显示在菜单项位置
  .collapse-button {
    display: flex !important;
    justify-content: flex-start;
    align-items: center;
    height: 56px; // 与菜单项高度一致
    background-color: #304156;
    color: #bfcbd9;
    cursor: pointer;
    transition: background-color 0.3s ease;
    padding: 0 20px; // 与菜单项图标左边距一致
    margin: 0;
    z-index: 10; // 确保在最上层
    // 添加动画：从右侧平滑移动到左侧
    animation: slideToLeft 0.3s ease-out;

    &:hover {
      background-color: g.$menuHover; // 与菜单项 hover 背景色一致
    }

    .icon {
      font-size: 24px !important; // 与展开时大小一致
      color: #bfcbd9 !important;
      transition: color 0.3s ease;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      visibility: visible !important;
      opacity: 1 !important;
      width: 24px !important;
      height: 24px !important;
      line-height: 1 !important;
      flex-shrink: 0 !important;

      // 确保 el-icon 组件本身可见
      :deep(.el-icon) {
        display: inline-flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        width: 24px !important;
        height: 24px !important;
        font-size: 24px !important;
        flex-shrink: 0 !important;
      }

      // 确保 SVG 图标可见
      :deep(svg) {
        width: 24px !important;
        height: 24px !important;
        display: block !important;
        fill: currentColor !important;
        visibility: visible !important;
        opacity: 1 !important;
        color: #bfcbd9 !important;
        flex-shrink: 0 !important;
      }

      // 确保所有内部元素可见
      :deep(*) {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        flex-shrink: 0 !important;
      }
    }
  }

  // 定义向左移动的动画
  @keyframes slideToLeft {
    from {
      // 从展开时的右侧位置开始
      // 展开时侧边栏宽度211px，图标在tool右侧，大约距离左侧157px
      // 收起时图标在左侧20px位置，所以需要移动约137px
      transform: translateX(137px);
      opacity: 0.6;
    }
    to {
      transform: translateX(0); // 移动到左侧位置
      opacity: 1;
    }
  }

  // 工具栏 - 包含输入框和收起按钮，展开时显示
  .tool {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    padding-left: 13px;
    height: 50px;
    background-color: #304156;
    color: #bfcbd9;
    transition: opacity 0.3s ease, visibility 0.3s ease;

    .responsive-input {
      flex: 1;
      max-width: 144px;

      :deep(.el-input__wrapper) {
        transition: all 0.3s ease;
      }
    }

    .icon {
      margin-left: 10px;
      font-size: 24px;
      cursor: pointer;
      color: #bfcbd9;
      transition: color 0.3s ease, transform 0.3s ease;

      &:hover {
        color: #fff;
      }
    }
  }

  .el-menu-vertical {
    width: 100% !important; // 确保菜单填满容器
    min-width: 0 !important; // 允许收缩到最小宽度
    border-right: none;

    // 确保收起时，收起按钮的图标不受菜单样式影响
    &.el-menu--collapse {
      // 不影响收起按钮
    }

    .el-sub-menu__title {
      span {
        width: 6vw;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
    }

    .el-menu-item {
      width: 100%;
      color: g.$menuText;
      span {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      &:hover {
        background-color: g.$menuHover;
      }
      &.is-active {
        background-color: g.$menuActiveBg;
        color: g.$menuActiveText;
      }
    }

    .el-sub-menu__title {
      color: g.$menuText;
      &:hover {
        background-color: g.$menuHover;
      }
    }
  }
}

// 响应式处理：小屏幕时自动隐藏工具栏（输入框），但保留收起按钮
@media (max-width: 768px) {
  .sidebar {
    .tool {
      display: none !important;
    }

    // 收起按钮始终显示（如果侧边栏已收起）
    .collapse-button {
      display: flex !important;
    }
  }
}
</style>
