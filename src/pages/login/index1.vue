<!-- AuthPage.vue -->
<template>
  <div class="auth-wrapper">
    <!-- 左侧视觉区 -->
    <section class="auth-left">
      <router-link to="/" class="back-to-home">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        返回首页
      </router-link>

      <!-- 粒子宿主（Vue 不管理） -->
      <div id="particles-host" />

      <!-- 其它装饰 -->
      <div class="glow-effect" />
      <div class="glow-effect" />
      <div class="geometric-shape shape-1" />
      <div class="geometric-shape shape-2" />

      <div class="auth-left-content">
        <h2>{{ isLogin ? "欢迎回来" : "创建账户" }}</h2>
        <p
          v-html="
            isLogin
              ? '登录您的管理员账户<br>开始管理您的系统'
              : '注册成为管理员<br>开始您的管理之旅'
          "
        />
      </div>
    </section>

    <!-- 右侧表单区 -->
    <section class="auth-right">
      <div class="right-bg-pattern" />
      <div class="auth-form-container">
        <transition name="form-fade" mode="out-in">
          <!-- 登录 -->
          <div v-if="isLogin" key="login" class="form-container">
            <div class="auth-form-header">
              <h1>管理员登录</h1>
              <p>请输入您的登录凭证</p>
            </div>
            <form @submit.prevent="handleLogin">
              <div class="form-group">
                <label>用户名</label>
                <input
                  v-model="loginForm.username"
                  type="text"
                  placeholder="请输入用户名"
                  required
                />
              </div>
              <div class="form-group">
                <label>密码</label>
                <input
                  v-model="loginForm.password"
                  type="password"
                  placeholder="请输入密码"
                  required
                />
              </div>
              <div class="auth-options">
                <label class="remember-me">
                  <input v-model="loginForm.remember" type="checkbox" /> 记住我
                </label>
                <a class="forgot-password" @click="() => void 0">忘记密码？</a>
              </div>
              <button type="submit" class="auth-button">登录</button>
            </form>
            <div class="auth-switch">
              还没有账户？ <a @click="isLogin = false">立即注册</a>
            </div>
          </div>

          <!-- 注册 -->
          <div v-else key="register" class="form-container">
            <div class="auth-form-header">
              <h1>创建账户</h1>
              <p>请填写您的注册信息</p>
            </div>
            <form @submit.prevent="handleRegister">
              <div class="form-group">
                <label>用户名</label>
                <input
                  v-model="registerForm.username"
                  type="text"
                  placeholder="请输入用户名"
                  required
                />
              </div>
              <div class="form-group">
                <label>邮箱</label>
                <input
                  v-model="registerForm.email"
                  type="email"
                  placeholder="请输入邮箱地址"
                  required
                />
              </div>
              <div class="form-group">
                <label>密码</label>
                <input
                  v-model="registerForm.password"
                  type="password"
                  placeholder="请输入密码（至少6位）"
                  required
                  @input="checkPasswordStrength"
                />
                <div class="password-strength" :class="{ show: strengthShown }">
                  <div class="password-strength-bar" :class="strengthClass" />
                </div>
              </div>
              <div class="form-group">
                <label>确认密码</label>
                <input
                  v-model="registerForm.confirmPassword"
                  type="password"
                  placeholder="请再次输入密码"
                  required
                />
              </div>
              <div class="form-group">
                <label class="remember-me">
                  <input
                    v-model="registerForm.agree"
                    type="checkbox"
                    required
                  />
                  我同意 <a>服务条款</a> 和 <a>隐私政策</a>
                </label>
              </div>
              <button type="submit" class="auth-button">注册</button>
            </form>
            <div class="auth-switch">
              已有账户？ <a @click="isLogin = true">立即登录</a>
            </div>
          </div>
        </transition>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";

/* 1. 状态 */
const isLogin = ref(true);
const strengthShown = ref(false);
const strengthClass = ref<"weak" | "medium" | "strong">("weak");

const loginForm = reactive({
  username: "",
  password: "",
  remember: false,
});

const registerForm = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  agree: false,
});

/* 2. 粒子气泡 - 外挂节点，避免被 Vue 冲掉 */
let particlesHost: HTMLDivElement | null = null;

