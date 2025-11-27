<template>
  <div class="admin-container">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapse: isCollapse }">
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
        <TabsBar
          :visited-tabs="visitedTabs"
          :active-tab="activeTab"
          :menu-list="menuList"
          @tab-click="handleTabClick"
          @tab-remove="handleTabClose"
          @context-menu-click="onMenuClick"
        />
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
import rightMenu from "./components/leftMenu/index.vue";
// import rightMenu from "./components/rightMenu.vue";
import type { MenuItem } from "./components/leftMenu/components/RecurseMenu.vue";
import TabsBar from "./components/TabsBar.vue";
import type { ContextMenuType } from "@/components/contextMenu/index.vue";

/* ---------------- 数据 ---------------- */
const userInfo = ref({
  name: "管理员",
  avatar: "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
});
const isCollapse = ref(false);
const activeMenu = ref<string>("user-list");

const customMenu: MenuItem[] = [
  {
    name: "QuestionBankManagement",
    title: "题库管理",
    icon: "Document",
    children: [
      { name: "originalQuestionBank", title: "原题库", icon: "" },
      { name: "CleaningWarehouse", title: "清洗库", icon: "" },
    ],
  },
  {
    name: "examinationPaper",
    title: "试卷",
    icon: "Document",
    children: [],
  },
];

interface Tab {
  name: string;
  title: string;
}
const visitedTabs = ref<Tab[]>([]);
const activeTab = ref<string>("user-list");

const menuTitleMap: Record<string, string> = {
  CleaningWarehouse: "清洗库",
  originalQuestionBank: "原题库",
  examinationPaper: "试卷",
};

const menuList = ref<ContextMenuType[]>([
  { key: "closeOther", label: "关闭其他", icon: "CircleClose" },
  { key: "closeLeft", label: "关闭左侧" },
  { key: "closeAll", label: "关闭所有", disabled: false, divided: true },
]);

/* ---------------- 计算属性 ---------------- */
const currentPageTitle = computed(
  () => menuTitleMap[activeMenu.value] ?? "用户列表"
);

/* ---------------- 方法 ---------------- */
const router = useRouter();
const route = useRoute();

function handleMenuSelect(name: string) {
  activeMenu.value = name;
  addTab(name);
  router.push({ name });
}
import { nextTick } from "vue";

/* 标签页相关方法 */
const addTab = async (name: string) => {
  const title = menuTitleMap[name];
  if (!title) return;
  const exists = visitedTabs.value.some((tab) => tab.name === name);
  if (!exists) {
    visitedTabs.value.unshift({ name, title });
  }
  await nextTick();
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
  router.push({ name });
};
const handleTabClose = (name: any) => closeTab(name);
const onMenuClick = (key: string) => {
  console.log("点了：", key);
};

/* 路由监听 */
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
}
.content {
  flex: 1;
  margin: 10px;
  overflow-y: auto;
  padding: 10px;
  background-color: g.$contentBg;
}
@media (max-width: 768px) {
  .sidebar {
    width: 64px;
  }
}
</style>