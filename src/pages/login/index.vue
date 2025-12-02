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
        <!-- 用户名/邮箱 -->
        <el-form-item prop="username">
          <el-input
            v-model="form.username"
            :prefix-icon="isRegister ? Message : User"
            :placeholder="isRegister ? '请输入邮箱地址' : '请输入用户名'"
            :type="isRegister ? 'email' : 'text'"
            clearable
          />
        </el-form-item>

        <!-- 邮箱验证码（仅注册时显示） -->
        <el-form-item v-if="isRegister" prop="emailCode">
          <div class="code-input-wrapper">
            <el-input
              v-model="form.emailCode"
              :prefix-icon="Message"
              placeholder="请输入6位邮箱验证码"
              clearable
              maxlength="6"
              @input="handleCodeInput"
            />
            <el-button
              :disabled="codeCountdown > 0 || !isValidEmail || sendingCode"
              :loading="sendingCode"
              @click.stop.prevent="sendEmailCode"
              native-type="button"
              class="send-code-btn"
            >
              {{
                codeCountdown > 0 ? `${codeCountdown}秒后重发` : "发送验证码"
              }}
            </el-button>
          </div>
        </el-form-item>

        <!-- 密码 -->
        <el-form-item prop="password">
          <div class="password-input-wrapper">
            <el-input
              v-model="form.password"
              type="password"
              :prefix-icon="Lock"
              :placeholder="isRegister ? '请输入密码（至少8位，包含数字、大小写字母和特殊字符）' : '请输入密码'"
              show-password
              clearable
            />
            <el-popover
              v-if="isRegister && form.password && enablePasswordValidation"
              placement="right"
              :width="220"
              trigger="hover"
              popper-class="password-strength-popover"
            >
              <template #reference>
                <el-icon class="password-hint-icon" :class="{ 'has-error': !isPasswordValid }">
                  <InfoFilled v-if="!isPasswordValid" />
                  <CircleCheck v-else />
                </el-icon>
              </template>
              <div class="password-hint">
                <div class="hint-item" :class="{ valid: passwordChecks.hasNumber }">
                  <span v-if="passwordChecks.hasNumber">✓</span>
                  <span v-else>✗</span>
                  包含数字
                </div>
                <div class="hint-item" :class="{ valid: passwordChecks.hasLowercase }">
                  <span v-if="passwordChecks.hasLowercase">✓</span>
                  <span v-else>✗</span>
                  包含小写字母
                </div>
                <div class="hint-item" :class="{ valid: passwordChecks.hasUppercase }">
                  <span v-if="passwordChecks.hasUppercase">✓</span>
                  <span v-else>✗</span>
                  包含大写字母
                </div>
                <div class="hint-item" :class="{ valid: passwordChecks.hasSpecial }">
                  <span v-if="passwordChecks.hasSpecial">✓</span>
                  <span v-else>✗</span>
                  包含特殊字符
                </div>
                <div class="hint-item" :class="{ valid: passwordChecks.hasMinLength }">
                  <span v-if="passwordChecks.hasMinLength">✓</span>
                  <span v-else>✗</span>
                  长度至少8位（{{ passwordChecks.length }}/8）
                </div>
              </div>
            </el-popover>
          </div>
          <!-- 开发环境：密码强度验证开关 -->
          <div v-if="isRegister && isDev" class="dev-switch">
            <el-switch
              v-model="enablePasswordValidation"
              active-text="启用密码强度验证"
              inactive-text="禁用密码强度验证"
              size="small"
            />
          </div>
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
            <el-link type="primary" underline="never" @click="onForget">
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
          <el-link type="primary" underline="never" @click="switchOperation">
            {{ isRegister ? "去登录" : "去注册" }}
          </el-link>
        </div>
      </el-form>
    </div>

    <!-- 忘记密码弹层 -->
    <el-dialog
      v-model="showForgetModal"
      title="重置密码"
      width="420px"
      align-center
      :close-on-click-modal="false"
      @close="resetForgetPasswordForm"
    >
      <el-form
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        :rules="resetPasswordRules"
        label-width="0"
        size="large"
      >
        <!-- 邮箱 -->
        <el-form-item prop="email">
          <el-input
            v-model="resetPasswordForm.email"
            :prefix-icon="Message"
            type="email"
            placeholder="请输入注册邮箱"
            clearable
          />
        </el-form-item>

        <!-- 验证码 -->
        <el-form-item prop="code">
          <div class="code-input-wrapper">
            <el-input
              v-model="resetPasswordForm.code"
              :prefix-icon="Message"
              placeholder="请输入6位邮箱验证码"
              clearable
              maxlength="6"
              @input="handleResetCodeInput"
            />
            <el-button
              :disabled="resetCodeCountdown > 0 || !isValidResetEmail"
              :loading="sendingResetCode"
              @click="sendResetPasswordCode"
              class="send-code-btn"
            >
              {{
                resetCodeCountdown > 0
                  ? `${resetCodeCountdown}秒后重发`
                  : "发送验证码"
              }}
            </el-button>
          </div>
        </el-form-item>

        <!-- 新密码 -->
        <el-form-item prop="newPassword">
          <div class="password-input-wrapper">
            <el-input
              v-model="resetPasswordForm.newPassword"
              type="password"
              :prefix-icon="Lock"
              placeholder="请输入新密码（至少8位，包含数字、大小写字母和特殊字符）"
              show-password
              clearable
            />
            <el-popover
              v-if="resetPasswordForm.newPassword && enablePasswordValidation"
              placement="right"
              :width="220"
              trigger="hover"
              popper-class="password-strength-popover"
            >
              <template #reference>
                <el-icon class="password-hint-icon" :class="{ 'has-error': !isResetPasswordValid }">
                  <InfoFilled v-if="!isResetPasswordValid" />
                  <CircleCheck v-else />
                </el-icon>
              </template>
              <div class="password-hint">
                <div class="hint-item" :class="{ valid: resetPasswordChecks.hasNumber }">
                  <span v-if="resetPasswordChecks.hasNumber">✓</span>
                  <span v-else>✗</span>
                  包含数字
                </div>
                <div class="hint-item" :class="{ valid: resetPasswordChecks.hasLowercase }">
                  <span v-if="resetPasswordChecks.hasLowercase">✓</span>
                  <span v-else>✗</span>
                  包含小写字母
                </div>
                <div class="hint-item" :class="{ valid: resetPasswordChecks.hasUppercase }">
                  <span v-if="resetPasswordChecks.hasUppercase">✓</span>
                  <span v-else>✗</span>
                  包含大写字母
                </div>
                <div class="hint-item" :class="{ valid: resetPasswordChecks.hasSpecial }">
                  <span v-if="resetPasswordChecks.hasSpecial">✓</span>
                  <span v-else>✗</span>
                  包含特殊字符
                </div>
                <div class="hint-item" :class="{ valid: resetPasswordChecks.hasMinLength }">
                  <span v-if="resetPasswordChecks.hasMinLength">✓</span>
                  <span v-else>✗</span>
                  长度至少8位（{{ resetPasswordChecks.length }}/8）
                </div>
              </div>
            </el-popover>
          </div>
          <!-- 开发环境：密码强度验证开关 -->
          <div v-if="isDev" class="dev-switch">
            <el-switch
              v-model="enablePasswordValidation"
              active-text="启用密码强度验证"
              inactive-text="禁用密码强度验证"
              size="small"
            />
          </div>
        </el-form-item>

        <!-- 确认密码 -->
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="resetPasswordForm.confirmPassword"
            type="password"
            :prefix-icon="Lock"
            placeholder="请再次输入新密码"
            show-password
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showForgetModal = false">取消</el-button>
        <el-button
          type="primary"
          :loading="resetPasswordLoading"
          @click="handleResetPassword"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onBeforeUnmount } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { User, Lock, Message, InfoFilled, CircleCheck } from "@element-plus/icons-vue";