onMounted(() => {
  // 宿主节点
  particlesHost = document.createElement("div");
  particlesHost.id = "particles-host";
  document.body.appendChild(particlesHost);

  // 生成气泡
  const count = 30;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 20 + 5;
    p.style.cssText = `
      position:absolute;
      width:${size}px;height:${size}px;
      left:${Math.random() * 100}%;
      bottom:-60px;
      background:rgba(255,255,255,.5);
      border-radius:50%;
      animation:float ${Math.random() * 10 + 10}s linear ${
      Math.random() * 5
    }s infinite;
    `;
    particlesHost.appendChild(p);
  }
});

onUnmounted(() => {
  if (particlesHost) {
    document.body.removeChild(particlesHost);
    particlesHost = null;
  }
});

/* 3. 密码强度 */
function checkPasswordStrength() {
  const pwd = registerForm.password;
  strengthShown.value = pwd.length > 0;
  let level = 0;
  if (pwd.length >= 6) level++;
  if (pwd.length >= 10) level++;
  if (/\d/.test(pwd)) level++;
  if (/[a-z]/.test(pwd)) level++;
  if (/[A-Z]/.test(pwd)) level++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) level++;
  if (level <= 2) strengthClass.value = "weak";
  else if (level <= 4) strengthClass.value = "medium";
  else strengthClass.value = "strong";
}

/* 4. 提交 */
function handleLogin() {
  console.log("登录:", loginForm);
  // TODO: 调接口
}

function handleRegister() {
  if (registerForm.password !== registerForm.confirmPassword) {
    alert("两次密码不一致");
    return;
  }
  console.log("注册:", registerForm);
  // TODO: 调接口
}

/* 5. 鼠标视差 */
let mousemoveHandler: ((e: MouseEvent) => void) | null = null;

onMounted(() => {
  mousemoveHandler = (e: MouseEvent) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    document
      .querySelectorAll<HTMLElement>(".geometric-shape")
      .forEach((el, i) => {
        const speed = (i + 1) * 0.5;
        el.style.transform = `translate(${(x - 0.5) * speed * 20}px, ${
          (y - 0.5) * speed * 20
        }px)`;
      });
  };
  document.addEventListener("mousemove", mousemoveHandler);
});

onUnmounted(() => {
  if (mousemoveHandler) {
    document.removeEventListener("mousemove", mousemoveHandler);
    mousemoveHandler = null;
  }
});
</script>

<style lang="scss" scoped>
/* 变量 */
$primary: #667eea;
$secondary: #764ba2;
$gray: #7f8c8d;
$danger: #e74c3c;
$warning: #f39c12;
$success: #27ae60;
$radius: 8px;

/* 关键帧 - 气泡上浮 */
@keyframes float {
  0% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) scale(0.5);
    opacity: 0;
  }
}
@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}
@keyframes rotate {
  0% {
    transform: rotate(45deg);
  }
  100% {
    transform: rotate(405deg);
  }
}
@keyframes float-slow {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}
@keyframes patternFloat {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

/* 布局 */
.auth-wrapper {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 左侧 */
.auth-left {
  flex: 1;
  background: linear-gradient(135deg, $primary 0%, $secondary 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  #particles-host {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 1;
  }
  .glow-effect {
    position: absolute;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.3) 0%,
      transparent 70%
    );
    animation: pulse 4s ease-in-out infinite;
    &:nth-child(3) {
      top: 20%;
      left: 10%;
      animation-delay: 0s;
    }
    &:nth-child(4) {
      bottom: 20%;
      right: 10%;
      animation-delay: 2s;
    }
  }
  .geometric-shape {
    position: absolute;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    &.shape-1 {
      width: 100px;
      height: 100px;
      top: 15%;
      right: 20%;
      transform: rotate(45deg);
      animation: rotate 20s linear infinite;
    }
    &.shape-2 {
      width: 150px;
      height: 150px;
      bottom: 15%;
      left: 15%;
      border-radius: 50%;
      animation: float-slow 8s ease-in-out infinite;
    }
  }
  .auth-left-content {
    text-align: center;
    color: #fff;
    z-index: 10;
    padding: 40px;
    animation: fadeInUp 1s ease-out;
    h2 {
      font-size: 36px;
      margin-bottom: 20px;
      font-weight: 600;
    }
    p {
      font-size: 18px;
      opacity: 0.9;
      line-height: 1.6;
    }
  }
  .back-to-home {
    position: absolute;
    top: 30px;
    left: 30px;
    color: #fff;
    text-decoration: none;
    display: flex;
    align-items: center;
    font-size: 14px;
    opacity: 0.8;
    transition: all 0.3s;
    z-index: 20;
    &:hover {
      opacity: 1;
      transform: translateX(-5px);
    }
  }
}

