<template>
  <div class="unauthorized-container">
    <div class="unauthorized-content">
      <el-icon class="unauthorized-icon" :size="80" color="#909399">
        <Lock />
      </el-icon>
      <h1 class="unauthorized-title">未登录</h1>
      <p class="unauthorized-message">
        您尚未登录，请先登录后再访问
      </p>
      <div class="countdown-info" v-if="countdown > 0">
        <p>{{ countdown }} 秒后自动跳转到登录页</p>
      </div>
      <div class="action-buttons">
        <el-button type="primary" @click="goToLogin" :loading="isNavigating">
          立即前往登录
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Lock } from '@element-plus/icons-vue'

const router = useRouter()
const countdown = ref(3)
const isNavigating = ref(false)
let countdownTimer: number | null = null

// 跳转到登录页
const goToLogin = () => {
  if (isNavigating.value) return
  isNavigating.value = true
  
  // 清除倒计时
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  
  router.push({ name: 'login' })
}

// 开始倒计时
const startCountdown = () => {
  countdownTimer = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
      goToLogin()
    }
  }, 1000)
}

onMounted(() => {
  startCountdown()
})

onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
})
</script>

<style scoped lang="scss">
.unauthorized-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.unauthorized-content {
  text-align: center;
  background: #fff;
  border-radius: 12px;
  padding: 60px 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.unauthorized-icon {
  margin-bottom: 24px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.unauthorized-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.unauthorized-message {
  font-size: 16px;
  color: #606266;
  margin: 0 0 32px 0;
  line-height: 1.6;
}

.countdown-info {
  margin-bottom: 24px;
  
  p {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>

