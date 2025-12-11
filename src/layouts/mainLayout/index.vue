<template>
  <div class="admin-container">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapse: isCollapse }">
      <rightMenu
        :collapse="isCollapse"
        :active-menu="activeMenu"
        :menu-data="customMenu"
        @select="handleMenuSelect"
        @toggle-collapse="isCollapse = !isCollapse"
      />
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 顶部导航栏 -->
      <header class="header">
        <div class="header-top">
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item
              v-for="(item, index) in breadcrumbList"
              :key="index"
              :to="item.path ? { name: item.path } : undefined"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>

          <UserInfo @command="handleUserCommand" />
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
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useUserStore } from "@/stores/modules/user";
import { ElMessageBox } from "element-plus";
import rightMenu from "./components/leftMenu/index.vue";
// import rightMenu from "./components/rightMenu.vue";
import type { MenuItem } from "./components/leftMenu/components/RecurseMenu.vue";
import TabsBar from "./components/TabsBar.vue";
import UserInfo from "./components/UserInfo.vue";
import type { ContextMenuType } from "@/components/contextMenu/index.vue";
import { filterMenusByPermission } from "@/utils/permission";
import type { MenuItem as ApiMenuItem } from "@/api/auth";

/* ---------------- 数据 ---------------- */
const isCollapse = ref(false);
const activeMenu = ref<string>("originalQuestionBank");

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
      isCollapse.value = true;
    }
    // 如果窗口宽度大于断点，且当前已收起，可以自动展开（可选）
    // else if (!shouldCollapse && isCollapse.value) {
    //   isCollapse.value = false;
    // }
  }, 100);
}

// 将后端菜单转换为前端菜单格式
function convertApiMenuToMenuItem(apiMenu: ApiMenuItem): MenuItem {
  const menuItem: MenuItem = {
    name: apiMenu.name,
    title: apiMenu.meta?.title || apiMenu.name,
    icon: apiMenu.meta?.icon || "Document",
  };

  if (apiMenu.children && apiMenu.children.length > 0) {
    menuItem.children = apiMenu.children
      .map(child => convertApiMenuToMenuItem(child))
      .filter(item => {
        // 检查原始菜单的hidden属性
        const originalMenu = findOriginalMenu(apiMenu.children || [], item.name);
        return !originalMenu?.meta?.hidden;
      });
  }

  return menuItem;
}


