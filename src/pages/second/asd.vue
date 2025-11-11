<template>
  <el-container class="admin-layout">
    <!-- 左侧菜单栏 -->
    <el-aside :width="menuCollapse ? '64px' : '220px'" class="aside-menu">
      <div class="logo-container" :class="{ collapsed: menuCollapse }">
        <!-- <img src="@/assets/logo.png" alt="logo" class="logo" /> -->
        <span v-show="!menuCollapse" class="logo-text">管理系统</span>
      </div>

      <el-scrollbar class="menu-scrollbar">
        <el-menu
          :default-active="activeMenu"
          :collapse="menuCollapse"
          :unique-opened="true"
          :router="true"
          class="menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409eff"
          @select="handleMenuSelect"
        >
          <template v-for="menu in menuList" :key="menu.path">
            <!-- 有子菜单 -->
            <el-sub-menu v-if="menu.children?.length" :index="menu.path">
              <template #title>
                <el-icon v-if="menu.icon">
                  <component :is="menu.icon" />
                </el-icon>
                <span>{{ menu.title }}</span>
              </template>
              <el-menu-item
                v-for="subMenu in menu.children"
                :key="subMenu.path"
                :index="subMenu.path"
              >
                <el-icon v-if="subMenu.icon">
                  <component :is="subMenu.icon" />
                </el-icon>
                <span>{{ subMenu.title }}</span>
              </el-menu-item>
            </el-sub-menu>

            <!-- 没有子菜单 -->
            <el-menu-item v-else :index="menu.path">
              <el-icon v-if="menu.icon">
                <component :is="menu.icon" />
              </el-icon>
              <template #title>
                <span>{{ menu.title }}</span>
              </template>
            </el-menu-item>
          </template>
        </el-menu>
      </el-scrollbar>

      <div class="menu-collapse" @click="toggleMenuCollapse">
        <el-icon>
          <Fold v-if="!menuCollapse" />
          <Expand v-else />
        </el-icon>
      </div>
    </el-aside>

    <!-- 右侧内容区 -->
    <el-container class="main-container">
      <!-- 顶部区域 -->
      <el-header class="header" height="100px">
        <div class="header-top">
          <!-- 面包屑 -->
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item
              v-for="item in breadcrumbList"
              :key="item.path"
              :to="item.path"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>

          <!-- 用户信息（写死数据） -->
          <div class="user-info">
            <el-dropdown @command="handleUserCommand">
              <div class="user-info-trigger">
                <el-avatar :size="32" :src="userInfo.avatar" />
                <span class="username">{{ userInfo.name }}</span>
                <el-icon>
                  <ArrowDown />
                </el-icon>
              </div>
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
        <div class="tabs-container">
          <el-scrollbar class="tabs-scrollbar" ref="tabsScrollbarRef">
            <div class="tabs-wrapper">
              <ContextMenu
                v-for="tag in visitedViews"
                :key="tag.path"
                :tag="tag"
                @refresh="refreshTab"
                @close="closeTag"
                @closeOther="closeOtherTabs"
                @closeAll="closeAllTabs"
              >
                <el-tag
                  :closable="!tag.affix"
                  :effect="tag.path === activeTag ? 'dark' : 'plain'"
                  class="tab-tag"
                  @click="switchTag(tag)"
                  @close="closeTag(tag)"
                >
                  <el-icon v-if="tag.icon" class="tag-icon">
                    <component :is="tag.icon" />
                  </el-icon>
                  {{ tag.title }}
                </el-tag>
              </ContextMenu>
            </div>
          </el-scrollbar>

          <!-- 标签操作下拉 -->
          <el-dropdown @command="handleTagCommand" class="tabs-action">
            <el-icon class="tabs-action-icon"><ArrowDown /></el-icon>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="refresh">刷新当前</el-dropdown-item>
                <el-dropdown-item command="close">关闭当前</el-dropdown-item>
                <el-dropdown-item command="closeOther"
                  >关闭其他</el-dropdown-item
                >
                <el-dropdown-item command="closeAll">关闭所有</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <el-scrollbar class="content-scrollbar">
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" :key="route.fullPath" />
            </transition>
          </router-view>
        </el-scrollbar>
      </el-main>
    </el-container>
  </el-container>

  <!-- 修改密码对话框 -->
  <el-dialog
    v-model="passwordDialogVisible"
    title="修改密码"
    width="500px"
    @close="resetPasswordForm"
  >
    <el-form
      ref="passwordFormRef"
      :model="passwordForm"
      :rules="passwordRules"
      label-width="100px"
    >
      <el-form-item label="原密码" prop="oldPassword">
        <el-input
          v-model="passwordForm.oldPassword"
          type="password"
          placeholder="请输入原密码"
          show-password
        />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input
          v-model="passwordForm.newPassword"
          type="password"
          placeholder="请输入新密码"
          show-password
        />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="passwordForm.confirmPassword"
          type="password"
          placeholder="请确认新密码"
          show-password
        />
        <div class="password-strength" v-if="passwordForm.newPassword">
          <div class="strength-bar" :class="passwordStrength"></div>
          <span class="strength-text">{{ passwordStrengthText }}</span>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="passwordDialogVisible = false">取消</el-button>
      <el-button
        type="primary"
        @click="handleUpdatePassword"
        :loading="passwordLoading"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import ContextMenu from "./ContextMenu.vue";
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Fold,
  Expand,
  ArrowDown,
  User,
  Lock,
  SwitchButton,
  Refresh,
  Close,
  CircleClose,
  Minus,
  Menu,
  Setting,
  HomeFilled,
  UserFilled,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";

