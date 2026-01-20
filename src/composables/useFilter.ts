import { ref, reactive, watch } from "vue";
import { useDebounceFn } from "@/utils/debounce";

/**
 * 筛选条件接口
 */
export interface FilterForm {
  [key: string]: any;
}

/**
 * 筛选 Composable
 * @param initialFilters 初始筛选条件
 * @param onFilterChange 筛选条件变化回调
 * @param debounceDelay 防抖延迟时间（毫秒）
 * @returns 筛选相关的响应式数据和方法
 */
export function useFilter(
  initialFilters: FilterForm = {},
  onFilterChange?: (filters: FilterForm) => void,
  debounceDelay = 300
) {
  const filterForm = reactive<FilterForm>({ ...initialFilters });
  const loading = ref(false);

  // 防抖的筛选变化处理
  const handleFilterChange = useDebounceFn(() => {
    if (onFilterChange) {
      onFilterChange({ ...filterForm });
    }
  }, debounceDelay);

  // 监听筛选条件变化
  watch(
    () => filterForm,
    () => {
      handleFilterChange();
    },
    { deep: true }
  );

  // 重置筛选条件
  const resetFilter = () => {
    Object.keys(filterForm).forEach((key) => {
      filterForm[key] = initialFilters[key] ?? undefined;
    });
  };

  // 设置筛选条件
  const setFilter = (key: string, value: any) => {
    filterForm[key] = value;
  };

  // 批量设置筛选条件
  const setFilters = (filters: Partial<FilterForm>) => {
    Object.assign(filterForm, filters);
  };

  // 清除筛选条件
  const clearFilter = () => {
    Object.keys(filterForm).forEach((key) => {
      filterForm[key] = undefined;
    });
  };

  // 获取筛选条件（只返回有值的字段）
  const getActiveFilters = (): FilterForm => {
    const active: FilterForm = {};
    Object.keys(filterForm).forEach((key) => {
      const value = filterForm[key];
      if (value !== undefined && value !== null && value !== "") {
        if (Array.isArray(value) && value.length > 0) {
          active[key] = value;
        } else if (!Array.isArray(value)) {
          active[key] = value;
        }
      }
    });
    return active;
  };

  // 手动触发筛选
  const applyFilter = () => {
    if (onFilterChange) {
      onFilterChange({ ...filterForm });
    }
  };

  return {
    filterForm,
    loading,
    resetFilter,
    setFilter,
    setFilters,
    clearFilter,
    getActiveFilters,
    applyFilter,
  };
}

