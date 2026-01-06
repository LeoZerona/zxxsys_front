import { ref } from "vue";
import type { Ref } from "vue";

/**
 * Loading 状态管理 composable
 * 确保 loading 状态在请求完成（成功/失败）或超时后正确关闭
 * 
 * @example
 * ```typescript
 * const { loading, withLoading } = useLoading();
 * 
 * // 方式1：使用 withLoading 包装异步函数
 * await withLoading(async () => {
 *   const data = await fetchData();
 *   // 处理数据
 * });
 * 
 * // 方式2：手动管理（不推荐，除非有特殊需求）
 * loading.value = true;
 * try {
 *   await fetchData();
 * } finally {
 *   loading.value = false;
 * }
 * ```
 */
export function useLoading(initialValue = false) {
  const loading = ref(initialValue);
  const loadingTimeout = ref<number | null>(null);

  /**
   * 包装异步函数，自动管理 loading 状态
   * @param fn 要执行的异步函数
   * @param timeout 超时时间（毫秒），默认使用请求超时时间
   * @returns Promise<T>
   */
  async function withLoading<T>(
    fn: () => Promise<T>,
    timeout?: number
  ): Promise<T> {
    // 如果已经在加载中，直接返回
    if (loading.value) {
      return fn();
    }

    loading.value = true;

    // 设置超时保护
    const timeoutMs = timeout || 30000; // 默认30秒超时
    const timeoutId = window.setTimeout(() => {
      if (loading.value) {
        console.warn(`请求超时 (${timeoutMs}ms)，自动关闭 loading`);
        loading.value = false;
      }
    }, timeoutMs);
    loadingTimeout.value = timeoutId;

    try {
      const result = await fn();
      return result;
    } catch (error) {
      // 错误已经在拦截器中处理，这里只确保 loading 关闭
      throw error;
    } finally {
      // 清除超时定时器
      if (loadingTimeout.value !== null) {
        clearTimeout(loadingTimeout.value);
        loadingTimeout.value = null;
      }
      // 确保 loading 关闭
      loading.value = false;
    }
  }

  /**
   * 手动设置 loading 状态
   * @param value loading 状态值
   */
  function setLoading(value: boolean) {
    // 如果设置为 false，清除超时定时器
    if (!value && loadingTimeout.value !== null) {
      clearTimeout(loadingTimeout.value);
      loadingTimeout.value = null;
    }
    loading.value = value;
  }

  /**
   * 重置 loading 状态（强制关闭）
   */
  function resetLoading() {
    if (loadingTimeout.value !== null) {
      clearTimeout(loadingTimeout.value);
      loadingTimeout.value = null;
    }
    loading.value = false;
  }

  return {
    loading: loading as Ref<boolean>,
    withLoading,
    setLoading,
    resetLoading,
  };
}

