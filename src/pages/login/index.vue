<template>
  <div class="login-page">
    <div class="login-container">
      <header class="login-header">
        <h1>{{ isRegister ? "创建账户" : "欢迎回来" }}</h1>
        <p>{{ isRegister ? "注册后即可登录后台" : "请登录您的管理员账户" }}</p>
      </header>

      <!-- 表单 -->
      <el-form
        ref="ruleFormRef"
        :model="form"
        :rules="rules"
        @submit.prevent="handleSubmit"
        size="large"
      >
        <!-- 用户名 -->
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            :prefix-icon="User"
            placeholder="请输入用户名"
            clearable
          />
        </el-form-item>

        <!-- 密码 -->
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            :prefix-icon="Lock"
            placeholder="请输入密码"
            show-password
            clearable
          />
        </el-form-item>

        <!-- 确认密码 -->
        <el-form-item v-if="isRegister" prop="confirmPwd">
          <el-input
            v-model="form.confirmPwd"
            type="password"
            :prefix-icon="Lock"
            placeholder="请再次输入密码"
            show-password
            clearable
          />
        </el-form-item>

        <!-- 记住我 & 忘记密码 -->
        <el-form-item v-if="!isRegister">
          <div class="remember-forgot">
            <el-checkbox v-model="form.remember" label="记住我" />
            <el-link type="primary" :underline="false" @click="onForget">
              忘记密码？
            </el-link>
          </div>
        </el-form-item>

        <!-- 提交 -->
        <el-button
          native-type="submit"
          type="primary"
          class="login-button"
          :loading="loading"
        >
          {{ isRegister ? "立即注册" : "登录" }}
        </el-button>

        <!-- 底部切换 -->
        <div class="bottom-switch">
          <span class="hint">{{
            isRegister ? "已有账户？" : "还没有账户？"
          }}</span>
          <el-link type="primary" :underline="false" @click="switchOperation">
            {{ isRegister ? "去登录" : "去注册" }}
          </el-link>
        </div>
      </el-form>
    </div>

    <!-- 忘记密码弹层 -->
    <el-dialog
      v-model="showForgetModal"
      title="重置密码"
      width="380px"
      align-center
      :close-on-click-modal="false"
    >
      <el-input
        v-model="resetEmail"
        type="email"
        placeholder="请输入注册邮箱"
        clearable
      />
      <template #footer>
        <el-button @click="showForgetModal = false">取消</el-button>
        <el-button type="primary" @click="sendResetEmail">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { User, Lock } from "@element-plus/icons-vue";

/* -------------- 状态 -------------- */
const isRegister = ref(false);
const showForgetModal = ref(false);
const resetEmail = ref("");
const loading = ref(false);
const ruleFormRef = ref<FormInstance>();

const form = reactive({
  username: "",
  password: "",
  remember: false,
  confirmPwd: "",
});

/* -------------- 校验规则 -------------- */
const rules = reactive<FormRules>({
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  confirmPwd: [
    {
      validator: (_rule, value, callback) => {
        if (!isRegister.value) return callback();
        if (!value) return callback(new Error("请再次输入密码"));
        if (value !== form.password)
          return callback(new Error("两次密码不一致"));
        callback();
      },
      trigger: "blur",
    },
  ],
});

/* -------------- 提交 -------------- */
const handleSubmit = async () => {
  await ruleFormRef.value?.validate((valid) => {
    if (!valid) {
      ElMessage.error("请检查账号和密码是否输入");
      return;
    }
    loading.value = true;
    setTimeout(() => {
      if (isRegister.value) {
        alert("注册成功，请登录");
        isRegister.value = false;
      } else {
        console.log("[Login]", form);
      }
      loading.value = false;
    }, 600);
  });
};

/* -------------- 忘记密码 -------------- */
const onForget = () => (
  // 弹出忘记密码弹窗前应该先清空
  (resetEmail.value = ""),
  ruleFormRef.value?.resetFields(),
  (showForgetModal.value = true)
);
const sendResetEmail = () => {
  // 判断邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // 如果邮箱格式不正确进行提醒
  if (!emailRegex.test(resetEmail.value)) {
    // 修改为element-plus的提示方式
    ElMessage.error("请输入正确的邮箱格式");
    return;
  }
  console.log("[Reset Email]", resetEmail.value);
  // alert("");
  ElMessage.success("重置链接已发送，请查收邮箱");
  showForgetModal.value = false;
};

/* -------------- 切换操作 -------------- */
const switchOperation = () => {
  isRegister.value = !isRegister.value;
  ruleFormRef.value?.resetFields();
};
</script>

<style lang="scss" scoped>
/* 原样式完全保留，仅把 .text-btn 里的 darken 换成 color.adjust */
@use "sass:color";

$primary: #3498db;
$dark: #2c3e50;
$gray: #7f8c8d;
$radius: 8px;

.login-page {
  min-height: 100vh;
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

/* 记住我 & 忘记密码行 */
.remember-forgot {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 登录按钮 */
.login-button {
  width: 100%;
  margin-top: 10px;
}

/* 底部切换 */
.bottom-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
  gap: 4px;
  font-size: 14px;
  color: $gray;
}

/* 统一文字按钮 */
.el-link {
  font-size: inherit;
  &:hover {
    color: color.adjust($primary, $lightness: -10%);
  }
}

/* 响应式 */
@media (max-width: 480px) {
  .login-container {
    padding: 30px 20px;
  }
  .login-header h1 {
    font-size: 24px;
  }
}
</style>