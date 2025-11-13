<template>
  <el-dropdown
    ref="contextDropdown"
    trigger="click"
    :teleported="false"
    :popper-class="`tabs-context-menu ${popperClass}`"
    :popper-options="popperOptions"
  >
    <!-- 占位节点，真正位置由 popper-options 提供 -->
    <span class="context-trigger"></span>
    <template #dropdown>
      <el-dropdown-menu>
        <template v-for="item in menuList" :key="item.key">
          <!-- 分割线 -->
          <!-- <el-dropdown-item
            v-if="item.divided"
            :divided="true"
            style="height: 1px; padding: 0; margin: 4px 0"
          /> -->
          <!-- 普通菜单项 -->
          <el-dropdown-item
            :disabled="item.disabled"
            :icon="item.icon"
            @click="handleClick(item)"
            :divided="item.divided"
          >
            {{ item.label }}
          </el-dropdown-item>
        </template>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
<script lang="ts" setup>
import { nextTick, ref } from "vue";
import type { Placement } from "element-plus";

export interface MenuItem {
  key?: string | number;
  label?: string;
  disabled?: boolean;
  divided?: boolean;
  icon?: any;
  [key: string]: any; // 父组件可以挂任意自定义字段
}

interface Props {
  menuList: MenuItem[];
  popperClass?: string; // 如果父组件想再加一个自定义 class
}
const props = withDefaults(defineProps<Props>(), {
  popperClass: "",
});

const emit = defineEmits<{
  click: [item: MenuItem]; // 把被选中的项抛给父组件
}>();

const contextDropdown = ref(); // el-dropdown 实例

const popperOptions = ref({
  strategy: "fixed" as const,
  placement: "bottom-start" as Placement,
  modifiers: [
    { name: "flip", enabled: false }, // 禁用翻转
    { name: "offset", enabled: false }, // 禁用偏移计算
    { name: "preventOverflow", enabled: false }, // 禁用溢出检测
    { name: "computeStyles", enabled: false }, // 禁用自适应样式
  ],
  // 👇 关键：让 Popper 的容器永远是 body
  popperOptions: {
    strategy: "fixed",
    gpuAcceleration: false,
  },
  // 对于 ElementPlus 2.2+
  teleported: true, // 已经默认 true，再写一次更直观
});

/* 供父组件调用的唯一入口
    例：@contextmenu.prevent="openContextMenu($event, myMenuList)"
*/
function openContextMenu(e: MouseEvent) {
  const item = (e.target as HTMLElement).closest(".el-tabs__item");
  if (!item) return;
  const paneName = item.getAttribute("aria-controls")?.replace("pane-", "");
  if (!paneName) return;

  e.preventDefault();

  // 存储当前鼠标位置
  const x = e.clientX + 10;
  const y = e.clientY + 10;

  nextTick(() => {
    const dd = contextDropdown.value;
    if (!dd) return;

    // 先打开下拉菜单
    dd.handleOpen();

    // 等待 Popper 完成定位后，强制覆盖位置
    nextTick(() => {
      // 获取真正的 popper DOM 元素
      const popperEl =
        dd.popperRef?.popperContentRef ||
        dd.popperRef?.popper ||
        document.querySelector(".tabs-context-menu");

      if (popperEl) {
        // 禁用 transform 定位，改用 fixed + left/top
        popperEl.style.transform = "none";
        popperEl.style.position = "fixed";
        popperEl.style.left = `${x}px`;
        popperEl.style.top = `${y}px`;
        popperEl.style.zIndex = "9999";
        /* 搬箭头：先找到它，再给它一个固定偏移 */
        const arrow = popperEl.querySelector(
          ".el-popper__arrow"
        ) as HTMLElement;
        if (arrow) {
          arrow.style.top = "-5px";
        }
      }
    }); // 微小延迟确保 Popper 已完成初始渲染
  });
}

/* 点击菜单项 */
function handleClick(item: MenuItem) {
  emit("click", item);
  /* 关闭下拉 */
  /* 关闭下拉 */
  contextDropdown.value.handleClose();
}

/* 把 open 方法暴露出去，父组件也可以通过 ref 调用 */
defineExpose({ openContextMenu });
</script>
<style lang="scss" scoped>
/*  popper 里所有 dropdown 菜单项 */
:deep(.tabs-context-menu) {
  .el-dropdown-menu__item {
    justify-content: flex-end;
  }
}
</style>
