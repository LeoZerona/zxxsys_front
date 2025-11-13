<template>
  <el-dropdown
    ref="contextDropdown"
    trigger="click"
    :teleported="false"
    popper-class="tabs-context-menu"
    :popper-options="popperOptions"
  >
    <!-- 占位节点，真正位置由 popper-options 提供 -->
    <span class="context-trigger"></span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item>关闭其他</el-dropdown-item>
        <el-dropdown-item>关闭右侧</el-dropdown-item>
        <el-dropdown-item>关闭所有</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
<script lang="ts" setup>
import { nextTick, ref } from "vue";
import { Placement } from "element-plus";
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
function openContextMenu(e: MouseEvent) {
  const item = (e.target as HTMLElement).closest(".el-tabs__item");
  if (!item) return;
  const paneName = item.getAttribute("aria-controls")?.replace("pane-", "");
  if (!paneName) return;

  e.preventDefault();
  // rightClickTab = paneName;

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
/* 把 open 方法暴露出去，父组件也可以通过 ref 调用 */
defineExpose({ openContextMenu });
</script>
<style lang="scss" scoped></style>