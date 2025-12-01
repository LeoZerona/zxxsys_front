<!-- 404.vue -->
<template>
  <div class="error-404">
    <div class="geometric-shape shape-1" />
    <div class="geometric-shape shape-2" />

    <div class="container">
      <h1 class="error-code">404</h1>
      <div class="divider" />
      <h2 class="error-title">{{ title }}</h2>
      <p class="error-message">
        {{ message }}<br />
        {{ subMessage }}
      </p>
      <div class="button-group">
        <el-button type="primary" size="large" @click="goHome">
          返回首页
        </el-button>
        <el-button size="large" @click="goBack"> 返回上页 </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

interface Props {
  title?: string;
  message?: string;
  subMessage?: string;
  homePath?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "页面不存在",
  message: "抱歉，您访问的页面可能已被移除、暂时不可用或链接错误。",
  subMessage: "请检查网址是否正确，或返回首页继续浏览。",
  homePath: "/",
});

const router = useRouter();

const goHome = () => {
  router.push(props.homePath);
};

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.error-404 {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f7fa;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  overflow: hidden;
}

.container {
  text-align: center;
  max-width: 600px;
  padding: 60px 40px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 20px;
  letter-spacing: -5px;
}

.divider {
  width: 60px;
  height: 4px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  margin: 0 auto 30px;
  border-radius: 2px;
}

.error-title {
  font-size: 32px;
  color: #2c3e50;
  margin-bottom: 16px;
  font-weight: 600;
}

.error-message {
  font-size: 18px;
  color: #7f8c8d;
  margin-bottom: 40px;
  line-height: 1.6;
}

.button-group {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.geometric-shape {
  position: absolute;
  opacity: 0.05;
  z-index: 0;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: #1e3c72;
  transform: rotate(45deg);
  top: -150px;
  right: -150px;
}

.shape-2 {
  width: 200px;
  height: 200px;
  background: #2a5298;
  border-radius: 50%;
  bottom: -100px;
  left: -100px;
}

@media (max-width: 768px) {
  .container {
    padding: 40px 24px;
    margin: 20px;
  }

  .error-code {
    font-size: 80px;
  }

  .error-title {
    font-size: 24px;
  }

  .error-message {
    font-size: 16px;
  }

  .button-group {
    flex-direction: column;
    width: 100%;
  }

  .button-group .el-button {
    width: 100%;
  }
}
</style>