import CryptoJS from "crypto-js";
import { sendVerificationCode, register } from "@/api/auth";

/* -------------- 状态 -------------- */
const isRegister = ref(false);
const showForgetModal = ref(false);
const loading = ref(false);
const ruleFormRef = ref<FormInstance>();
const sendingCode = ref(false); // 发送验证码中
const codeCountdown = ref(0); // 验证码倒计时

// 忘记密码相关状态
const resetPasswordFormRef = ref<FormInstance>();
const resetPasswordLoading = ref(false);
const sendingResetCode = ref(false); // 发送重置密码验证码中
const resetCodeCountdown = ref(0); // 重置密码验证码倒计时

// 判断是否为开发环境
const isDev = import.meta.env.DEV;

// 密码强度验证开关（开发环境默认启用）
const enablePasswordValidation = ref(isDev);

const form = reactive({
  username: isDev ? "123456789@qq.com" : "",
  password: isDev ? "123456" : "",
  remember: false,
  confirmPwd: isDev ? "123456" : "",
  emailCode: isDev ? "123456" : "", // 邮箱验证码
});

// 忘记密码表单
const resetPasswordForm = reactive({
  email: "",
  code: "",
  newPassword: "",
  confirmPassword: "",
});

// 邮箱格式验证
const validateEmail = (_rule: any, value: string, callback: any) => {
  if (!isRegister.value) {
    // 登录时不需要邮箱验证
    callback();
    return;
  }
  if (!value) {
    callback(new Error("请输入邮箱地址"));
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    callback(new Error("请输入正确的邮箱格式"));
    return;
  }
  callback();
};