// 路由相关
const route = useRoute();
const router = useRouter();

// === 1. 响应式数据定义（最先）===
const menuCollapse = ref(false);
const tabsScrollbarRef = ref<InstanceType<typeof ElScrollbar>>();
const passwordDialogVisible = ref(false);
const passwordFormRef = ref<FormInstance>();
const passwordLoading = ref(false);
const currentContextMenuTag = ref<any>(null);

// 写死的用户信息
const userInfo = ref({
  name: "管理员",
  avatar: "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
});

// 写死的菜单数据
const menuList = ref([
  {
    path: "/dashboard",
    title: "仪表盘",
    icon: HomeFilled,
    children: [],
  },
  {
    path: "/system",
    title: "系统管理",
    icon: Setting,
    children: [
      {
        path: "/system/user",
        title: "用户管理",
        icon: UserFilled,
      },
      {
        path: "/system/role",
        title: "角色管理",
        icon: UserFilled,
      },
    ],
  },
]);

// 标签数据
const visitedViews = ref([
  {
    path: "/dashboard",
    title: "仪表盘",
    icon: "Menu",
    affix: true,
  },
]);

const breadcrumbList = ref<any[]>([]);

const passwordForm = ref({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// === 2. 计算属性 ===
const activeMenu = computed(() => route.path);
const activeTag = computed(() => route.path);

const passwordStrength = computed(() => {
  const password = passwordForm.value.newPassword;
  if (!password) return "";

  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  if (strength <= 1) return "weak";
  if (strength === 2) return "medium";
  return "strong";
});

const passwordStrengthText = computed(() => {
  const map = {
    "": "",
    weak: "弱",
    medium: "中",
    strong: "强",
  };
  return map[passwordStrength.value as keyof typeof map];
});

// === 3. 工具函数定义（在watch之前）===
const initBreadcrumb = () => {
  const matched = route.matched.filter((item) => item.meta && item.meta.title);
  breadcrumbList.value = matched.map((item) => ({
    path: item.path,
    title: item.meta.title,
  }));
};

const addTagView = () => {
  if (route.meta && route.meta.title) {
    const exist = visitedViews.value.find((view) => view.path === route.path);
    if (!exist) {
      visitedViews.value.push({
        path: route.path,
        title: route.meta.title as string,
        icon: route.meta.icon as string,
        affix: (route.meta.affix as boolean) || false,
      });
    }
  }
};

const moveToCurrentTag = async () => {
  await nextTick();
  const container = document.querySelector(".tabs-wrapper") as HTMLElement;
  const activeTagEl = document.querySelector(
    ".tab-tag.is-active"
  ) as HTMLElement;

  if (container && activeTagEl) {
    const scrollLeft =
      activeTagEl.offsetLeft -
      container.offsetWidth / 2 +
      activeTagEl.offsetWidth / 2;
    tabsScrollbarRef.value?.setScrollLeft(scrollLeft);
  }
};

// === 4. 业务操作函数 ===
const toggleMenuCollapse = () => {
  menuCollapse.value = !menuCollapse.value;
};

const handleMenuSelect = (path: string) => {
  // 路由跳转由 el-menu 自动处理
};

const switchTag = (tag: any) => {
  if (tag.path !== route.path) {
    router.push(tag.path);
  }
};

const closeTag = (tag: any) => {
  const isActive = tag.path === route.path;
  const index = visitedViews.value.findIndex((view) => view.path === tag.path);
  if (index > -1) {
    visitedViews.value.splice(index, 1);
  }

  if (isActive && visitedViews.value.length > 0) {
    const lastView = visitedViews.value[visitedViews.value.length - 1];
    router.push(lastView.path);
  } else if (visitedViews.value.length === 0) {
    router.push("/");
  }
};

const handleTagCommand = (command: string) => {
  const currentTag = visitedViews.value.find((tag) => tag.path === route.path);
  switch (command) {
    case "refresh":
      if (currentTag) refreshTab(currentTag);
      break;
    case "close":
      if (currentTag && !currentTag.affix) closeTag(currentTag);
      break;
    case "closeOther":
      if (currentTag) closeOtherTabs(currentTag);
      break;
    case "closeAll":
      closeAllTabs();
      break;
  }
};

const refreshTab = (tag: any) => {
  router.replace({ path: "/redirect" + tag.path });
};

const closeOtherTabs = (tag: any) => {
  visitedViews.value = visitedViews.value.filter(
    (view) => view.affix || view.path === tag.path
  );
};

const closeAllTabs = () => {
  visitedViews.value = visitedViews.value.filter((view) => view.affix);
  if (visitedViews.value.length > 0) {
    router.push(visitedViews.value[0].path);
  } else {
    router.push("/");
  }
};

const handleUserCommand = (command: string) => {
  switch (command) {
    case "profile":
      router.push("/profile");
      break;
    case "password":
      passwordDialogVisible.value = true;
      break;
    case "logout":
      handleLogout();
      break;
  }
};

const handleLogout = () => {
  ElMessageBox.confirm("确定要退出登录吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  }).then(() => {
    ElMessage.success("已退出登录");
    localStorage.clear();
    sessionStorage.clear();
    router.push("/login");
  });
};

const handleUpdatePassword = async () => {
  if (!passwordFormRef.value) return;

  await passwordFormRef.value.validate((valid) => {
    if (valid) {
      passwordLoading.value = true;
      setTimeout(() => {
        ElMessage.success("密码修改成功，请重新登录");
        passwordDialogVisible.value = false;
        resetPasswordForm();
        localStorage.clear();
        sessionStorage.clear();
        router.push("/login");
        passwordLoading.value = false;
      }, 1000);
    }
  });
};

const resetPasswordForm = () => {
  passwordForm.value = {
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
  passwordFormRef.value?.clearValidate();
};

const handleContextMenuVisible = (visible: boolean, tag: any) => {
  if (visible) {
    currentContextMenuTag.value = tag;
  }
};

// === 5. 表单验证规则（最后）===
const validateConfirmPassword = (
  rule: any,
  value: string,
  callback: Function
) => {
  if (value !== passwordForm.value.newPassword) {
    callback(new Error("两次输入的密码不一致"));
  } else {
    callback();
  }
};

const passwordRules: FormRules = {
  oldPassword: [
    { required: true, message: "请输入原密码", trigger: "blur" },
    { min: 6, message: "密码长度至少为6位", trigger: "blur" },
  ],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, message: "密码长度至少为6位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请确认新密码", trigger: "blur" },
    { validator: validateConfirmPassword, trigger: "blur" },
  ],
};

