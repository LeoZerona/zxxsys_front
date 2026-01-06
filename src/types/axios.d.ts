import "axios";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    /**
     * 是否跳过全局 loading 显示
     * 设置为 true 时，该请求不会触发全局 loading
     * @example
     * ```typescript
     * request.get('/api/data', { skipLoading: true })
     * ```
     */
    skipLoading?: boolean;
  }
}