// 验证码验证
const validateEmailCode = (_rule: any, value: string, callback: any) => {
  if (!isRegister.value) return callback();
  if (!value) {
    callback(new Error("请输入邮箱验证码"));
    return;
  }
  if (!/^\d{6}$/.test(value)) {
    callback(new Error("验证码为6位数字"));
    return;
  }
  callback();
};

// 密码安全性验证
const validatePassword = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error("请输入密码"));
    return;
  }
  
  // 如果禁用了密码强度验证，只检查是否为空
  if (!enablePasswordValidation.value) {
    callback();
    return;
  }
  
  // 检查密码长度（至少8位）
  if (value.length < 8) {
    callback(new Error("密码长度至少为8位"));
    return;
  }
  
  // 检查是否包含数字
  if (!/\d/.test(value)) {
    callback(new Error("密码必须包含至少一个数字"));
    return;
  }
  
  // 检查是否包含小写字母
  if (!/[a-z]/.test(value)) {
    callback(new Error("密码必须包含至少一个小写字母"));
    return;
  }
  
  // 检查是否包含大写字母
  if (!/[A-Z]/.test(value)) {
    callback(new Error("密码必须包含至少一个大写字母"));
    return;
  }
  
  // 检查是否包含特殊字符
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
    callback(new Error("密码必须包含至少一个特殊字符（如 !@#$%^&* 等）"));
    return;
  }
  
  callback();
};

/* -------------- 校验规则 -------------- */
const rules = reactive<FormRules>({
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { validator: validateEmail, trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { validator: validatePassword, trigger: "blur" },
  ],
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
  emailCode: [{ validator: validateEmailCode, trigger: "blur" }],
});

// 计算属性：邮箱是否有效
const isValidEmail = computed(() => {
  if (!isRegister.value) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(form.username);
});

// 密码强度检查计算属性
const passwordChecks = computed(() => {
  const pwd = form.password || '';
  return {
    hasNumber: /\d/.test(pwd),
    hasLowercase: /[a-z]/.test(pwd),
    hasUppercase: /[A-Z]/.test(pwd),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    hasMinLength: pwd.length >= 8,
    length: pwd.length,
  };
});

// 重置密码强度检查计算属性
const resetPasswordChecks = computed(() => {
  const pwd = resetPasswordForm.newPassword || '';
  return {
    hasNumber: /\d/.test(pwd),
    hasLowercase: /[a-z]/.test(pwd),
    hasUppercase: /[A-Z]/.test(pwd),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    hasMinLength: pwd.length >= 8,
    length: pwd.length,
  };
});

// 密码是否有效（所有条件都满足）
const isPasswordValid = computed(() => {
  if (!enablePasswordValidation.value) return true;
  return (
    passwordChecks.value.hasNumber &&
    passwordChecks.value.hasLowercase &&
    passwordChecks.value.hasUppercase &&
    passwordChecks.value.hasSpecial &&
    passwordChecks.value.hasMinLength
  );
});

// 重置密码是否有效
const isResetPasswordValid = computed(() => {
  if (!enablePasswordValidation.value) return true;
  return (
    resetPasswordChecks.value.hasNumber &&
    resetPasswordChecks.value.hasLowercase &&
    resetPasswordChecks.value.hasUppercase &&
    resetPasswordChecks.value.hasSpecial &&
    resetPasswordChecks.value.hasMinLength
  );
});

