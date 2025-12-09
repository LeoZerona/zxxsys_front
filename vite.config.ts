import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd());
  
  // 获取 API 目标地址，如果没有配置则使用默认值
  const apiTarget = env.VITE_API_TARGET || 'http://192.168.0.101:5000';

  return {
    plugins: [
      vue(),
      AutoImport({
        imports: ["vue", "vue-router", "pinia"], // 需要啥填啥
        dts: "src/types/auto-imports.d.ts", // 生成类型文件
        eslintrc: { enabled: true }, // 自动生成 eslint 白名单
      }),
      Components({
        dirs: ["src/components"], // 自己写的组件目录
        extensions: ["vue"],
        deep: true, // 支持子目录
        dts: "src/types/components.d.ts", // 组件类型文件
        resolvers: [ElementPlusResolver()], // UI 库按需
      }),
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
    // 开发服务器配置
    server: {
      proxy: {
        // 代理所有以 /api 开头的请求
        '/api': {
          target: apiTarget, // 从环境变量读取后端服务地址
          changeOrigin: true, // 改变请求头中的 origin
          secure: false, // 如果是 https 接口，需要配置这个参数
          // rewrite: (path) => path.replace(/^\/api/, ''), // 如果后端接口没有 /api 前缀，可以去掉这行
        },
      },
    },
  };
});
