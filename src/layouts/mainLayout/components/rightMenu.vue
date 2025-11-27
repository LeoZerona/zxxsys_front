<template>
  <aside class="sidebar">
    <div class="tool">
      <el-input
        v-model="menuKey"
        class="responsive-input"
        placeholder="输入菜单检索"
        :prefix-icon="Search"
        :class="isCollapse ? 'shrink-input' : 'expand-input'"
        @input="handleInput"
        @keyup.enter="handleSearch"
        @blur="handleSearch"
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
      <template v-for="item in filteredMenu" :key="item.index">
        <el-menu-item v-if="!item.children" :index="item.index">
          <el-icon v-if="item.icon">
            <component :is="item.icon" />
          </el-icon>
          <span v-html="highlight(item.title, menuKey)"></span>
        </el-menu-item>

        <el-sub-menu v-else :index="item.index">
          <template #title>
            <el-icon v-if="item.icon">
              <component :is="item.icon" />
            </el-icon>
            <span v-html="highlight(item.title, menuKey)"></span>
          </template>

          <el-menu-item
            v-for="sub in item.children"
            :key="sub.index"
            :index="sub.index"
          >
            <el-icon v-if="sub.icon">
              <component :is="sub.icon" />
            </el-icon>
            <span v-html="highlight(sub.title, menuKey)"></span>
          </el-menu-item>
        </el-sub-menu>
      </template>
    </el-menu>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Component } from "vue";
import type { PropType } from "vue";
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
  icon?: string | Component;
  children?: MenuItem[];
}

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
      { index: "user-list", title: "用户列表" },
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

const filteredMenu = ref<MenuItem[]>([]);
const props = defineProps({
  activeMenu: { type: String, default: "" },
  menuData: { type: Array as PropType<MenuItem[]>, default: () => [] },
});

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

function filterMenu(list: MenuItem[], key: string): MenuItem[] {
  if (!key.trim()) return list;
  const res: MenuItem[] = [];
  list.forEach((item) => {
    const match = item.title.toLowerCase().includes(key.toLowerCase());
    if (item.children) {
      const children = filterMenu(item.children, key);
      if (children.length || match) {
        res.push({
          ...item,
          children: children.length ? children : item.children,
        });
      }
    } else if (match) {
      res.push(item);
    }
  });
  return res;
}

function highlight(text: string, keyword: string): string {
  if (!keyword.trim()) return text;
  const reg = new RegExp(`(${keyword})`, "gi");
  return text.replace(
    reg,
    '<span style="background:#ff0;color:#000;">$1</span>'
  );
}

let debounceTimer: number | null = null;
function handleInput() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    handleSearch();
  }, 300);
}

function handleSearch() {
  const key = menuKey.value;
  const source = props.menuData.length ? props.menuData : defaultMenu;
  filteredMenu.value = filterMenu(source, key);
}

handleSearch();
</script>

<style scoped lang="scss">
@use "@/styles/globalVariable.scss" as g;
.sidebar {
  background-color: g.$menuBg;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);

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
      width: 144px;
      opacity: 1;
    }
    .icon {
      margin-left: 10px;
      font-size: 24px;
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
}
</style>