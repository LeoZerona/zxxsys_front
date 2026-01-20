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
          <div v-if="isDev" class="dev-switch">
            <el-switch
              v-model="enablePasswordValidation"
              :active-text="isRegister ? '启用密码强度验证' : '启用密码强度验证'"
              :inactive-text="isRegister ? '禁用密码强度验证' : '禁用密码强度验证'"
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

        <!-- 图形验证码（登录时显示，仅在需要验证码时显示输入框） -->
        <el-form-item v-if="!isRegister && requiresCaptcha" prop="captcha">
          <div class="captcha-wrapper">
            <el-input
              v-model="form.captcha"
              placeholder="请输入验证码"
              maxlength="4"
              clearable
            />
            <div class="captcha-box" @click="refreshCaptcha" title="看不清？点击刷新">
              <canvas
                ref="captchaCanvasRef"
                class="captcha-canvas"
                width="120"
                height="40"
              />
            </div>
          </div>
          <!-- 开发环境：显示正确验证码 -->
          <div v-if="isDev && captchaText" class="dev-captcha-hint">
            <span class="hint-label">开发环境验证码：</span>
            <span class="hint-value">{{ captchaText }}</span>
          </div>
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
import { reactive, ref, computed, onBeforeUnmount, nextTick, watch, onMounted } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { User, Lock, Message, InfoFilled, CircleCheck } from "@element-plus/icons-vue";
import CryptoJS from "crypto-js";
import { useRouter } from "vue-router";
import { sendVerificationCode, register, login, getCaptcha } from "@/api/auth";
import { useUserStore } from "@/stores/modules/user";
import Captcha from "captcha-mini";

/* -------------- 路由和 Store -------------- */
const router = useRouter();
const userStore = useUserStore();

/* -------------- 状态 -------------- */
const isRegister = ref(false);
const showForgetModal = ref(false);
const loading = ref(false);
const ruleFormRef = ref<FormInstance>();
const sendingCode = ref(false); // 发送验证码中
const codeCountdown = ref(0); // 验证码倒计时
const captchaCanvasRef = ref<HTMLCanvasElement | null>(null); // 图形验证码画布
const captchaText = ref(""); // 当前验证码文本
const captchaSessionKey = ref(""); // 验证码会话键（从后端获取）
const requiresCaptcha = ref(false); // 是否需要验证码

// 忘记密码相关状态
const resetPasswordFormRef = ref<FormInstance>();
const resetPasswordLoading = ref(false);
const sendingResetCode = ref(false); // 发送重置密码验证码中
const resetCodeCountdown = ref(0); // 重置密码验证码倒计时

// 判断是否为开发环境
const isDev = import.meta.env.DEV;

// 密码强度验证开关（默认禁用）
const enablePasswordValidation = ref(false);