// 从store获取菜单并转换为前端格式
const userStore = useUserStore();
const customMenu = computed<MenuItem[]>(() => {
  const apiMenus = userStore.menus;
  if (!apiMenus || apiMenus.length === 0) {
    // 如果没有菜单，返回默认菜单（向后兼容）
    return [
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
  }

  // 过滤菜单（根据权限）
  const filteredMenus = filterMenusByPermission(apiMenus);
  
  // 转换为前端菜单格式
  return filteredMenus
    .map(menu => convertApiMenuToMenuItem(menu))
    .filter(item => {
      // 检查原始菜单的hidden属性
      const originalMenu = findOriginalMenuInAll(apiMenus, item.name);
      return !originalMenu?.meta?.hidden;
    });
});

// 在所有菜单中查找原始菜单项（包括嵌套子菜单）
function findOriginalMenuInAll(menus: ApiMenuItem[], name: string): ApiMenuItem | null {
  for (const menu of menus) {
    if (menu.name === name) {
      return menu;
    }
    if (menu.children) {
      const found = findOriginalMenuInAll(menu.children, name);
      if (found) return found;
    }
  }
  return null;
}

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

// 面包屑列表
interface BreadcrumbItem {
  name: string;
  title: string;
  path?: string;
}
const breadcrumbList = ref<BreadcrumbItem[]>([]);

/* ---------------- 计算属性 ---------------- */

// 查找菜单项及其父级菜单
function findMenuPath(
  menuList: MenuItem[],
  targetName: string,
  path: MenuItem[] = []
): MenuItem[] | null {
  for (const item of menuList) {
    const currentPath = [...path, item];

    // 如果找到目标菜单项
    if (item.name === targetName) {
      return currentPath;
    }

    // 如果有子菜单，递归查找
    if (item.children && item.children.length > 0) {
      const found = findMenuPath(item.children, targetName, currentPath);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

// 初始化菜单（从store恢复）
onMounted(() => {
  if (userStore.menus.length === 0) {
    userStore.restoreMenus();
  }
});

// 生成面包屑列表
function generateBreadcrumb() {
  const routeName = route.name as string;

  // 处理详情页路由
  if (
    routeName === "questionBankDetail" ||
    routeName === "questionTypeDetail"
  ) {
    // 详情页的面包屑：首页 / 题库管理 / 原题库 / 当前页面
    const menuPath = findMenuPath(customMenu, "originalQuestionBank");
    if (menuPath) {
      breadcrumbList.value = menuPath.map((item) => ({
        name: item.name,
        title: item.title,
        path: item.children && item.children.length > 0 ? undefined : item.name,
      }));
    }
    // 添加当前详情页
    const currentTitle = menuTitleMap[routeName] || "详情";
    breadcrumbList.value.push({
      name: routeName,
      title: currentTitle,
      path: undefined, // 详情页不可点击
    });
    return;
  }

  // 处理普通路由
  const menuPath = findMenuPath(customMenu, routeName);
  if (menuPath) {
    breadcrumbList.value = menuPath.map((item) => ({
      name: item.name,
      title: item.title,
      // 只有叶子节点（没有子菜单的）才可点击
      path: item.children && item.children.length > 0 ? undefined : item.name,
    }));
  } else {
    // 如果找不到菜单项，只显示当前页面标题
    breadcrumbList.value = [
      {
        name: routeName,
        title: menuTitleMap[routeName] || "未知页面",
        path: undefined,
      },
    ];
  }
}

/* ---------------- 方法 ---------------- */
const router = useRouter();
const route = useRoute();

function handleMenuSelect(name: string) {
  activeMenu.value = name;
  addTab(name);
  router.push({ name });
}

// 处理用户信息下拉菜单命令
async function handleUserCommand(command: "profile" | "password" | "logout") {
  const userStore = useUserStore();
  
  switch (command) {
    case "profile":
      // TODO: 跳转到个人中心页面
      console.log("跳转到个人中心");
      break;
    case "password":
      // TODO: 打开修改密码对话框
      console.log("打开修改密码对话框");
      break;
    case "logout":
      // 确认退出登录
      try {
        await ElMessageBox.confirm("确定要退出登录吗？", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        });
        
        // 调用退出登录方法
        await userStore.logout();
        
        // 清除标签页
        visitedTabs.value = [];
        activeTab.value = "";
        
        // 跳转到登录页
        router.push({ name: "login" });
      } catch (error) {
        // 用户取消操作，不做任何处理
        if (error !== "cancel") {
          console.error("退出登录失败:", error);
        }
      }
      break;
  }
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
        const parts = nextTab.name
          .replace("questionTypeDetail-", "")
          .split("-");
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
  const currentIndex = visitedTabs.value.findIndex(
    (t) => t.name === currentTab.name
  );

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
    // 更新面包屑
    generateBreadcrumb();

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
  // 初始化面包屑
  generateBreadcrumb();

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
  if (
    !route.name ||
    !menuTitleMap[route.name as string] ||
    route.name !== "originalQuestionBank"
  ) {
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

  // 监听窗口大小变化
  window.addEventListener("resize", handleResize);
  // 初始化时检查一次
  handleResize();
});

// 清理事件监听
onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  if (resizeTimer) {
    clearTimeout(resizeTimer);
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
  width: g.$sideBarWidth; // 展开时的宽度
  min-width: 0; // 允许收缩到最小宽度
  flex-shrink: 0; // 防止被压缩
  background-color: g.$menuBg;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);
  transition: width 0.3s ease; // 添加宽度过渡动画
  overflow: hidden; // 防止内容溢出

  // 收起时的宽度
  &.collapse {
    width: 64px;
    min-width: 64px; // 确保最小宽度
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
  }
}
.content {
  flex: 1;
  margin: 10px;
  overflow-y: auto;
  padding: 10px;
  background-color: g.$contentBg;
}
// 当侧边栏收缩时，隐藏工具栏（输入框），但保留收起按钮
.sidebar.collapse {
  :deep(.tool) {
    display: none !important;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 64px;
    transition: width 0.3s ease; // 保持动画效果

    // 确保在小屏幕时侧边栏处于收缩状态
    &.collapse {
      width: 64px;
    }

    // 隐藏工具栏（输入框），但保留收起按钮
    :deep(.tool) {
      display: none !important;
    }

    // 收起按钮始终显示
    :deep(.collapse-button) {
      display: flex !important;
    }
  }
}
</style>
