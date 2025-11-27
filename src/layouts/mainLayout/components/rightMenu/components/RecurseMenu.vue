<!-- RecurseMenu.vue -->
<template>
  <template v-for="item in menuList" :key="item.index">
    <el-menu-item
      v-if="!item.children || item.children.length === 0"
      :index="item.index"
    >
      <el-icon v-if="item.icon">
        <component :is="item.icon" />
      </el-icon>
      <span v-html="highlight(item.title, keyword)"></span>
    </el-menu-item>

    <el-sub-menu v-else :index="item.index">
      <template #title>
        <el-icon v-if="item.icon">
          <component :is="item.icon" />
        </el-icon>
        <span v-html="highlight(item.title, keyword)"></span>
      </template>
      <!-- 递归渲染子菜单 -->
      <RecurseMenu :menuList="item.children" :keyword="keyword" />
    </el-sub-menu>
  </template>
</template>
  
  <script setup lang="ts">
import type { PropType } from "vue";
import type { Component } from "vue";
import { highlight } from "@/utils/common"; // 把 highlight 提取到 utils 或共享
export interface MenuItem {
  index: string;
  title: string;
  icon?: string | Component;
  children?: MenuItem[];
}
defineProps({
  menuList: {
    type: Array as PropType<MenuItem[]>,
    required: true,
  },
  keyword: {
    type: String,
    default: "",
  },
});
</script>
<style scoped lang="scss">
@use "@/styles/globalVariable.scss" as g;

.el-menu-vertical {
  border-right: none;

  .el-sub-menu__title {
    span {
      width: 6vw;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }

  .el-menu-item {
    width: 100%;
    color: g.$menuText;
    span {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    &:hover {
      background-color: g.$menuHover;
    }
    &.is-active {
      background-color: g.$menuActiveBg;
      color: g.$menuActiveText;
    }
  }

  .el-sub-menu__title {
    color: g.$menuText;
    &:hover {
      background-color: g.$menuHover;
    }
  }
}
</style>