const form = reactive({
  username: isDev ? "123456789@qq.com" : "",
  password: isDev ? "123456" : "",
  remember: false,
  confirmPwd: isDev ? "123456" : "",
  emailCode: isDev ? "123456" : "", // 邮箱验证码
  captcha: "", // 图形验证码输入
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

// 图形验证码校验
const validateCaptcha = (_rule: any, value: string, callback: any) => {
  if (isRegister.value || !requiresCaptcha.value) return callback();
  if (!value) {
    callback(new Error("请输入验证码"));
    return;
  }
  if (!captchaText.value) {
    refreshCaptcha();
    callback(new Error("验证码加载中，请稍后重试"));
    return;
  }
  // 验证码不区分大小写
  if (value.trim().toLowerCase() !== captchaText.value.toLowerCase()) {
    refreshCaptcha();
    callback(new Error("验证码错误，请重新输入"));
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
  captcha: [
    {
      validator: (_rule: any, value: string, callback: any) => {
        // 如果不需要验证码，直接通过
        if (!requiresCaptcha.value) {
          callback();
          return;
        }
        // 如果需要验证码，调用验证函数
        validateCaptcha(_rule, value, callback);
      },
      trigger: "blur",
    },
  ],
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

/* -------------- 图形验证码 -------------- */
// 从后端获取验证码
const fetchCaptchaFromBackend = async () => {
  try {
    const response = await getCaptcha();
    if (response.success && response.data) {
      captchaText.value = response.data.captcha_code;
      captchaSessionKey.value = response.data.session_key;
      // 使用后端返回的验证码绘制图形
      drawCaptchaWithText(captchaText.value);
      return true;
    }
    return false;
  } catch (error) {
    console.error("获取验证码失败:", error);
    // 如果后端获取失败，使用前端生成的验证码作为降级方案
    drawCaptcha();
    return false;
  }
};

// 使用指定文本绘制验证码图形
const drawCaptchaWithText = (text: string) => {
  if (!captchaCanvasRef.value) return;
  
  const canvas = captchaCanvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // 配置验证码参数
  const captcha = new Captcha({
    fontSize: 22,
    fontFamily: ['Arial', 'Helvetica', 'Georgia', '微软雅黑'],
    lineWidth: 0.8,
    lineNum: 3,
    dotR: 1.5,
    dotNum: 18,
    preGroundColor: [30, 80],
    backGroundColor: [220, 255],
    fontStyle: 'fill',
    length: text.length,
  });
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 绘制背景
  const bgColors = captcha.getColor(captcha.backGroundColor);
  ctx.fillStyle = `rgba(${bgColors[0]}, ${bgColors[1]}, ${bgColors[2]}, 0.8)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 绘制干扰点
  for (let i = 0; i < captcha.dotNum; i++) {
    const x = captcha.getRandom(0, canvas.width);
    const y = captcha.getRandom(0, canvas.height);
    ctx.beginPath();
    ctx.arc(x, y, captcha.dotR, 0, Math.PI * 2, false);
    ctx.closePath();
    const colors = captcha.getColor(captcha.preGroundColor);
    ctx.fillStyle = `rgba(${colors[0]}, ${colors[1]}, ${colors[2]}, 0.6)`;
    ctx.fill();
  }
  
  // 绘制直线干扰线
  for (let i = 0; i < captcha.lineNum; i++) {
    const x = captcha.getRandom(0, canvas.width);
    const y = captcha.getRandom(0, canvas.height);
    const endX = captcha.getRandom(0, canvas.width);
    const endY = captcha.getRandom(0, canvas.height);
    ctx.beginPath();
    ctx.lineWidth = captcha.lineWidth;
    const colors = captcha.getColor(captcha.preGroundColor);
    ctx.strokeStyle = `rgba(${colors[0]}, ${colors[1]}, ${colors[2]}, 0.6)`;
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
  
  // 绘制曲线干扰线
  for (let i = 0; i < 2; i++) {
    const startX = captcha.getRandom(0, canvas.width);
    const startY = captcha.getRandom(0, canvas.height);
    const cp1X = captcha.getRandom(0, canvas.width);
    const cp1Y = captcha.getRandom(0, canvas.height);
    const cp2X = captcha.getRandom(0, canvas.width);
    const cp2Y = captcha.getRandom(0, canvas.height);
    const endX = captcha.getRandom(0, canvas.width);
    const endY = captcha.getRandom(0, canvas.height);
    
    ctx.beginPath();
    ctx.lineWidth = captcha.lineWidth * 0.8;
    const colors = captcha.getColor(captcha.preGroundColor);
    ctx.strokeStyle = `rgba(${colors[0]}, ${colors[1]}, ${colors[2]}, 0.5)`;
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);
    ctx.stroke();
  }
  
  // 绘制文字
  ctx.font = `${captcha.fontSize}px ${captcha.fontFamily[captcha.getRandom(0, captcha.fontFamily.length)]}`;
  ctx.textBaseline = 'middle';
  
  const totalWidth = canvas.width;
  const charWidth = totalWidth / text.length;
  const startOffset = 0.1;
  const endOffset = 0.3;
  
  for (let i = 0; i < text.length; i++) {
    const fontWidth = ctx.measureText(text[i]).width;
    const x = captcha.getRandom(
      charWidth * i + startOffset * fontWidth,
      charWidth * i + endOffset * fontWidth
    );
    const deg = captcha.getRandom(-15, 15);
    const colors = captcha.getColor(captcha.preGroundColor);
    ctx.fillStyle = `rgba(${colors[0]}, ${colors[1]}, ${colors[2]}, 0.9)`;
    ctx.save();
    ctx.translate(x, canvas.height / 2);
    ctx.rotate(deg * Math.PI / 180);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }
};

// 前端生成验证码（降级方案）
const drawCaptcha = async () => {
  await nextTick();
  if (!captchaCanvasRef.value) return;
  
  const captcha = new Captcha({
    fontSize: 22,
    fontFamily: ['Arial', 'Helvetica', 'Georgia', '微软雅黑'],
    lineWidth: 0.8,
    lineNum: 3,
    dotR: 1.5,
    dotNum: 18,
    preGroundColor: [30, 80],
    backGroundColor: [220, 255],
    fontStyle: 'fill',
    length: 4,
  });
  
  const captchaTextValue = captcha.getText();
  captchaText.value = captchaTextValue;
  drawCaptchaWithText(captchaTextValue);
};

const refreshCaptcha = async () => {
  form.captcha = "";
  // 如果需要验证码，从后端获取；否则使用前端生成
  if (requiresCaptcha.value) {
    await fetchCaptchaFromBackend();
  } else {
    drawCaptcha();
  }
};

onMounted(() => {
  if (!isRegister.value) {
    // 初始加载时不需要验证码，使用前端生成的验证码
    drawCaptcha();
  }
});

watch(isRegister, (val) => {
  form.captcha = "";
  requiresCaptcha.value = false;
  captchaSessionKey.value = "";
  if (!val) {
    // 切换到登录时，如果不需要验证码，使用前端生成的验证码
    drawCaptcha();
  } else {
    captchaText.value = "";
  }
});

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
      // 登录逻辑
      // 对密码进行MD5加密
      const encryptedPassword = CryptoJS.MD5(form.password).toString();
      
      // 如果需要验证码，传递验证码参数
      const captchaKey = requiresCaptcha.value ? captchaSessionKey.value : undefined;
      const captchaCode = requiresCaptcha.value ? form.captcha : undefined;
      
      login(form.username, encryptedPassword, captchaKey, captchaCode)
        .then((response) => {
          if (response.success && response.data) {
            const { user, access_token, refresh_token, expires_in } = response.data;
            
            // 保存用户信息和 Token
            userStore.setCurrentUser({
              id: user.id,
              email: user.email,
              username: user.email.split('@')[0], // 从邮箱提取用户名
              role: user.role,
              roles: [user.role],
              is_active: user.is_active,
              avatar: '',
              permissions: []
            });
            userStore.setToken(access_token, refresh_token, expires_in);
            
            // 初始化Token自动刷新
            import('@/utils/request').then(({ initTokenAutoRefresh }) => {
              initTokenAutoRefresh();
            });
            
            ElMessage.success(response.message || "登录成功");
            
            // 登录成功后重置验证码状态
            requiresCaptcha.value = false;
            captchaSessionKey.value = "";
            form.captcha = "";
            
            // 跳转到首页或指定页面
            router.push({ name: "originalQuestionBank" });
          }
        })
        .catch((error: any) => {
          // 检查是否需要验证码
          if (error.code === 'REQUIRES_CAPTCHA' || error.requires_captcha) {
            requiresCaptcha.value = true;
            // 自动获取验证码
            fetchCaptchaFromBackend().then((success) => {
              if (success) {
                ElMessage.warning("登录失败次数过多，请输入验证码");
              }
            });
          } else if (error.code === 'INVALID_CAPTCHA') {
            // 验证码错误，刷新验证码
            if (requiresCaptcha.value) {
              fetchCaptchaFromBackend();
            }
          }
          // 其他错误信息已经在 request 拦截器中通过 ElMessage 显示
        })
        .finally(() => {
          loading.value = false;
        });
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
  // 切回登录时刷新图形验证码
  if (!isRegister.value) {
    refreshCaptcha();
  }
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

/* 图形验证码 */
.captcha-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;

  .captcha-box {
    width: 120px;
    height: 40px; // 匹配 Element Plus large 输入框高度
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    overflow: hidden;
    background: #f8f9fa;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s, box-shadow 0.2s;
    flex-shrink: 0;

    &:hover {
      border-color: color.adjust($primary, $lightness: -10%);
      box-shadow: 0 0 0 2px rgba($primary, 0.1);
    }
  }

  .captcha-canvas {
    width: 120px;
    height: 40px; // 匹配 Element Plus large 输入框高度
    display: block;
    // 确保 canvas 清晰渲染
    image-rendering: auto;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
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

/* 开发环境验证码提示 */
.dev-captcha-hint {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 4px;
  font-size: 12px;
  color: #0369a1;
  display: flex;
  align-items: center;
  gap: 6px;

  .hint-label {
    font-weight: 500;
    color: #0284c7;
  }

  .hint-value {
    font-weight: 600;
    font-size: 14px;
    color: #0c4a6e;
    letter-spacing: 2px;
    font-family: 'Courier New', monospace;
  }
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
