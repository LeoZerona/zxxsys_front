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
        <nav class="tabs-container">
          <el-scrollbar class="tabs-scrollbar" ref="tabsScrollbarRef">
          </el-scrollbar>
          <el-tabs
            v-model="activeTab"
            type="card"
            closable
            @tab-click="handleTabClick"
            @tab-remove="handleTabClose"
            @contextmenu.prevent="onTabsContextmenu"
          >
            <el-tab-pane
              v-for="tab in visitedTabs"
              :key="tab.name"
              :name="tab.name"
              @contextmenu.prevent="showContextMenu($event, tab.name)"
            >
              <template #label>
                <span :class="{ 'active-dot': tab.name === activeTab }">
                  {{ tab.title }}
                </span>
              </template>
            </el-tab-pane>
          </el-tabs>
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

const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
let rightClickTab = ""; // 记录右键的是哪个 tab

const currentPageTitle = computed(
  () => menuTitleMap[activeMenu.value] ?? "用户列表"
);

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

const handleTabClose = (name: string) => closeTab(name);
// 点击其他地方关闭右键菜单
window.addEventListener("click", () => {
  contextMenuVisible.value = false;
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

/* 显示菜单 */
function showContextMenu(e: MouseEvent, tabName: string) {
  console.log("改标签触发右键事件");

  e.preventDefault(); // 阻止原生右键菜单
  rightClickTab = tabName;
  contextMenuX.value = e.clientX;
  contextMenuY.value = e.clientY;
  contextMenuVisible.value = true;

  /* 点别的地方自动关闭 */
  nextTick(() => {
    const close = () => (contextMenuVisible.value = false);
    document.addEventListener("click", close, { once: true });
  });
}

function onTabsContextmenu(e: MouseEvent) {
  console.log("右键事件");
  /* 真正被右键的元素是 .el-tabs__item */
  const item = (e.target as HTMLElement).closest(".el-tabs__item");
  if (!item) return;

  /* 从属性里把 pane 的 name 读出来 */
  const paneName = item.getAttribute("aria-controls")?.replace("pane-", "");
  if (paneName) showContextMenu(e, paneName);
}
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
