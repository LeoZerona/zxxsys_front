<template>
  <div class="tool">
    <el-icon class="icon" @click="isCollapse = !isCollapse">
      <Expand v-show="isCollapse" />
      <Fold v-show="!isCollapse" />
    </el-icon>
  </div>

  <el-menu
    :default-active="activeMenu"
    class="el-menu-vertical"
    background-color="#304156"
    text-color="#bfcbd9"
    active-text-color="#1890ff"
    :collapse="collapse"
    @select="handleSelect"
  >
    <!-- 递归渲染菜单 -->
    <template v-for="item in menuData" :key="item.index">
      <!-- 叶子节点 -->
      <el-menu-item v-if="!item.children" :index="item.index">
        <el-icon v-if="item.icon">
          <component :is="item.icon" />
        </el-icon>
        <span>{{ item.title }}</span>
      </el-menu-item>

      <!-- 子菜单 -->
      <el-sub-menu v-else :index="item.index">
        <template #title>
          <el-icon v-if="item.icon">
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.title }}</span>
        </template>

        <el-menu-item
          v-for="sub in item.children"
          :key="sub.index"
          :index="sub.index"
        >
          <el-icon v-if="sub.icon">
            <component :is="sub.icon" />
          </el-icon>
          <span>{{ sub.title }}</span>
        </el-menu-item>
      </el-sub-menu>
    </template>
  </el-menu>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Component } from "vue"; // ✅ 仅类型导入，符合 verbatimModuleSyntax
import type { PropType } from "vue";
/* 引入你项目中用到的图标组件 */
import { Monitor, User, Document, Setting } from "@element-plus/icons-vue";

export interface MenuItem {
  index: string;
  title: string;
  icon?: string | Component; // 支持字符串或组件
  children?: MenuItem[];
}

/* 默认菜单 */
const defaultMenu: MenuItem[] = [
  {
    index: "dashboard",
    title: "仪表盘",
    icon: Monitor,
  },
  {
    index: "user",
    title: "用户管理",
    icon: User,
    children: [
      { index: "user-list", title: "用户列表111122222222222222222222222221" },
      { index: "user-role", title: "角色管理" },
    ],
  },
  {
    index: "content",
    title: "内容管理",
    icon: Document,
    children: [
      { index: "article-list", title: "文章列表" },
      { index: "category", title: "分类管理" },
    ],
  },
  {
    index: "settings",
    title: "系统设置",
    icon: Setting,
  },
];

const props = defineProps({
  collapse: { type: Boolean, default: false },
  activeMenu: { type: String, default: "" },
  menuData: { type: Array as PropType<MenuItem[]>, default: () => [] },
});

/* 如果父组件没传 menuData，就用默认菜单 */
const menuData = computed(() =>
  props.menuData.length ? props.menuData : defaultMenu
);

const emit = defineEmits<{
  select: [index: string];
}>();

const handleSelect = (index: string) => {
  emit("select", index);
};

const isCollapse = ref(false);
</script>

<style scoped lang="scss">
@use "@/styles/globalVariable.scss" as g;

.el-menu-vertical {
  border-right: none;

  .el-menu-item {
    width: 10vw;
    background-color: red;
    color: g.$menuText;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    &:hover {
      background-color: g.$menuHover;
    }
    &.is-active {
      background-color: g.$menuActiveBg;
      color: g.$menuActiveText;
      color: rebeccapurple;
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