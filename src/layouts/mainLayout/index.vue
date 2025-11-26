<template>
  <div class="admin-container">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapse: isCollapse }">
      <!-- 右侧菜单 -->
      <rightMenu
        :collapse="isCollapse"
        :active-menu="activeMenu"
        :menu-data="customMenu"
        @select="handleMenuSelect"
      />
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
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>

              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>个人中心
                  </el-dropdown-item>
                  <el-dropdown-item command="password">
                    <el-icon><Lock /></el-icon>修改密码
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 标签栏 -->
        <nav class="tabs-container" @contextmenu.prevent="openMenu">
          <el-scrollbar ref="tabsScrollbarRef" />
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

          <ContextMenu ref="ctx" :menu-list="menuList" @click="onMenuClick" />
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
import ContextMenu, {
  type ContextMenuType,
} from "@/components/contextMenu/index.vue";
import rightMenu, { type MenuItem } from "./components/rightMenu.vue";

// const customMenu: MenuItem[] = [
//   { index: "home", title: "首页", icon: "House" },
//   { index: "about", title: "关于", icon: "InfoFilled" },
// ];
/* --------------  数据  -------------- */
const userInfo = ref({
  name: "管理员",
  avatar: "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
});
const isCollapse = ref(false);

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

const menuList = ref<ContextMenuType[]>([
  { key: "closeOther", label: "关闭其他", icon: "CircleClose" },
  { key: "closeLeft", label: "关闭左侧" },
  { key: "closeAll", label: "关闭所有", disabled: false, divided: true },
]);

const ctx = ref<InstanceType<typeof ContextMenu>>();

/* --------------  计算属性  -------------- */
const currentPageTitle = computed(
  () => menuTitleMap[activeMenu.value] ?? "用户列表"
);

/* --------------  方法  -------------- */
const router = useRouter();
const route = useRoute();

function openMenu(e: MouseEvent) {
  ctx.value!.openContextMenu(e);
}

function onMenuClick(item: MenuItem) {
  console.log("点了：", item.key);
}

function handleMenuSelect(index: string) {
  activeMenu.value = index;
  addTab(index);
  router.push({ name: index });
}

/* 标签页相关方法（未改动） */
interface Tab {
  name: string;
  title: string;
}
const addTab = (name: string) => {
  /* 略 */
};
const closeTab = (name: string) => {
  /* 略 */
};
const handleTabClick = (pane: any) => {
  /* 略 */
};
const handleTabClose = (name: any) => closeTab(name);

/* 监听路由变化自动加签（未改动） */
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
@use "@/styles/globalVariable.scss" as g;

.admin-container {
  display: flex;
  height: 100vh;
}

.sidebar {
  background-color: g.$menuBg;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);
  .tool {
    display: flex;
    justify-content: space-between;
    padding: 0 2px;
    .icon {
      font-size: 2em;
      cursor: pointer;
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
    height: g.$tabsBarHeight;
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
  }
}

.content {
  flex: 1;
  margin: 10px;
  overflow-y: auto;
  background-color: g.$contentBg;
}

@media (max-width: 768px) {
  .sidebar {
    width: 64px;
  }
}
</style>