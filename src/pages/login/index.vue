<template>
  <div class="login-page">
    <div class="login-container">
      <header class="login-header">
        <h1>{{ isRegister ? '创建账户' : '欢迎回来' }}</h1>
        <p>{{ isRegister ? '注册后即可登录后台' : '请登录您的管理员账户' }}</p>
      </header>

      <form @submit.prevent="handleSubmit">
        <!-- 用户名 -->
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="请输入用户名"
            required
          />
        </div>

        <!-- 密码 -->
        <div class="form-group">
          <label for="password">{{ isRegister ? '设置密码' : '密码' }}</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            required
          />
        </div>

        <!-- 确认密码（注册时） -->
        <div v-if="isRegister" class="form-group">
          <label for="confirmPwd">确认密码</label>
          <input
            id="confirmPwd"
            v-model="form.confirmPwd"
            type="password"
            placeholder="请再次输入密码"
            required
          />
        </div>

        <!-- 记住我 & 忘记密码（登录时） -->
        <div v-if="!isRegister" class="remember-forgot">
          <label>
            <input v-model="form.remember" type="checkbox" />
            记住我
          </label>
          <a class="text-btn" @click="onForget">忘记密码？</a>
        </div>

        <!-- 提交按钮 -->
        <button type="submit" class="login-button">
          {{ isRegister ? '立即注册' : '登录' }}
        </button>

        <!-- 🔥底部文字切换 -->
        <div class="bottom-switch">
          <span class="hint">{{
            isRegister ? '已有账户？' : '还没有账户？'
          }}</span>
          <a class="text-btn" @click="isRegister = !isRegister">
            {{ isRegister ? '去登录' : '去注册' }}
          </a>
        </div>
      </form>
    </div>

    <!-- 忘记密码弹层（原逻辑不动） -->
    <Teleport to="body">
      <div v-if="showForgetModal" class="modal-mask" @click.self="showForgetModal = false">
        <div class="modal">
          <h3>重置密码</h3>
          <p>请输入您的注册邮箱，我们将发送重置链接。</p>
          <input v-model="resetEmail" type="email" placeholder="邮箱地址" />
          <div class="modal-actions">
            <button class="plain" @click="showForgetModal = false">取消</button>
            <button @click="sendResetEmail">发送</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/* 下方脚本完全不变，仅展示结构 */
import { reactive, ref } from 'vue'

const isRegister = ref(false)
const showForgetModal = ref(false)
const resetEmail = ref('')

const form = reactive({
  username: '',
  password: '',
  remember: false,
  confirmPwd: ''
})

const handleSubmit = () => {
  if (isRegister.value) {
    if (form.password !== form.confirmPwd) {
      alert('两次密码不一致')
      return
    }
    console.log('[Register]', { username: form.username, password: form.password })
    alert('注册成功，请登录')
    isRegister.value = false
  } else {
    console.log('[Login]', { username: form.username, password: form.password, remember: form.remember })
  }
}

const onForget = () => {
  showForgetModal.value = true
}
const sendResetEmail = () => {
  if (!resetEmail.value) return
  console.log('[Reset Email]', resetEmail.value)
  alert('重置链接已发送，请查收邮箱')
  showForgetModal.value = false
}
</script>

<style lang="scss" scoped>
/* —————— 原变量 & 原样式不动 —————— */
$primary: #3498db;
$dark: #2c3e50;
$gray: #7f8c8d;
$radius: 8px;

.login-page {
  min-height: var(--vh);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}
.login-container {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
}
.login-header {
  text-align: center;
  margin-bottom: 30px;
  h1 {
    font-size: 28px;
    font-weight: 600;
    color: $dark;
    margin-bottom: 10px;
  }
  p {
    font-size: 14px;
    color: $gray;
  }
}
.form-group {
  margin-bottom: 20px;
  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #34495e;
    margin-bottom: 8px;
  }
  input {
    width: 100%;
    padding: 12px 16px;
    font-size: 16px;
    border: 1px solid #ddd;
    border-radius: $radius;
    transition: all 0.3s ease;
    &:focus {
      outline: none;
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba($primary, 0.1);
    }
  }
}
.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  font-size: 14px;
  label {
    display: flex;
    align-items: center;
    cursor: pointer;
    color: $gray;
    input {
      margin-right: 6px;
    }
  }
}
.login-button {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  border: none;
  border-radius: $radius;
  background: linear-gradient(135deg, $primary 0%, $dark 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba($primary, 0.3);
  }
  &:active {
    transform: translateY(0);
  }
}

/* —————— 🔥底部文字切换 & 统一文字按钮风格 —————— */
.bottom-switch {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: $gray;
  .hint {
    margin-right: 4px;
  }
}
.text-btn {
  color: $primary;
  cursor: pointer;
  transition: color 0.3s;
  &:hover {
    color: darken($primary, 10%);
    text-decoration: underline;
  }
}

/* —————— 忘记密码弹层样式保持原样 —————— */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal {
  width: 90%;
  max-width: 380px;
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  h3 {
    margin: 0 0 10px;
    font-size: 18px;
    color: $dark;
  }
  p {
    font-size: 14px;
    color: $gray;
    margin-bottom: 20px;
  }
  input {
    width: 100%;
    padding: 10px 12px;
    margin-bottom: 20px;
    border: 1px solid #ddd;
    border-radius: $radius;
    font-size: 14px;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    button {
      padding: 8px 16px;
      font-size: 14px;
      border-radius: $radius;
      border: none;
      cursor: pointer;
      transition: all 0.3s;
      &.plain {
        background: #f1f1f1;
        color: $gray;
        &:hover {
          background: #e1e1e1;
        }
      }
      &:last-child {
        background: $primary;
        color: #fff;
        &:hover {
          background: darken($primary, 8%);
        }
      }
    }
  }
}

/* —————— 原移动端微调 —————— */
@media (max-width: 480px) {
  .login-container {
    padding: 30px 20px;
  }
  .login-header h1 {
    font-size: 24px;
  }
  .form-group input {
    font-size: 14px;
  }
}
</style>