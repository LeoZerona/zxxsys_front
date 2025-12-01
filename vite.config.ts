import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
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
});
