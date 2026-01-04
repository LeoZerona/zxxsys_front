import { createRouter, createWebHistory } from "vue-router";
import { useUserStore } from "@/stores/modules/user";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
      path: "/second",
      name: "second",
      component: () => import("@/pages/second/index.vue"),
      meta: {
        requiresAuth: true, // 需要登录认证
      },
      children: [
        {
          path: "test", // 测试页
          name: "test",
          component: () => import("@/pages/test/index.vue"),
          meta: {
            requiresAuth: true,
          },
        },
        {
          path: "originalQuestionBank", // 原题库
          name: "originalQuestionBank",
          component: () => import("@/pages/originalQuestionBank/index.vue"),
          meta: {
            requiresAuth: true,
          },
        },
        {
          path: "cleaningWarehouse", // 清洗库
          name: "CleaningWarehouse",
          component: () => import("@/pages/cleaningWarehouse/index.vue"),
          meta: {
            requiresAuth: true,
          },
        },
        {
          path: "examinationPaper", // 试卷，测试用
          name: "examinationPaper",
          component: () => import("@/pages/examinationPaper/index.vue"),
          meta: {
            requiresAuth: true,
          },
        },
        {
          path: "questionBankDetail/:id", // 题库内容详情页
          name: "questionBankDetail",
          component: () => import("@/pages/originalQuestionBank/detail/index.vue"),
          props: true,
          meta: {
            requiresAuth: true,
          },
        },
        {
          path: "questionTypeDetail/:bankId/:type", // 题目类型专门页面
          name: "questionTypeDetail",
          component: () => import("@/pages/originalQuestionBank/questionType/index.vue"),
          props: true,
          meta: {
            requiresAuth: true,
          },
        },
        {
          path: "dedupTaskDetail/:id", // 去重任务详情页
          name: "dedupTaskDetail",
          component: () => import("@/pages/cleaningWarehouse/detail/index.vue"),
          props: true,
          meta: {
            requiresAuth: true,
          },
        },
      ],
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/pages/404/index.vue"),
      meta: {
        requiresAuth: false,
      },
    },
  ],
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
