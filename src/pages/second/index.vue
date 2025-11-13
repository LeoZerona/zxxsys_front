<!-- AdminLayout.vue (含标签栏) -->
<template>
  <div class="admin-container">
    <!-- 顶部头部 -->
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="logo">后台管理系统</div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#1890ff"
        @select="handleMenuSelect"
      >
        <el-menu-item index="dashboard">
          <el-icon>
            <Monitor />
          </el-icon>
          <span>仪表盘</span>
        </el-menu-item>

        <el-sub-menu index="user">
          <template #title>
            <el-icon>
              <User />
            </el-icon>
            <span>用户管理</span>
          </template>
          <el-menu-item index="user-list">用户列表</el-menu-item>
          <el-menu-item index="user-role">角色管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="content">
          <template #title>
            <el-icon>
              <Document />
            </el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="article-list">文章列表</el-menu-item>
          <el-menu-item index="category">分类管理</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="settings">
          <el-icon>
            <Setting />
          </el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部导航栏 -->
      <header class="header">
        <div class="header-top">
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>

          <div class="user-info">
            <el-dropdown>
              <span class="el-dropdown-link">
                <el-avatar :size="32" :src="userInfo.avatar" />
                管理员
                <el-icon class="el-icon--right">
                  <ArrowDown />
                </el-icon>
              </span>

              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon> <User /> </el-icon>个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="password">
                    <el-icon> <Lock /> </el-icon>修改密码
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon> <SwitchButton /> </el-icon>退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        <!-- 标签栏 -->
        <nav class="tabs-container" @contextmenu.prevent="onTabsContextmenu">
          <el-scrollbar class="tabs-scrollbar" ref="tabsScrollbarRef">
          </el-scrollbar>
          <el-tabs
            v-model="activeTab"
            type="card"
            closable
            @tab-click="handleTabClick"
            @tab-remove="handleTabClose"
          >
            <el-tab-pane
              v-for="tab in visitedTabs"
              :key="tab.name"
              :name="tab.name"
            >
              <template #label>
                <span :class="{ 'active-dot': tab.name === activeTab }">
                  {{ tab.title }}
                </span>
              </template>
            </el-tab-pane>
          </el-tabs>

          <!-- 右键菜单：ElementPlus 实现 -->
          <el-dropdown
            trigger="contextmenu"
            ref="contextDropdown"
            popper-class="tabs-context-menu"
            :popper-options="popperOptions"
          >
            <!-- 占位节点，真正位置由 popper-options 提供 -->
            <span class="context-trigger"></span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="closeOthers"
                  >关闭其他</el-dropdown-item
                >
                <el-dropdown-item @click="closeRight"
                  >关闭右侧</el-dropdown-item
                >
                <el-dropdown-item @click="closeAll">关闭所有</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </nav>
      </header>
      <!-- 页面主体 -->
      <section class="content">
        <slot />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  Monitor,
  User,
  Document,
  ArrowDown,
  Lock,
  SwitchButton,
} from "@element-plus/icons-vue";
import { nextTick } from "vue";
import { Placement } from "element-plus";

// 写死的用户信息
const userInfo = ref({
  name: "管理员",
  avatar: "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
});

interface Tab {
  name: string;
  title: string;
}

const router = useRouter();
const route = useRoute();

const activeMenu = ref<string>("user-list");
const visitedTabs = ref<Tab[]>([{ name: "user-list", title: "用户列表" }]);
const activeTab = ref<string>("user-list");

const menuTitleMap: Record<string, string> = {
  dashboard: "仪表盘",
  "user-list": "用户列表",
  "user-role": "角色管理",
  "article-list": "文章列表",
  category: "分类管理",
  settings: "系统设置",
};

const contextDropdown = ref(); // el-dropdown 实例
let rightClickTab = ""; // 记录右键的是哪个 tab

// 1. 修改 popperOptions，禁用会自动调整位置的修饰符
const popperOptions = ref({
  strategy: "fixed" as const,
  placement: "bottom-start" as Placement,
  modifiers: [
    { name: "flip", enabled: false }, // 禁用翻转
    { name: "offset", enabled: false }, // 禁用偏移计算
    { name: "preventOverflow", enabled: false }, // 禁用溢出检测
    { name: "computeStyles", enabled: false }, // 禁用自适应样式
  ],
});

// 2. 修复后的右键事件处理
function onTabsContextmenu(e: MouseEvent) {
  const item = (e.target as HTMLElement).closest(".el-tabs__item");
  if (!item) return;
  const paneName = item.getAttribute("aria-controls")?.replace("pane-", "");
  if (!paneName) return;

  e.preventDefault();
  rightClickTab = paneName;

  // 存储当前鼠标位置
  const x = e.clientX + 10;
  const y = e.clientY + 10;

  nextTick(() => {
    const dd = contextDropdown.value;
    if (!dd) return;

    // 先打开下拉菜单
    dd.handleOpen();

    // 等待 Popper 完成定位后，强制覆盖位置
    setTimeout(() => {
      // 获取真正的 popper DOM 元素
      const popperEl =
        dd.popperRef?.popperContentRef ||
        dd.popperRef?.popper ||
        document.querySelector(".tabs-context-menu");

      if (popperEl) {
        // 禁用 transform 定位，改用 fixed + left/top
        popperEl.style.transform = "none";
        popperEl.style.position = "absolute";
        popperEl.style.left = `${x}px`;
        popperEl.style.top = `${y}px`;
        popperEl.style.zIndex = "9999";
        /* 搬箭头：先找到它，再给它一个固定偏移 */
        const arrow = popperEl.querySelector(
          ".el-popper__arrow"
        ) as HTMLElement;
        if (arrow) {
          // arrow.style.transform = "none";
          arrow.style.top = "-5px";
        }
      }
    }, 10); // 微小延迟确保 Popper 已完成初始渲染
  });
}

