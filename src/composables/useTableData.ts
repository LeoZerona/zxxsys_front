import { ref, computed } from "vue";
import type { Ref } from "vue";
import { usePagination } from "./usePagination";
import { useFilter, type FilterForm } from "./useFilter";
import { useLoading } from "@/utils/useLoading";

/**
 * 表格数据 Composable
 * @param fetchFunction 数据获取函数
 * @param options 配置选项
 * @returns 表格相关的响应式数据和方法
 */
export function useTableData<T = any>(
  fetchFunction: (params: any) => Promise<{
    success: boolean;
    data?: {
      list: T[];
      pagination?: {
        total: number;
        page: number;
        page_size: number;
      };
    };
  }>,
  options: {
    initialPage?: number;
    initialPageSize?: number;
    initialFilters?: FilterForm;
    autoFetch?: boolean; // 是否自动获取数据
  } = {}
) {
  const {
    initialPage = 1,
    initialPageSize = 10,
    initialFilters = {},
    autoFetch = true,
  } = options;

  // 分页
  const pagination = usePagination(initialPage, initialPageSize);

  // 筛选
  const filter = useFilter(initialFilters, async () => {
    pagination.setPage(1);
    if (autoFetch) {
      await fetchData();
    }
  });

  // 加载状态
  const { loading, withLoading } = useLoading();

  // 表格数据
  const tableData = ref<T[]>([]) as Ref<T[]>;

  // 数据获取函数
  const fetchData = async () => {
    await withLoading(async () => {
      try {
        const params: any = {
          page: pagination.page.value,
          page_size: pagination.pageSize.value,
          ...filter.getActiveFilters(),
        };

        const response = await fetchFunction(params);

        if (response.success && response.data) {
          tableData.value = response.data.list || [];
          const paginationData = response.data.pagination;
          if (paginationData) {
            pagination.setTotal(paginationData.total);
            pagination.setPage(paginationData.page);
            pagination.setPageSize(paginationData.page_size);
          }
        } else {
          tableData.value = [];
          pagination.setTotal(0);
        }
      } catch (error) {
        console.error("获取表格数据失败:", error);
        tableData.value = [];
        pagination.setTotal(0);
        throw error;
      }
    });
  };

  // 刷新数据
  const refresh = () => {
    return fetchData();
  };

  // 重置筛选和分页
  const reset = () => {
    filter.resetFilter();
    pagination.reset();
    if (autoFetch) {
      fetchData();
    }
  };

  // 监听分页变化，自动获取数据
  if (autoFetch) {
    const watchPage = () => {
      fetchData();
    };
    const watchPageSize = () => {
      pagination.setPage(1);
      fetchData();
    };
    // 注意：这里需要在组件中手动监听，因为 composable 不能直接使用 watch
    // 或者返回 watch 函数让组件调用
  }

  return {
    tableData,
    loading,
    pagination,
    filter,
    fetchData,
    refresh,
    reset,
  };
}

