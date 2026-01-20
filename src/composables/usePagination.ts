import { ref, computed } from "vue";

/**
 * 分页 Composable
 * @param initialPage 初始页码
 * @param initialPageSize 初始每页大小
 * @returns 分页相关的响应式数据和方法
 */
export function usePagination(initialPage = 1, initialPageSize = 10) {
  const page = ref(initialPage);
  const pageSize = ref(initialPageSize);
  const total = ref(0);

  // 总页数
  const totalPages = computed(() => {
    return Math.ceil(total.value / pageSize.value) || 1;
  });

  // 是否是第一页
  const isFirstPage = computed(() => {
    return page.value === 1;
  });

  // 是否是最后一页
  const isLastPage = computed(() => {
    return page.value >= totalPages.value;
  });

  // 设置页码
  const setPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages.value) {
      page.value = newPage;
    }
  };

  // 设置每页大小
  const setPageSize = (newSize: number) => {
    if (newSize > 0) {
      pageSize.value = newSize;
      // 重置到第一页
      page.value = 1;
    }
  };

  // 设置总数
  const setTotal = (newTotal: number) => {
    total.value = Math.max(0, newTotal);
    // 如果当前页超出范围，调整到最后一页
    if (page.value > totalPages.value && totalPages.value > 0) {
      page.value = totalPages.value;
    }
  };

  // 重置分页
  const reset = () => {
    page.value = initialPage;
    pageSize.value = initialPageSize;
    total.value = 0;
  };

  // 下一页
  const nextPage = () => {
    if (!isLastPage.value) {
      page.value++;
    }
  };

  // 上一页
  const prevPage = () => {
    if (!isFirstPage.value) {
      page.value--;
    }
  };

  // 跳转到第一页
  const goToFirstPage = () => {
    page.value = 1;
  };

  // 跳转到最后一页
  const goToLastPage = () => {
    page.value = totalPages.value;
  };

  return {
    page,
    pageSize,
    total,
    totalPages,
    isFirstPage,
    isLastPage,
    setPage,
    setPageSize,
    setTotal,
    reset,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
  };
}

