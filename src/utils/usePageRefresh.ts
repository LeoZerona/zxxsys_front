import { inject, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";

type RefreshFunction = () => void | Promise<void>;

/**
 * 页面刷新功能 composable
 * 用于在页面组件中注册刷新函数，当用户点击导航条右键菜单的"刷新"时，会调用该函数
 * 
 * @example
 * ```vue
 * <script setup>
 * import { usePageRefresh } from '@/utils/usePageRefresh'
 * 
 * async function fetchData() {
 *   // 加载数据的逻辑
 * }
 * 
 * // 注册刷新函数
 * usePageRefresh(fetchData)
 * </script>
 * ```
 */
export function usePageRefresh(refreshFn: RefreshFunction) {
  const route = useRoute();
  const registerPageRefresh = inject<
    (routeName: string, refreshFn: RefreshFunction) => void
  >("registerPageRefresh");
  const unregisterPageRefresh = inject<
    (routeName: string) => void
  >("unregisterPageRefresh");

  if (registerPageRefresh && unregisterPageRefresh) {
    const routeName = route.name as string;
    
    // 注册刷新函数
    registerPageRefresh(routeName, refreshFn);

    // 组件卸载时取消注册
    onBeforeUnmount(() => {
      unregisterPageRefresh(routeName);
    });
  } else {
    console.warn(
      "usePageRefresh: registerPageRefresh 或 unregisterPageRefresh 未找到，请确保在 mainLayout 组件内使用"
    );
  }
}

