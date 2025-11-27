import { createRouter, createWebHistory } from "vue-router";

/* 布局 */
const mainLayout = () => import("@/layouts/mainLayout/index.vue");

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      alias: ['/login'],
      name: "login",
      component: () => import("@/pages/login/index.vue"),
    },
    {
      path: "/a",
      name: "login1",
      component: () => import("@/pages/login/index1.vue"),
    },
    {
      path: "/second",
      name: "second",
      component: () => import("@/pages/second/index.vue"),
      children: [
        {
          path: "/test",  // 测试页
          name: "test",
          component: () => import("@/pages/test/index.vue"),
        },
        {
          path: "/originalQuestionBank",  // 原题库
          name: "originalQuestionBank",
          component: () => import("@/pages/originalQuestionBank/index.vue"),
        },
        {
          path: "/CleaningWarehouse",  // 清洗库
          name: "CleaningWarehouse",
          component: () => import("@/pages/cleaningWarehouse/index.vue"),
        },
        {
          path: "/examinationPaper",  // 试卷，测试用
          name: "examinationPaper",
          component: () => import("@/pages/examinationPaper/index.vue"),
        },
      ]
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/pages/404/index.vue"),
    },
  ],
});

export default router;
