<template>
  <div class="tool">
    <!-- v-show="!isCollapse" -->
    <el-input
      v-model="menuKey"
      class="responsive-input"
      placeholder="输入菜单检索"
      :prefix-icon="Search"
      :class="isCollapse ? 'shrink-input' : 'expand-input'"
      @keyup.enter="handleSearch"
    />
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
    :collapse="isCollapse"
    @select="handleSelect"
  >
    <!-- 递归渲染菜单 -->
    <template v-for="item in filteredMenu" :key="item.index">
      <!-- 改成 filteredMenu -->
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
import {
  Monitor,
  User,
  Document,
  Setting,
  Search,
} from "@element-plus/icons-vue";

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
    title: "用户管理 123123123123123123",
    icon: User,
    children: [
      { index: "user-list", title: "用户列表 11111231231231231" },
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
/* ---------- 过滤后的菜单 ---------- */
const filteredMenu = ref<MenuItem[]>([]);
const props = defineProps({
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

const isCollapse = ref(false);
const menuKey = ref("");

const handleSelect = (index: string) => {
  emit("select", index);
};

/* ---------- 新增：递归过滤函数 ---------- */
function filterMenu(list: MenuItem[], key: string): MenuItem[] {
  if (!key.trim()) return list; // 空关键字返回原菜单
  const res: MenuItem[] = [];
  list.forEach((item) => {
    const match = item.title.toLowerCase().includes(key.toLowerCase());
    if (item.children) {
      const children = filterMenu(item.children, key);
      if (children.length) {
        res.push({ ...item, children }); // 子节点命中，父节点保留
      }
    } else if (match) {
      res.push(item); // 叶子节点命中
    }
  });
  return res;
}

/* ---------- 新增：回车触发 ---------- */
function handleSearch() {
  const key = menuKey.value;
  const source = props.menuData.length ? props.menuData : defaultMenu;
  filteredMenu.value = filterMenu(source, key);
}

/* ---------- 生命周期：首次默认展示全部 ---------- */
handleSearch(); // 组件挂载后先渲染完整菜单
</script>

<style scoped lang="scss">
@use "@/styles/globalVariable.scss" as g;
.tool {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  padding-left: 13px;
  height: 50px;
  background-color: #304156;
  color: #bfcbd9;

  .responsive-input {
    transform: scaleX(1);
    transform-origin: left center;
    transition: max-width 0.3s ease, opacity 0.2s ease 0.05s,
      transform 0.3s ease;
  }
  .shrink-input {
    max-width: 0;
    opacity: 0;
    padding: 0;
  }
  .expand-input {
    width: 148px;
    opacity: 1;
  }
  .icon {
    margin-left: 10px;
    cursor: pointer;
  }
}

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
    width: 10vw;
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