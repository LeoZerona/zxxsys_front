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
import { computed, ref, watch, onMounted, nextTick } from "vue";
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
const activeMenu = ref<string>("originalQuestionBank");

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
const activeTab = ref<string>("originalQuestionBank");

const menuTitleMap: Record<string, string> = {
  CleaningWarehouse: "清洗库",
  originalQuestionBank: "原题库",
  examinationPaper: "试卷",
  questionBankDetail: "题库内容",
  questionTypeDetail: "题目类型",
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
      // 处理详情页标签
      if (nextTab.name.startsWith("questionBankDetail-")) {
        const bankId = nextTab.name.replace("questionBankDetail-", "");
        router.push({ name: "questionBankDetail", params: { id: bankId } });
      } else if (nextTab.name.startsWith("questionTypeDetail-")) {
        const parts = nextTab.name.replace("questionTypeDetail-", "").split("-");
        const bankId = parts[0];
        const type = parts[1];
        router.push({
          name: "questionTypeDetail",
          params: { bankId, type },
        });
      } else {
        router.push({ name: nextTab.name });
      }
    } else {
      // 如果没有其他标签，返回原题库
      router.push({ name: "originalQuestionBank" });
    }
  }
};
const handleTabClick = (tab: { name: string; title: string }) => {
  const name = tab.name;
  activeTab.value = name; // 更新激活标签
  
  // 处理详情页标签
  if (name.startsWith("questionBankDetail-")) {
    const bankId = name.replace("questionBankDetail-", "");
    activeMenu.value = "originalQuestionBank";
    router.push({ name: "questionBankDetail", params: { id: bankId } });
  } else if (name.startsWith("questionTypeDetail-")) {
    // 处理题目类型页标签
    const parts = name.replace("questionTypeDetail-", "").split("-");
    const bankId = parts[0];
    const type = parts[1];
    activeMenu.value = "originalQuestionBank";
    router.push({
      name: "questionTypeDetail",
      params: { bankId, type },
    });
  } else {
    activeMenu.value = name; // 同步菜单高亮
    router.push({ name });
  }
};
const handleTabClose = (name: any) => closeTab(name);
const onMenuClick = (key: string, tab?: { name: string; title: string }) => {
  const currentTabName = tab?.name || activeTab.value;
  const currentTabTitle = tab?.title || menuTitleMap[currentTabName] || "";
  const currentTab = { name: currentTabName, title: currentTabTitle };
  const currentIndex = visitedTabs.value.findIndex((t) => t.name === currentTab.name);
  
  switch (key) {
    case "closeOther":
      // 关闭其他标签，只保留当前标签
      visitedTabs.value = [currentTab];
      activeTab.value = currentTab.name;
      break;
    case "closeLeft":
      // 关闭左侧标签
      if (currentIndex > 0) {
        visitedTabs.value = visitedTabs.value.slice(currentIndex);
      }
      break;
    case "closeAll":
      // 关闭所有标签
      visitedTabs.value = [];
      // 如果关闭了当前激活的标签，跳转到原题库
      if (currentTab.name === activeTab.value) {
        activeTab.value = "originalQuestionBank";
        router.push({ name: "originalQuestionBank" });
      }
      break;
  }
};

// 标记是否已经初始化过
const isInitialized = ref(false);

/* 路由监听 */
watch(
  () => route.name as string,
  (name) => {
    // 处理详情页路由
    if (name === "questionBankDetail") {
      if (isInitialized.value) {
        const bankId = route.params.id as string;
        const title = `题库内容-${bankId}`;
        const tabName = `questionBankDetail-${bankId}`;
        // 检查是否已存在该标签
        const exists = visitedTabs.value.some((tab) => tab.name === tabName);
        if (!exists) {
          visitedTabs.value.unshift({ name: tabName, title });
        }
        activeTab.value = tabName;
        activeMenu.value = "originalQuestionBank"; // 保持菜单高亮在原题库
      }
      return;
    }

    // 处理题目类型页路由
    if (name === "questionTypeDetail") {
      if (isInitialized.value) {
        const bankId = route.params.bankId as string;
        const type = route.params.type as string;
        const typeNameMap: Record<string, string> = {
          single: "单选题",
          multiple: "多选题",
          fill: "填空题",
          shortAnswer: "简答题",
          judge: "判断题",
          essay: "论述题",
        };
        const typeName = typeNameMap[type] || type;
        const title = `题库内容-${bankId}-${typeName}`;
        const tabName = `questionTypeDetail-${bankId}-${type}`;
        // 检查是否已存在该标签
        const exists = visitedTabs.value.some((tab) => tab.name === tabName);
        if (!exists) {
          visitedTabs.value.unshift({ name: tabName, title });
        }
        activeTab.value = tabName;
        activeMenu.value = "originalQuestionBank"; // 保持菜单高亮在原题库
      }
      return;
    }

    // 处理普通路由
    if (name && menuTitleMap[name]) {
      // 如果是初始化阶段且路由不是原题库，则跳转到原题库
      if (!isInitialized.value && name !== "originalQuestionBank") {
        nextTick(() => {
          router.push({ name: "originalQuestionBank" });
        });
        return;
      }
      // 只有在初始化完成后才添加标签和更新状态
      if (isInitialized.value) {
        activeMenu.value = name;
        activeTab.value = name;
        addTab(name);
      }
    }
  },
  { immediate: true }
);

/* 初始化：进入系统时自动进入原题库 */
onMounted(() => {
  // 如果是详情页，直接处理
  if (route.name === "questionBankDetail") {
    const bankId = route.params.id as string;
    const title = `题库内容-${bankId}`;
    const tabName = `questionBankDetail-${bankId}`;
    const exists = visitedTabs.value.some((tab) => tab.name === tabName);
    if (!exists) {
      visitedTabs.value.unshift({ name: tabName, title });
    }
    activeTab.value = tabName;
    activeMenu.value = "originalQuestionBank";
    isInitialized.value = true;
    return;
  }

  // 如果是题目类型页，直接处理
  if (route.name === "questionTypeDetail") {
    const bankId = route.params.bankId as string;
    const type = route.params.type as string;
    const typeNameMap: Record<string, string> = {
      single: "单选题",
      multiple: "多选题",
      fill: "填空题",
      shortAnswer: "简答题",
      judge: "判断题",
      essay: "论述题",
    };
    const typeName = typeNameMap[type] || type;
    const title = `题库内容-${bankId}-${typeName}`;
    const tabName = `questionTypeDetail-${bankId}-${type}`;
    const exists = visitedTabs.value.some((tab) => tab.name === tabName);
    if (!exists) {
      visitedTabs.value.unshift({ name: tabName, title });
    }
    activeTab.value = tabName;
    activeMenu.value = "originalQuestionBank";
    isInitialized.value = true;
    return;
  }

  // 如果当前路由不在菜单中，或者路由不是原题库，则跳转到原题库
  if (!route.name || !menuTitleMap[route.name as string] || route.name !== "originalQuestionBank") {
    router.push({ name: "originalQuestionBank" }).then(() => {
      // 跳转完成后，添加原题库标签并标记初始化完成
      addTab("originalQuestionBank");
      isInitialized.value = true;
    });
  } else {
    // 如果已经是原题库，直接添加标签并标记初始化完成
    if (visitedTabs.value.length === 0) {
      addTab(route.name as string);
    }
    isInitialized.value = true;
  }
});
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