// === 6. 生命周期钩子（最后）===
onMounted(() => {
  if (route.meta && route.meta.title) {
    addTagView();
  }
});

// === 7. watch（最后）===
watch(
  () => route.path,
  () => {
    initBreadcrumb();
    addTagView();
    moveToCurrentTag();
  },
  { immediate: true }
);
</script>

<script lang="ts">
export default {
  name: "LayoutAdmin",
};
</script>

<style lang="scss" scoped>
// 样式部分完全不变
$menu-bg: #304156;
$menu-text: #bfcbd9;
$menu-active-text: #409eff;
$header-bg: #fff;
$border-color: #e4e7ed;

.admin-layout {
  height: 100vh;

  .aside-menu {
    background-color: $menu-bg;
    transition: width 0.3s;
    position: relative;
    box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);

    .logo-container {
      display: flex;
      align-items: center;
      padding: 16px;
      height: 60px;
      background-color: #2b3a4b;
      transition: all 0.3s;
      overflow: hidden;

      &.collapsed {
        justify-content: center;
        padding: 16px 0;
      }

      .logo {
        width: 32px;
        height: 32px;
        margin-right: 10px;
        transition: margin 0.3s;
      }

      .logo-text {
        color: #fff;
        font-size: 18px;
        font-weight: bold;
        white-space: nowrap;
      }
    }

    .menu-scrollbar {
      height: calc(100vh - 120px);
    }

    .menu {
      border-right: none;
    }

    .menu-collapse {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $menu-text;
      cursor: pointer;
      background-color: #2b3a4b;
      transition: all 0.3s;

      &:hover {
        background-color: #263445;
        color: $menu-active-text;
      }
    }
  }

  .main-container {
    background-color: #f0f2f5;

    .header {
      background-color: $header-bg;
      padding: 0;
      height: 100px !important;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
      z-index: 100;

      .header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 20px;
        height: 60px;
        border-bottom: 1px solid $border-color;

        .breadcrumb {
          font-size: 14px;
        }

        .user-info {
          .user-info-trigger {
            display: flex;
            align-items: center;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 4px;
            transition: background-color 0.3s;

            &:hover {
              background-color: #f5f7fa;
            }

            .username {
              margin: 0 8px;
              font-size: 14px;
              color: #606266;
            }
          }
        }
      }

      .tabs-container {
        display: flex;
        align-items: center;
        height: 40px;
        padding: 0 10px;
        background-color: #fff;

        .tabs-scrollbar {
          flex: 1;

          :deep(.el-scrollbar__view) {
            height: 100%;
          }
        }

        .tabs-wrapper {
          display: flex;
          align-items: center;
          height: 100%;
          padding: 0 5px;

          .tab-tag {
            margin: 0 2px;
            cursor: pointer;
            user-select: none;
            border-radius: 2px;
            height: 28px;
            line-height: 28px;
            padding: 0 8px;
            transition: all 0.3s;

            &:hover {
              opacity: 0.8;
            }

            &.is-active {
              background-color: #409eff;
              border-color: #409eff;
              color: #fff;
            }

            .tag-icon {
              margin-right: 4px;
              vertical-align: middle;
            }
          }
        }

        .tabs-action {
          margin-left: 10px;

          .tabs-action-icon {
            cursor: pointer;
            padding: 5px;
            border-radius: 3px;
            transition: background-color 0.3s;

            &:hover {
              background-color: #f5f7fa;
            }
          }
        }
      }
    }

    .main-content {
      padding: 0;
      margin: 10px;
      background-color: #fff;
      border-radius: 4px;
      overflow: hidden;

      .content-scrollbar {
        height: calc(100vh - 140px);

        :deep(.el-scrollbar__view) {
          padding: 20px;
        }
      }
    }
  }
}

// 密码强度条
.password-strength {
  margin-top: 8px;

  .strength-bar {
    height: 4px;
    border-radius: 2px;
    transition: all 0.3s;

    &.weak {
      width: 33%;
      background-color: #f56c6c;
    }

    &.medium {
      width: 66%;
      background-color: #e6a23c;
    }

    &.strong {
      width: 100%;
      background-color: #67c23a;
    }
  }

  .strength-text {
    font-size: 12px;
    color: #909399;
    margin-left: 8px;
  }
}

// 过渡动画
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
