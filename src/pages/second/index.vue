<!-- AdminLayout.vue (含标签栏) -->
<template>
    <div class="admin-container">
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
            <el-icon><Monitor /></el-icon>
            <span>仪表盘</span>
          </el-menu-item>
  
          <el-sub-menu index="user">
            <template #title>
              <el-icon><User /></el-icon>
              <span>用户管理</span>
            </template>
            <el-menu-item index="user-list">用户列表</el-menu-item>
            <el-menu-item index="user-role">角色管理</el-menu-item>
          </el-sub-menu>
  
          <el-sub-menu index="content">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>内容管理</span>
            </template>
            <el-menu-item index="article-list">文章列表</el-menu-item>
            <el-menu-item index="category">分类管理</el-menu-item>
          </el-sub-menu>
  
          <el-menu-item index="settings">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </aside>
  
      <!-- 主内容区 -->
      <main class="main-content">
        <!-- 顶部导航栏 -->
        <header class="header">
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
  
          <div class="user-info">
            <el-dropdown>
              <span class="el-dropdown-link">
                <el-icon><UserFilled /></el-icon>
                管理员
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>个人中心</el-dropdown-item>
                  <el-dropdown-item>修改密码</el-dropdown-item>
                  <el-dropdown-item divided @click="handleLogout">
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </header>
  
        <!-- 标签栏 -->
        <nav class="tabs-bar">
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
              :label="tab.title"
              :name="tab.name"
            />
          </el-tabs>
          <el-dropdown trigger="click" @command="handleTabsCommand">
            <el-button size="small" class="tabs-more">
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="close-others">关闭其他</el-dropdown-item>
                <el-dropdown-item command="close-right">关闭右侧</el-dropdown-item>
                <el-dropdown-item command="close-all">关闭所有</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </nav>
  
        <!-- 页面主体 -->
        <section class="content">
          <slot />
        </section>
      </main>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import {
    Monitor,
    User,
    Document,
    Setting,
    UserFilled,
    ArrowDown
  } from '@element-plus/icons-vue'
  
  interface Tab {
    name: string
    title: string
  }
  
  const router = useRouter()
  const route = useRoute()
  
  const activeMenu = ref<string>('user-list')
  const visitedTabs = ref<Tab[]>([
    { name: 'user-list', title: '用户列表' }
  ])
  const activeTab = ref<string>('user-list')
  
  const menuTitleMap: Record<string, string> = {
    dashboard: '仪表盘',
    'user-list': '用户列表',
    'user-role': '角色管理',
    'article-list': '文章列表',
    category: '分类管理',
    settings: '系统设置'
  }
  
  const currentPageTitle = computed(() => menuTitleMap[activeMenu.value] ?? '用户列表')
  
  /* 标签栏逻辑 */
  const addTab = (name: string) => {
    const title = menuTitleMap[name]
    if (!title) return
    const exists = visitedTabs.value.some(tab => tab.name === name)
    if (!exists) {
      visitedTabs.value.push({ name, title })
    }
    activeTab.value = name
  }
  
  const closeTab = (name: string) => {
    const idx = visitedTabs.value.findIndex(tab => tab.name === name)
    if (idx === -1) return
    visitedTabs.value.splice(idx, 1)
    if (activeTab.value === name) {
      const nextTab = visitedTabs.value[idx - 1] || visitedTabs.value[0]
      if (nextTab) {
        activeTab.value = nextTab.name
        router.push({ name: nextTab.name })
      }
    }
  }
  
  const handleTabClick = (pane: any) => {
    router.push({ name: pane.props.name })
  }
  
  const handleTabClose = (name: string) => closeTab(name)
  
  const handleTabsCommand = (cmd: string) => {
    const cur = activeTab.value
    const idx = visitedTabs.value.findIndex(t => t.name === cur)
    if (cmd === 'close-others') {
      visitedTabs.value = visitedTabs.value.filter(t => t.name === cur)
    } else if (cmd === 'close-right') {
      visitedTabs.value = visitedTabs.value.slice(0, idx + 1)
    } else if (cmd === 'close-all') {
      visitedTabs.value = [{ name: 'dashboard', title: '仪表盘' }]
      activeTab.value = 'dashboard'
      router.push({ name: 'dashboard' })
    }
  }
  
  const handleMenuSelect = (index: string) => {
    activeMenu.value = index
    addTab(index)
    router.push({ name: index })
  }
  
  const handleLogout = () => {
    // 退出登录逻辑
  }
  
  /* 监听路由变化，自动添加标签 */
  watch(
    () => route.name as string,
    name => {
      if (name && menuTitleMap[name]) {
        activeMenu.value = name
        addTab(name)
      }
    },
    { immediate: true }
  )
  </script>
  
  <style scoped lang="scss">
  @import '@/styles/globalVariable.scss';
  
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
  }
  
  .header {
    height: $headerHeight;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
  
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
  
  .tabs-bar {
    height: $tabsBarHeight;
    background-color: #fff;
    border-bottom: 1px solid #e6e6e6;
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
        border: none;
        height: 32px;
        line-height: 32px;
        padding: 0 12px;
        font-size: 12px;
        color: #666;
        &.is-active {
          background-color: $menuActiveBg;
          color: #fff;
        }
      }
    }
  
    .tabs-more {
      margin-left: 10px;
    }
  }
  
  .content {
    flex: 1;
    padding: 20px;
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