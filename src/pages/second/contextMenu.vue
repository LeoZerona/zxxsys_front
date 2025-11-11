<!-- src/components/ContextMenu.vue -->
<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="visible"
        class="context-menu"
        :style="{ left: x + 'px', top: y + 'px' }"
        @click.stop
      >
        <el-dropdown-item @click="emit('refresh', currentTab)">
          <el-icon><Refresh /></el-icon> 刷新当前
        </el-dropdown-item>
        <el-dropdown-item
          v-if="!currentTab?.affix"
          @click="emit('close', currentTab)"
        >
          <el-icon><Close /></el-icon> 关闭当前
        </el-dropdown-item>
        <el-dropdown-item @click="emit('closeOther', currentTab)">
          <el-icon><CircleClose /></el-icon> 关闭其他
        </el-dropdown-item>
        <el-dropdown-item @click="emit('closeAll')">
          <el-icon><Minus /></el-icon> 关闭所有
        </el-dropdown-item>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { Refresh, Close, CircleClose, Minus } from "@element-plus/icons-vue";

defineProps<{
  visible: boolean;
  x: number;
  y: number;
  currentTab: any;
}>();

const emit = defineEmits<{
  refresh: [tab: any];
  close: [tab: any];
  closeOther: [tab: any];
  closeAll: [];
}>();
</script>

<style scoped lang="scss">
.context-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 140px;

  .el-dropdown-item {
    padding: 6px 12px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;

    &:hover {
      background-color: #f5f7fa;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>