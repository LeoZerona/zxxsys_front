<template>
  <!-- 触发节点只用来占位，真实位置由 popper 计算后强制覆盖 -->
  <el-dropdown
    ref="dropdownRef"
    trigger="contextmenu"
    :popper-class="popperClass"
    :popper-options="popperOptions"
  >
    <span class="ctx-trigger" />
    <template #dropdown>
      <el-dropdown-menu>
        <template v-for="item in menuList" :key="item.key">
          <!-- 分割线 -->
          <el-dropdown-item
            v-if="item.divided"
            :divided="true"
            style="height: 1px; padding: 0; margin: 4px 0"
          />
          <!-- 普通菜单项 -->
          <el-dropdown-item
            :disabled="item.disabled"
            :icon="item.icon"
            @click="handleClick(item)"
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
  key: string | number;
  label: string;
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

const dropdownRef = ref();

/* 完全禁用 popper 的自动定位，我们自己写死 left/top */
const popperOptions = {
  strategy: "fixed" as const,
  placement: "bottom-start" as Placement,
  modifiers: [
    { name: "flip", enabled: false },
    { name: "offset", enabled: false },
    { name: "preventOverflow", enabled: false },
    { name: "computeStyles", enabled: false },
  ],
};

/* 供父组件调用的唯一入口
     例：@contextmenu.prevent="openContextMenu($event, myMenuList)"
  */
function openContextMenu(e: MouseEvent) {
  e.preventDefault();
  const x = e.clientX;
  const y = e.clientY;

  /* 打开下拉 */
  dropdownRef.value.handleOpen();

  /* 等 popper 节点渲染完，强行覆盖位置 */
  nextTick(() => {
    setTimeout(() => {
      const popperEl =
        dropdownRef.value?.popperRef?.popperContentRef?.contentRef;
      if (!popperEl) return;

      /* 去掉 transform，直接用 fixed + left/top */
      popperEl.style.transform = "none";
      popperEl.style.position = "fixed";
      popperEl.style.left = `${x}px`;
      popperEl.style.top = `${y}px`;
      popperEl.style.zIndex = "9999";

      /* 箭头也藏掉（可选） */
      const arrow = popperEl.querySelector(".el-popper__arrow") as HTMLElement;
      if (arrow) arrow.style.display = "none";
    }, 10);
  });
}

/* 点击菜单项 */
function handleClick(item: MenuItem) {
  emit("click", item);
  /* 关闭下拉 */
  dropdownRef.value.handleClose();
}

/* 把 open 方法暴露出去，父组件也可以通过 ref 调用 */
defineExpose({ openContextMenu });
</script>
  
  <style scoped>
.ctx-trigger {
  position: fixed;
  left: -9999px;
  width: 0;
  height: 0;
}
</style>