// 计算属性：重置密码邮箱是否有效
const isValidResetEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(resetPasswordForm.email);
});

// 忘记密码表单验证规则
const validateResetEmail = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error("请输入邮箱地址"));
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    callback(new Error("请输入正确的邮箱格式"));
    return;
  }
  callback();
};

const validateResetCode = (_rule: any, value: string, callback: any) => {
  if (!value) {
    callback(new Error("请输入邮箱验证码"));
    return;
  }
  if (!/^\d{6}$/.test(value)) {
    callback(new Error("验证码为6位数字"));
    return;
  }
  callback();
};

const validateResetConfirmPassword = (
  _rule: any,
  value: string,
  callback: any
) => {
  if (!value) {
    callback(new Error("请再次输入密码"));
    return;
  }
  if (value !== resetPasswordForm.newPassword) {
    callback(new Error("两次密码不一致"));
    return;
  }
  callback();
};

const resetPasswordRules = reactive<FormRules>({
  email: [{ validator: validateResetEmail, trigger: "blur" }],
  code: [{ validator: validateResetCode, trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { validator: validatePassword, trigger: "blur" },
  ],
  confirmPassword: [
    { validator: validateResetConfirmPassword, trigger: "blur" },
  ],
});

/* -------------- 验证码输入处理（只允许数字） -------------- */
const handleCodeInput = (value: string) => {
  // 只保留数字
  form.emailCode = value.replace(/\D/g, "");
};

const handleResetCodeInput = (value: string) => {
  // 只保留数字
  resetPasswordForm.code = value.replace(/\D/g, "");
};

/* -------------- 发送邮箱验证码 -------------- */
let countdownTimer: number | null = null;

const sendEmailCode = async () => {
  // 防止重复点击
  if (sendingCode.value) {
    return;
  }

  if (!isValidEmail.value) {
    ElMessage.error("请先输入正确的邮箱地址");
    return;
  }

  sendingCode.value = true;
  try {
    const response = await sendVerificationCode(form.username);
    
    if (response.success) {
      ElMessage.success(response.message || "验证码已发送，请查收邮箱");
      
      // 如果返回了 cooldown_seconds，使用该值作为倒计时
      const cooldownSeconds = response.cooldown_seconds || 60;
      
      // 清除之前的定时器
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
      
      // 开始倒计时
      codeCountdown.value = cooldownSeconds;
      countdownTimer = window.setInterval(() => {
        codeCountdown.value--;
        if (codeCountdown.value <= 0) {
          if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
          }
        }
      }, 1000);
    }
  } catch (error: any) {
    // 错误信息已经在 request 拦截器中通过 ElMessage 显示
    // 如果返回了 cooldown_seconds，启动对应倒计时
    if (error.cooldown_seconds) {
      const cooldownSeconds = error.cooldown_seconds;
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
      codeCountdown.value = cooldownSeconds;
      countdownTimer = window.setInterval(() => {
        codeCountdown.value--;
        if (codeCountdown.value <= 0) {
          if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
          }
        }
      }, 1000);
    }
  } finally {
    sendingCode.value = false;
  }
};

/* -------------- 提交 -------------- */
const handleSubmit = async () => {
  if (!ruleFormRef.value) return;
  
  await ruleFormRef.value.validate((valid) => {
    if (!valid) {
      const errorMsg = isRegister.value
        ? "请检查邮箱、密码和验证码是否输入正确"
        : "请检查账号和密码是否输入";
      ElMessage.error(errorMsg);
      return;
    }
    
    loading.value = true;
    
    if (isRegister.value) {
      // 注册逻辑
      // 对密码进行MD5加密
      const encryptedPassword = CryptoJS.MD5(form.password).toString();
      
      register(form.username, encryptedPassword, form.emailCode)
        .then((response) => {
          if (response.success) {
            ElMessage.success(response.message || "注册成功，请登录");
            isRegister.value = false;
            ruleFormRef.value?.resetFields();
            // 清除验证码倒计时
            if (countdownTimer) {
              clearInterval(countdownTimer);
              countdownTimer = null;
            }
            codeCountdown.value = 0;
          }
        })
        .catch(() => {
          // 错误信息已经在 request 拦截器中通过 ElMessage 显示
        })
        .finally(() => {
          loading.value = false;
        });
    } else {
      // 登录逻辑（暂时保持原有逻辑，等待登录接口对接）
      // 对密码进行MD5加密
      const encryptedPassword = CryptoJS.MD5(form.password).toString();

      // TODO: 调用登录API
      // await api.login({
      //   username: form.username,
      //   password: encryptedPassword, // 使用加密后的密码
      //   remember: form.remember
      // });
      console.log("[Login]", {
        username: form.username,
        password: encryptedPassword, // 加密后的密码
        remember: form.remember,
      });
      loading.value = false;
    }
  });
};