const currentPageTitle = computed(
  () => menuTitleMap[activeMenu.value] ?? "用户列表"
);

/* 三个关闭逻辑 */
function closeOthers() {
  visitedTabs.value = visitedTabs.value.filter((t) => t.name === rightClickTab);
  activeTab.value = rightClickTab;
  router.push({ name: rightClickTab });
}

function closeRight() {
  const idx = visitedTabs.value.findIndex((t) => t.name === rightClickTab);
  visitedTabs.value = visitedTabs.value.slice(0, idx + 1);
  activeTab.value = rightClickTab;
  router.push({ name: rightClickTab });
}

function closeAll() {
  visitedTabs.value = [{ name: "dashboard", title: "仪表盘" }];
  activeTab.value = "dashboard";
  router.push({ name: "dashboard" });
}

/* 标签栏逻辑 */
const addTab = (name: string) => {
  const title = menuTitleMap[name];
  if (!title) return;
  const exists = visitedTabs.value.some((tab) => tab.name === name);
  if (!exists) {
    visitedTabs.value.push({ name, title });
  }
  activeTab.value = name;
};

const closeTab = (name: string) => {
  const idx = visitedTabs.value.findIndex((tab) => tab.name === name);
  if (idx === -1) return;
  visitedTabs.value.splice(idx, 1);
  if (activeTab.value === name) {
    const nextTab = visitedTabs.value[idx - 1] || visitedTabs.value[0];
    if (nextTab) {
      activeTab.value = nextTab.name;
      router.push({ name: nextTab.name });
    }
  }
};

const handleTabClick = (pane: any) => {
  const name = pane.props.name;
  activeMenu.value = name; // 同步菜单高亮
  // router.push({ name });
};

const handleTabClose = (name: any) => closeTab(name);
// 点击其他地方关闭右键菜单
window.addEventListener("click", () => {
  // contextMenuVisible.value = false;
});

const handleMenuSelect = (index: string) => {
  activeMenu.value = index;
  addTab(index);
  // router.push({ name: index });
};

const handleLogout = () => {
  // 退出登录逻辑
};

/* 监听路由变化，自动添加标签 */
watch(
  () => route.name as string,
  (name) => {
    if (name && menuTitleMap[name]) {
      activeMenu.value = name;
      addTab(name);
    }
  },
  { immediate: true }
);
</script>

<style scoped lang="scss">
@import "@/styles/globalVariable.scss";

.admin-container {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: $sideBarWidth;
  background-color: $menuBg;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);
  transition: width 0.3s ease;

  .logo {
    height: $headerHeight;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: $menuDarkBg;
    color: #fff;
    font-size: 20px;
    font-weight: bold;
    letter-spacing: 1px;
  }

  .el-menu {
    border-right: none;

    .el-menu-item {
      color: $menuText;

      &:hover {
        background-color: $menuHover;
      }

      &.is-active {
        background-color: $menuActiveBg;
        color: $menuActiveText;
      }
    }

    .el-sub-menu__title {
      color: $menuText;

      &:hover {
        background-color: $menuHover;
      }
    }
  }
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f0f2f5;
}

.header {
  background-color: red;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  .header-top {
    display: flex;
    justify-content: space-between;
    padding: 10px 20px;
    align-items: center;
    border-bottom: 1px solid #e4e7ed;
    .breadcrumb {
      font-size: 14px;
      color: #606266;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;

      .el-dropdown-link {
        cursor: pointer;
        color: #409eff;
        display: flex;
        align-items: center;
        gap: 5px;
      }
    }
  }

  .tabs-container {
    height: $tabsBarHeight;
    background-color: #fff;
    display: flex;
    align-items: center;
    padding: 0 10px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    .el-tabs {
      flex: 1;

      :deep(.el-tabs__header) {
        margin: 0;
        border-bottom: none;
      }

      :deep(.el-tabs__nav) {
        border: none;
      }

      :deep(.el-tabs__item) {
        // border: none;
        border: 1px solid #e4e7ed;
        height: 26px;
        line-height: 32px;
        padding: 0 6px;
        margin: 0 3px;
        font-size: 12px;
        color: #666;
        border-radius: 4px;

        &.is-active {
          background-color: $menuActiveBg;
          color: #fff;
        }
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

    .tabs-more {
      margin-left: 10px;
    }
  }
}

.context-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  font-size: 12px;
  width: 110px;

  .context-item {
    padding: 6px 12px;
    cursor: pointer;

    &:hover {
      background-color: #f5f7fa;
    }
  }
}

.content {
  flex: 1;
  margin: 10px;
  overflow-y: auto;
  background-color: $contentBg;
}

@media (max-width: 768px) {
  .sidebar {
    width: 64px;

    .logo {
      font-size: 14px;
    }
  }
}
</style>
