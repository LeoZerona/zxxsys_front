<template>
  <div class="user-info">
    <el-dropdown @command="handleCommand">
      <span class="el-dropdown-link">
        <el-avatar :size="32" :src="userInfo.avatar" />
        {{ userInfo.name }}
        <el-icon class="el-icon--right"><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="profile">
            <el-icon><User /></el-icon>个人中心
          </el-dropdown-item>
          <el-dropdown-item command="password">
            <el-icon><Lock /></el-icon>修改密码
          </el-dropdown-item>
          <el-dropdown-item command="logout" divided>
            <el-icon><SwitchButton /></el-icon>退出登录
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ArrowDown, User, Lock, SwitchButton } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/modules/user";

// 定义事件
const emit = defineEmits<{
  (e: "command", command: "profile" | "password" | "logout"): void;
}>();

// 获取用户 store
const userStore = useUserStore();

// 用户信息（从 store 获取，如果没有则使用默认值）
const userInfo = computed(() => ({
  name: userStore.currentUser.username || userStore.currentUser.email || "用户",
  avatar: userStore.currentUser.avatar || "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png",
}));

// 处理下拉菜单命令
const handleCommand = (command: "profile" | "password" | "logout") => {
  emit("command", command);
};
</script>

<style scoped lang="scss">
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;

  .el-dropdown-link {
    cursor: pointer;
    color: #409eff;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: color 0.3s;

    &:hover {
      color: #66b1ff;
    }
  }
}
</style>

