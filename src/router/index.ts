import { createRouter, createWebHistory } from "vue-router";

/* 布局 */
const mainLayout = () => import("@/layouts/mainLayout/index.vue");

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
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
    },
    // {
    //   path: "/test",
    //   name: "test",
    //   component: () => import("@/pages/second/test.vue"),
    // },
    // {
    //   path: "/:pathMatch(.*)*",
    //   name: "not-found",
    //   component: () => import("@/pages/second.vue"),
    // },
  ],
});

export default router;
