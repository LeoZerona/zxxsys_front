
<template>
  <div class="user-profile">
    <el-card v-if="isLoggedIn" class="profile-card">
      <template #header>
        <div class="card-header">
          <span>用户信息</span>
          <el-switch
            v-model="themeSwitch"
            @change="toggleTheme"
            active-text="深色模式"
            inactive-text="浅色模式"
          />
        </div>
      </template>
      <div class="profile-content">
        <el-avatar :size="64" :src="user.avatar" />
        <div class="user-info">
          <h3>{{ user.name }}</h3>
          <p>角色: {{ user.role }}</p>
          <p>ID: {{ user.id }}</p>
        </div>
      </div>
      <div class="actions">
        <el-button type="primary" @click="simulateLogin">模拟登录</el-button>
        <el-button type="danger" @click="logout">退出登录</el-button>
      </div>
    </el-card>

    <el-card v-else class="login-card">
      <template #header>
        <div class="card-header">
          <span>用户登录</span>
        </div>
      </template>
      <el-form :model="loginForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="simulateLogin">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="settings">
      <h3>应用设置</h3>
      <el-form label-width="100px">
        <el-form-item label="语言">
          <el-select v-model="currentLanguage" @change="changeLanguage">
            <el-option label="中文" value="zh-CN" />
            <el-option label="English" value="en-US" />
          </el-select>
        </el-form-item>
        <el-form-item label="侧边栏">
          <el-switch
            v-model="sidebarCollapsed"
            @change="toggleSidebarState"
            active-text="收起"
            inactive-text="展开"
          />
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/modules/app'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const { user, settings, isLoggedIn } = storeToRefs(appStore)

// 登录表单
const loginForm = ref({
  username: '',
  password: ''
})

// 主题开关
const themeSwitch = computed({
  get: () => settings.value.theme === 'dark',
  set: (value) => appStore.setTheme(value ? 'dark' : 'light')
})

// 当前语言
const currentLanguage = computed({
  get: () => settings.value.language,
  set: (value) => appStore.setLanguage(value as 'zh-CN' | 'en-US')
})

// 侧边栏状态
const sidebarCollapsed = computed({
  get: () => settings.value.sidebarCollapsed,
  set: (value) => appStore.toggleSidebar()
})

// 切换主题
const toggleTheme = (value: boolean) => {
  appStore.setTheme(value ? 'dark' : 'light')
}

// 更改语言
const changeLanguage = (value: string) => {
  appStore.setLanguage(value as 'zh-CN' | 'en-US')
}

// 切换侧边栏状态
const toggleSidebarState = () => {
  appStore.toggleSidebar()
}

// 模拟登录
const simulateLogin = () => {
  appStore.setLoading(true)

  // 模拟登录请求
  setTimeout(() => {
    appStore.setUser({
      id: '12345',
      name: loginForm.value.username || '测试用户',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      role: '管理员'
    })

    appStore.setLoading(false)

    // 重置表单
    loginForm.value = {
      username: '',
      password: ''
    }
  }, 1000)
}

// 退出登录
const logout = () => {
  appStore.clearUser()
}

// 初始化设置
onMounted(() => {
  appStore.initSettings()
})
</script>

<style scoped lang="scss">
.user-profile {
  max-width: 600px;
  margin: 20px auto;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .profile-card, .login-card {
    margin-bottom: 20px;
  }

  .profile-content {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    .user-info {
      margin-left: 20px;

      h3 {
        margin: 0 0 10px;
      }

      p {
        margin: 5px 0;
        color: #666;
      }
    }
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .settings {
    margin-top: 30px;

    h3 {
      margin-bottom: 15px;
    }
  }
}
</style>