/* -------------- 忘记密码 -------------- */
const onForget = () => {
  resetForgetPasswordForm();
  showForgetModal.value = true;
};

// 发送重置密码验证码
const sendResetPasswordCode = async () => {
  if (!isValidResetEmail.value) {
    ElMessage.error("请先输入正确的邮箱地址");
    return;
  }

  sendingResetCode.value = true;
  try {
    // TODO: 调用后端API发送验证码
    // await api.sendResetPasswordCode({ email: resetPasswordForm.email });

    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1000));

    ElMessage.success("验证码已发送，请查收邮箱");

    // 开始倒计时
    resetCodeCountdown.value = 60;
    const timer = setInterval(() => {
      resetCodeCountdown.value--;
      if (resetCodeCountdown.value <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  } catch (error) {
    ElMessage.error("发送验证码失败，请稍后重试");
  } finally {
    sendingResetCode.value = false;
  }
};

// 重置密码
const handleResetPassword = async () => {
  if (!resetPasswordFormRef.value) return;

  await resetPasswordFormRef.value.validate((valid) => {
    if (!valid) {
      ElMessage.error("请检查表单信息是否填写正确");
      return;
    }

    resetPasswordLoading.value = true;

    // 对新密码进行MD5加密
    const encryptedPassword = CryptoJS.MD5(
      resetPasswordForm.newPassword
    ).toString();

    // TODO: 调用重置密码API
    // await api.resetPassword({
    //   email: resetPasswordForm.email,
    //   code: resetPasswordForm.code,
    //   newPassword: encryptedPassword, // 使用加密后的密码
    // });

    setTimeout(() => {
      console.log("[Reset Password]", {
        email: resetPasswordForm.email,
        code: resetPasswordForm.code,
        newPassword: encryptedPassword, // 加密后的密码
      });
      ElMessage.success("密码重置成功，请使用新密码登录");
      showForgetModal.value = false;
      resetForgetPasswordForm();
      resetPasswordLoading.value = false;
    }, 1000);
  });
};

// 重置忘记密码表单
const resetForgetPasswordForm = () => {
  resetPasswordForm.email = "";
  resetPasswordForm.code = "";
  resetPasswordForm.newPassword = "";
  resetPasswordForm.confirmPassword = "";
  resetPasswordFormRef.value?.resetFields();
  resetCodeCountdown.value = 0;
  sendingResetCode.value = false;
};

// 组件销毁时清理定时器
onBeforeUnmount(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
});

/* -------------- 切换操作 -------------- */
const switchOperation = () => {
  isRegister.value = !isRegister.value;
  ruleFormRef.value?.resetFields();
  // 重置验证码相关状态
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  codeCountdown.value = 0;
  sendingCode.value = false;
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

/* 验证码输入框容器 */
.code-input-wrapper {
  display: flex;
  gap: 8px;
  width: 100%;

  .el-input {
    flex: 1;
  }

  .send-code-btn {
    flex-shrink: 0;
    white-space: nowrap;
    min-width: 120px;
  }
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

/* 密码输入框容器 */
.password-input-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  
  .el-input {
    flex: 1;
  }
  
  .password-hint-icon {
    font-size: 18px;
    cursor: pointer;
    color: #67c23a;
    transition: color 0.3s;
    flex-shrink: 0;
    
    &.has-error {
      color: #f56c6c;
    }
  }
}

/* 密码强度提示（Popover 内容） */
.password-hint {
  padding: 4px 0;
  font-size: 12px;
  
  .hint-item {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    color: #909399;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    span {
      display: inline-block;
      width: 16px;
      text-align: center;
      font-weight: bold;
      font-size: 14px;
    }
    
    &.valid {
      color: #67c23a;
    }
  }
}

/* 开发环境开关 */
.dev-switch {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
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
