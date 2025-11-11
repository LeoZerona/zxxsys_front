<!-- src/components/ContextMenu.vue -->
<template>
  <el-dropdown
    trigger="contextmenu"
    :popper-options="{ placement: 'bottom-start' }"
    @command="handleCommand"
  >
    <slot />
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="refresh">
          <el-icon><Refresh /></el-icon> 刷新当前
        </el-dropdown-item>
        <el-dropdown-item v-if="!tag.affix" command="close">
          <el-icon><Close /></el-icon> 关闭当前
        </el-dropdown-item>
        <el-dropdown-item command="closeOther">
          <el-icon><CircleClose /></el-icon> 关闭其他
        </el-dropdown-item>
        <el-dropdown-item command="closeAll">
          <el-icon><Minus /></el-icon> 关闭所有
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
  
  <script setup lang="ts">
import { Refresh, Close, CircleClose, Minus } from "@element-plus/icons-vue";

const props = defineProps<{
  tag: any;
}>();

const emit = defineEmits<{
  refresh: [tag: any];
  close: [tag: any];
  closeOther: [tag: any];
  closeAll: [];
}>();

const handleCommand = (command: string) => {
  switch (command) {
    case "refresh":
      emit("refresh", props.tag);
      break;
    case "close":
      emit("close", props.tag);
      break;
    case "closeOther":
      emit("closeOther", props.tag);
      break;
    case "closeAll":
      emit("closeAll");
      break;
  }
};
</script>
