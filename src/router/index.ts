import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useUserStore } from "@/stores/modules/user";
import type { MenuItem } from "@/api/auth";
import { filterMenusByPermission } from "@/utils/permission";

// 基础路由（不需要权限控制的路由）
const baseRoutes: RouteRecordRaw[] = [
  {
    path: "/",
    alias: ["/login"],
    name: "login",
    component: () => import("@/pages/login/index.vue"),
    meta: {
      requiresAuth: false, // 登录页不需要认证
    },
  },
  {
    path: "/unauthorized",
    name: "unauthorized",
    component: () => import("@/pages/unauthorized/index.vue"),
    meta: {
      requiresAuth: false, // 未登录页面不需要认证
    },
  },
  {
    path: "/a",
    name: "login1",
    component: () => import("@/pages/login/index1.vue"),
    meta: {
      requiresAuth: false,
    },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("@/pages/404/index.vue"),
    meta: {
      requiresAuth: false,
    },
  },
];

// 组件路径映射（将后端返回的路径映射到实际的组件）
const componentMap: Record<string, () => Promise<any>> = {
  '@/pages/second/index.vue': () => import('@/pages/second/index.vue'),
  '@/pages/test/index.vue': () => import('@/pages/test/index.vue'),
  '@/pages/originalQuestionBank/index.vue': () => import('@/pages/originalQuestionBank/index.vue'),
  '@/pages/cleaningWarehouse/index.vue': () => import('@/pages/cleaningWarehouse/index.vue'),
  '@/pages/examinationPaper/index.vue': () => import('@/pages/examinationPaper/index.vue'),
  '@/pages/originalQuestionBank/detail/index.vue': () => import('@/pages/originalQuestionBank/detail/index.vue'),
  '@/pages/originalQuestionBank/questionType/index.vue': () => import('@/pages/originalQuestionBank/questionType/index.vue'),
}

// 将菜单转换为路由
function menuToRoute(menu: MenuItem): RouteRecordRaw | null {
  try {
    // 获取组件导入函数
    const componentLoader = componentMap[menu.component]
    if (!componentLoader) {
      console.warn(`未找到组件映射: ${menu.component}`)
      return null
    }

    const route: RouteRecordRaw = {
      path: menu.path,
      name: menu.name,
      component: componentLoader,
      meta: {
        ...menu.meta,
        requiresAuth: menu.meta?.requiresAuth !== false,
        title: menu.meta?.title || menu.name,
        icon: menu.meta?.icon,
        hidden: menu.meta?.hidden || false,
        permissions: menu.permissions || []
      }
    }

    // 处理子路由
    if (menu.children && menu.children.length > 0) {
      route.children = menu.children
        .map(child => menuToRoute(child))
        .filter((r): r is RouteRecordRaw => r !== null)
    }

    return route
  } catch (error) {
    console.error(`转换菜单为路由失败: ${menu.name}`, error)
    return null
  }
}

// 动态添加菜单路由
export function addMenuRoutes() {
  const userStore = useUserStore()
  const menus = userStore.menus

  if (!menus || menus.length === 0) {
    return
  }

  // 过滤菜单（根据权限）
  const filteredMenus = filterMenusByPermission(menus)

  // 将菜单转换为路由
  const menuRoutes = filteredMenus
    .map(menu => menuToRoute(menu))
    .filter((r): r is RouteRecordRaw => r !== null)

  // 添加路由到路由器
  menuRoutes.forEach(route => {
    // 检查路由是否已存在
    if (!router.hasRoute(route.name as string)) {
      router.addRoute(route)
    }
  })
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: baseRoutes,
});

// 路由守卫：检查用户登录状态
router.beforeEach((to, from, next) => {
  // 检查路由是否需要认证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  if (requiresAuth) {
    // 需要认证的路由，检查用户登录状态
    const userStore = useUserStore()
    
    // 尝试恢复 Token（如果存在）
    if (!userStore.token.accessToken) {
      userStore.restoreToken()
    }
    
    // 恢复菜单
    if (userStore.menus.length === 0) {
      userStore.restoreMenus()
    }
    
    // 如果菜单已加载，动态添加路由
    if (userStore.menus.length > 0) {
      addMenuRoutes()
    }
    
    // 检查是否有 access token
    const accessToken = localStorage.getItem('access_token') || userStore.token.accessToken
    
    // 检查用户是否已登录（有 token 且有用户信息）
    // 注意：如果只有 token 但没有用户信息，可能是页面刷新导致的，允许访问
    // 后续可以在需要用户信息的地方再次验证
    if (accessToken) {
      // 有 token，允许访问（即使用户信息可能丢失，可以在页面中重新获取）
      next()
    } else {
      // 未登录，跳转到未登录页面
      next({ name: 'unauthorized' })
    }
  } else {
    // 不需要认证的路由，直接放行
    next()
  }
})

export default router;
