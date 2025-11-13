<template>
  <div @contextmenu.prevent="openMenu($event)">右键我</div>
  <div @contextmenu.prevent="openMenu($event)">右键我</div>
  <div @contextmenu.prevent="openMenu($event)">右键我</div>

  <span @contextmenu.prevent="openMenu($event)">右键我</span>

  <span @contextmenu.prevent="openMenu($event)">右键我</span>
  <span @contextmenu.prevent="openMenu($event)">右键我</span>

  <span @contextmenu.prevent="openMenu($event)">右键我</span>

  <!-- 1. 直接模板引用 -->
  <ContextMenu ref="ctx" :menu-list="menuList" @click="onMenuClick" />

  <!-- 2. 或者指令式调用（上面 ref 方式已足够） -->
</template>

<script lang="ts" setup>
import { ref } from "vue";
import ContextMenu, { MenuItem } from "@/components/ContextMenu/index.vue";

const ctx = ref<InstanceType<typeof ContextMenu>>();

const menuList = ref<MenuItem[]>([
  { key: "closeOther", label: "关闭其他", icon: "CircleClose" },
  { key: "closeLeft", label: "关闭左侧" },
  { divided: true },
  { key: "closeAll", label: "关闭所有", disabled: false },
]);

function openMenu(e: MouseEvent) {
  /* 把事件传进去，让组件自己定位 */
  ctx.value!.openContextMenu(e);
}

function onMenuClick(item: MenuItem) {
  /* 这里写真正的业务逻辑 */
  console.log("点了：", item.key);
  switch (item.key) {
    case "closeOther":
      /* ... */
      break;
    case "closeLeft":
      /* ... */
      break;
    case "closeAll":
      /* ... */
      break;
  }
}
</script>