/* 右侧 */
.auth-right {
  flex: 1;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  overflow: hidden;
  .right-bg-pattern {
    position: absolute;
    inset: 0;
    opacity: 0.05;
    background-image: radial-gradient(
        circle at 20% 80%,
        $primary 0%,
        transparent 50%
      ),
      radial-gradient(circle at 80% 20%, $secondary 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, $primary 0%, transparent 50%);
    animation: patternFloat 20s ease-in-out infinite;
  }
  .auth-form-container {
    width: 100%;
    max-width: 400px;
    position: relative;
    z-index: 1;
  }
  .auth-form-header {
    margin-bottom: 40px;
    animation: fadeInUp 0.8s ease-out;
    h1 {
      color: #2c3e50;
      font-size: 32px;
      margin-bottom: 10px;
    }
    p {
      color: $gray;
      font-size: 16px;
    }
  }
  .form-group {
    margin-bottom: 20px;
    animation: fadeInUp 0.8s ease-out 0.2s both;
    label {
      display: block;
      color: #34495e;
      font-size: 14px;
      margin-bottom: 8px;
      font-weight: 500;
    }
    input {
      width: 100%;
      padding: 14px 16px;
      border: 1px solid #e0e0e0;
      border-radius: $radius;
      font-size: 16px;
      background: #fff;
      transition: all 0.3s;
      &:focus {
        outline: none;
        border-color: $primary;
        box-shadow: 0 0 0 3px rgba($primary, 0.1);
      }
    }
  }
  .auth-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    animation: fadeInUp 0.8s ease-out 0.4s both;
    .remember-me {
      display: flex;
      align-items: center;
      color: $gray;
      font-size: 14px;
      input {
        margin-right: 6px;
      }
    }
    .forgot-password {
      color: $primary;
      font-size: 14px;
      &:hover {
        color: $secondary;
        text-decoration: underline;
      }
    }
  }
  .auth-button {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, $primary 0%, $secondary 100%);
    color: #fff;
    border: none;
    border-radius: $radius;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    animation: fadeInUp 0.8s ease-out 0.6s both;
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba($primary, 0.3);
    }
    &:active {
      transform: translateY(0);
    }
  }
  .auth-switch {
    text-align: center;
    margin-top: 20px;
    color: $gray;
    font-size: 14px;
    animation: fadeInUp 0.8s ease-out 0.8s both;
    a {
      color: $primary;
      font-weight: 600;
      &:hover {
        color: $secondary;
        text-decoration: underline;
      }
    }
  }
}

/* 密码强度 */
.password-strength {
  margin-top: 8px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.3s;
  &.show {
    opacity: 1;
  }
  .password-strength-bar {
    height: 100%;
    width: 0;
    transition: all 0.3s;
    border-radius: 2px;
    &.weak {
      width: 33%;
      background: $danger;
    }
    &.medium {
      width: 66%;
      background: $warning;
    }
    &.strong {
      width: 100%;
      background: $success;
    }
  }
}

/* 表单切换过渡 */
.form-fade-enter-active,
.form-fade-leave-active {
  transition: all 0.3s ease;
}
.form-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.form-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 响应式 */
@media (max-width: 768px) {
  .auth-wrapper {
    flex-direction: column;
  }
  .auth-left {
    display: none;
  }
  .auth-right {
    flex: 1;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    .auth-form-container {
      background: #fff;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }
  }
}
@media (max-width: 480px) {
  .auth-right {
    padding: 20px;
  }
  .auth-form-container {
    padding: 30px 20px;
  }
  .auth-form-header h1 {
    font-size: 28px;
  }
}
</style>