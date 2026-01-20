import axios from "axios";
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { ElMessage, ElLoading } from "element-plus";
import type { LoadingInstance } from "element-plus/es/components/loading/src/loading";

// API 基础配置
// 优先使用环境变量 VITE_API_BASE_URL
// 如果没有配置，则根据环境自动选择：
// - 开发环境：使用代理路径 '/api'
// - 测试/生产环境：使用完整 URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "/api" : "http://192.168.0.104:5000/api");

// 后端服务地址（用于获取实际的服务器地址和端口）
// 在开发环境下，VITE_API_BASE_URL 可能是相对路径 '/api'，需要使用 VITE_API_TARGET 来获取实际的后端地址
const BACKEND_SERVER_URL =
  import.meta.env.VITE_API_TARGET || // 优先使用 VITE_API_TARGET（代理目标地址）
  (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")
    ? API_BASE_URL.replace(/\/api.*$/, "") // 从完整的 API_BASE_URL 中提取基础地址
    : null);

// 请求超时时间（从环境变量读取，默认 10 秒）
const REQUEST_TIMEOUT = Number(import.meta.env.VITE_REQUEST_TIMEOUT) || 10000;

// 创建 axios 实例
const request: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// 打印当前环境信息（仅在开发环境或调试模式开启时）
if (import.meta.env.DEV || import.meta.env.VITE_DEBUG === "true") {
  console.log("=== 环境配置信息 ===");
  console.log("环境模式:", import.meta.env.MODE);
  console.log("应用环境:", import.meta.env.VITE_APP_ENV);
  console.log("API Base URL:", API_BASE_URL);
  console.log(
    "后端服务地址:",
    BACKEND_SERVER_URL || "未配置（将从前端地址推断）"
  );
  console.log("请求超时:", REQUEST_TIMEOUT + "ms");
  console.log("==================");
}

// Token 刷新标志，防止并发刷新
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];
let refreshTimer: number | null = null; // Token 自动刷新定时器

// 全局 Loading 管理
let loadingInstance: LoadingInstance | null = null;
let loadingCount = 0; // 请求计数器，用于处理并发请求
const loadingTimeouts = new Map<string, number>(); // 存储每个请求的超时定时器
const loadingConfig = {
  lock: true,
  text: "加载中...",
  background: "rgba(0, 0, 0, 0.7)",
};

/**
 * 生成请求的唯一标识
 */
function getRequestId(config: InternalAxiosRequestConfig): string {
  return `${config.method || "GET"}_${
    config.url
  }_${Date.now()}_${Math.random()}`;
}

/**
 * 显示全局 Loading
 */
function showLoading(config: InternalAxiosRequestConfig) {
  loadingCount++;
  if (loadingCount === 1 && !loadingInstance) {
    loadingInstance = ElLoading.service(loadingConfig);
  }

  // 为每个请求设置超时保护（超时时间 + 1秒缓冲）
  const requestId = getRequestId(config);
  const timeout = config.timeout || REQUEST_TIMEOUT;
  const timeoutId = window.setTimeout(() => {
    console.warn(
      `请求超时保护触发 (${timeout}ms)，强制关闭 loading:`,
      config.url
    );
    hideLoading(config);
    loadingTimeouts.delete(requestId);
  }, timeout + 1000);

  loadingTimeouts.set(requestId, timeoutId);
  (config as any).__requestId = requestId;
}

/**
 * 隐藏全局 Loading
 */
function hideLoading(config?: InternalAxiosRequestConfig) {
  // 清除超时定时器
  if (config) {
    const requestId = (config as any).__requestId;
    if (requestId && loadingTimeouts.has(requestId)) {
      clearTimeout(loadingTimeouts.get(requestId)!);
      loadingTimeouts.delete(requestId);
    }
  }

  loadingCount--;
  if (loadingCount <= 0) {
    loadingCount = 0;
    if (loadingInstance) {
      loadingInstance.close();
      loadingInstance = null;
    }
    // 清除所有超时定时器（安全措施）
    loadingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    loadingTimeouts.clear();
  }
}

/**
 * 强制关闭 Loading（用于超时等情况）
 */
function forceHideLoading() {
  loadingCount = 0;
  // 清除所有超时定时器
  loadingTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  loadingTimeouts.clear();
  if (loadingInstance) {
    loadingInstance.close();
    loadingInstance = null;
  }
}

// 订阅 Token 刷新
function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// 通知所有订阅者
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// 检查并刷新 Token（支持强制刷新）
async function checkAndRefreshToken(
  forceRefresh = false
): Promise<string | null> {
  const refreshTokenValue = localStorage.getItem("refresh_token");
  const expiresAt = localStorage.getItem("token_expires_at");

  if (!refreshTokenValue || !expiresAt) {
    return null;
  }

  // 如果不强制刷新，检查是否即将过期（提前5分钟）
  if (!forceRefresh) {
    const expiresAtTime = parseInt(expiresAt);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    // 如果还没到刷新时间，直接返回当前 token
    if (now < expiresAtTime - fiveMinutes) {
      return localStorage.getItem("access_token");
    }
  }

  // 如果正在刷新，等待刷新完成
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => {
        resolve(token);
      });
    });
  }

  // 开始刷新
  isRefreshing = true;
  try {
    const { refreshToken } = await import("@/api/auth");
    // 刷新token请求不显示loading，避免循环刷新
    const response = await refreshToken(refreshTokenValue);

    if (response.success && response.data) {
      const { access_token, expires_in } = response.data;
      const newExpiresAt = Date.now() + (expires_in - 300) * 1000;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("token_expires_at", newExpiresAt.toString());

      // 更新用户store中的token
      import("@/stores/modules/user").then(({ useUserStore }) => {
        const userStore = useUserStore();
        if (userStore.token.refreshToken) {
          userStore.setToken(
            access_token,
            userStore.token.refreshToken,
            expires_in
          );
        }
      });

      // 通知所有订阅者
      onTokenRefreshed(access_token);
      isRefreshing = false;

      // 设置下一次自动刷新定时器
      setupAutoRefresh(expires_in);

      return access_token;
    }
  } catch (error) {
    // 刷新失败，清除 token
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expires_at");

    // 清除用户状态
    import("@/stores/modules/user").then(({ useUserStore }) => {
      const userStore = useUserStore();
      userStore.clearToken();
    });

    isRefreshing = false;
    return null;
  }

  isRefreshing = false;
  return null;
}

// 设置自动刷新定时器
function setupAutoRefresh(expiresIn: number) {
  // 清除旧的定时器
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  // 计算刷新时间（提前5分钟）
  const refreshDelay = (expiresIn - 300) * 1000;

  if (refreshDelay > 0) {
    refreshTimer = window.setTimeout(() => {
      console.log("Token即将过期，自动刷新...");
      checkAndRefreshToken(true).catch((error) => {
        console.error("自动刷新token失败:", error);
      });
    }, refreshDelay);
  }
}

// 初始化自动刷新（在应用启动时调用）
export function initTokenAutoRefresh() {
  const expiresAt = localStorage.getItem("token_expires_at");
  const refreshToken = localStorage.getItem("refresh_token");

  if (!expiresAt || !refreshToken) {
    return;
  }

  const expiresAtTime = parseInt(expiresAt);
  const now = Date.now();
  const expiresIn = Math.floor((expiresAtTime - now) / 1000);

  if (expiresIn > 0) {
    setupAutoRefresh(expiresIn);
  } else {
    // 如果已经过期，尝试刷新
    checkAndRefreshToken(true).catch((error) => {
      console.error("初始化时刷新token失败:", error);
    });
  }
}

// 请求拦截器
request.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 检查并刷新 Token（如果需要）
    const token = await checkAndRefreshToken();

    // 添加 token 等认证信息
    const accessToken = token || localStorage.getItem("access_token");
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // 如果配置中明确指定不显示 loading，则跳过
    // 可以通过在请求配置中添加 skipLoading: true 来禁用 loading
    if (!(config as any).skipLoading) {
      showLoading(config);
    }

    return config;
  },
  (error: AxiosError) => {
    // 请求配置错误时也要隐藏 loading
    // 如果 error.config 存在，使用它来清除对应的超时定时器
    if (error.config) {
      hideLoading(error.config);
    } else {
      // 如果没有 config，强制关闭所有 loading
      forceHideLoading();
    }
    return Promise.reject(error);
  }
);

/**
 * 从后端服务配置中提取服务器地址和端口号
 * 优先从 VITE_API_TARGET 或完整的 API_BASE_URL 中提取，而不是使用前端地址
 */
function extractBackendServerInfo(): {
  host: string;
  port: string | number;
  protocol: string;
} | null {
  // 优先使用 VITE_API_TARGET（后端服务地址，用于代理）
  if (BACKEND_SERVER_URL) {
    // 确保 URL 包含协议
    let backendUrl = BACKEND_SERVER_URL;
    if (
      !backendUrl.startsWith("http://") &&
      !backendUrl.startsWith("https://")
    ) {
      backendUrl = `http://${backendUrl}`;
    }

    try {
      const urlObj = new URL(backendUrl);
      return {
        protocol: urlObj.protocol.replace(":", ""),
        host: urlObj.hostname,
        port: urlObj.port
          ? parseInt(urlObj.port)
          : urlObj.protocol === "https:"
          ? 443
          : 80,
      };
    } catch (e) {
      // URL 解析失败，尝试手动解析
      try {
        const match = backendUrl.match(
          /^(https?):\/\/([^:/]+)(?::(\d+))?(?:\/.*)?$/
        );
        if (match) {
          return {
            protocol: match[1],
            host: match[2],
            port: match[3]
              ? parseInt(match[3])
              : match[1] === "https"
              ? 443
              : 80,
          };
        }
      } catch (e2) {
        // 手动解析也失败
      }
    }
  }

  // 如果 VITE_API_TARGET 不存在，尝试从完整的 API_BASE_URL 中提取
  if (
    API_BASE_URL &&
    (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://"))
  ) {
    try {
      const urlObj = new URL(API_BASE_URL);
      return {
        protocol: urlObj.protocol.replace(":", ""),
        host: urlObj.hostname,
        port: urlObj.port
          ? parseInt(urlObj.port)
          : urlObj.protocol === "https:"
          ? 443
          : 80,
      };
    } catch (e) {
      // URL 解析失败，尝试手动解析
      try {
        const match = API_BASE_URL.match(
          /^(https?):\/\/([^:/]+)(?::(\d+))?(?:\/.*)?$/
        );
        if (match) {
          return {
            protocol: match[1],
            host: match[2],
            port: match[3]
              ? parseInt(match[3])
              : match[1] === "https"
              ? 443
              : 80,
          };
        }
      } catch (e2) {
        // 手动解析也失败
      }
    }
  }

  // 如果都失败，返回 null（不应该到达这里，因为至少应该有默认值）
  return null;
}

/**
 * 格式化后端服务器信息用于日志输出
 * 始终从后端服务配置中提取，而不是从前端地址
 */
function formatBackendServerInfo(): string {
  const serverInfo = extractBackendServerInfo();
  if (serverInfo) {
    const portDisplay =
      serverInfo.port === 80 || serverInfo.port === 443
        ? ""
        : `:${serverInfo.port}`;
    return `${serverInfo.protocol}://${serverInfo.host}${portDisplay}`;
  }

  // 如果解析失败，尝试返回 VITE_API_TARGET 或 API_BASE_URL
  if (BACKEND_SERVER_URL) {
    return BACKEND_SERVER_URL;
  }
  if (
    API_BASE_URL &&
    (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://"))
  ) {
    return API_BASE_URL.replace(/\/api.*$/, "");
  }

  return "未知（请检查 VITE_API_TARGET 或 VITE_API_BASE_URL 配置）";
}

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    // 隐藏 loading（成功响应）
    const config = response.config as InternalAxiosRequestConfig & {
      skipLoading?: boolean;
    };
    if (!config.skipLoading) {
      hideLoading();
    }

    const { data } = response;

    // 如果后端返回的数据格式是 { success, message, data }
    if (data && typeof data === "object" && "success" in data) {
      // 如果 success 为 false，说明业务逻辑失败
      if (!data.success) {
        const message = data.message || "请求失败";
        // 验证码相关错误不在这里显示消息，由业务代码处理
        const captchaErrorCodes = ["REQUIRES_CAPTCHA", "INVALID_CAPTCHA"];
        if (data.code && captchaErrorCodes.includes(data.code)) {
          // 返回错误对象，包含完整信息，由业务代码处理
          return Promise.reject({
            message,
            code: data.code,
            requires_captcha: data.requires_captcha,
            attempt_count: data.attempt_count,
            _handled: true, // 标记错误已处理，避免重复显示
          });
        }
        // 标记错误已处理，避免在错误响应拦截器中重复显示
        const error = new Error(message) as any;
        error._handled = true;
        ElMessage.error(message);
        return Promise.reject(error);
      }
      // 返回数据部分
      return data;
    }

    // 如果后端直接返回数据，则直接返回
    return data;
  },
  async (error: AxiosError<any>) => {
    // 隐藏 loading（错误响应）
    const config = error.config as InternalAxiosRequestConfig & {
      skipLoading?: boolean;
    };
    if (!config?.skipLoading) {
      hideLoading();
    }

    // 处理 HTTP 错误
    if (error.response) {
      const { status, data } = error.response;

      // 根据状态码处理不同错误
      switch (status) {
        case 400:
          // 验证码相关错误不在这里显示消息，由业务代码处理
          const captchaErrorCodes = ["REQUIRES_CAPTCHA", "INVALID_CAPTCHA"];
          if (data?.code && captchaErrorCodes.includes(data.code)) {
            // 验证码相关错误，不显示通用错误消息，由业务代码处理
            break;
          }
          // 检查错误是否已经在成功响应拦截器中处理过（通过 _handled 标记）
          if (!error._handled) {
            ElMessage.error(data?.message || "请求参数错误");
          }
          break;
        case 401:
          // 处理 Token 过期或无效
          const errorCode = data?.code;
          const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
          };

          // 如果是token过期，尝试自动刷新
          if (
            (errorCode === "TOKEN_EXPIRED" || errorCode === "INVALID_TOKEN") &&
            originalRequest &&
            !originalRequest._retry &&
            originalRequest.url !== "/refresh-token" &&
            !originalRequest.url?.includes("/refresh-token") // 避免刷新token接口本身失败时循环
          ) {
            originalRequest._retry = true;

            try {
              // 尝试刷新token
              const newToken = await checkAndRefreshToken(true);

              if (newToken) {
                // 刷新成功，重试原请求
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                }

                // 不显示loading，因为这是重试请求
                (originalRequest as any).skipLoading = true;

                // 重试原请求
                return request(originalRequest);
              }
            } catch (refreshError) {
              // 刷新token失败，继续执行下面的错误处理
              console.error("刷新token失败:", refreshError);
            }
          }

          // 不可恢复的错误：刷新token失败、refresh_token无效等
          if (
            errorCode === "INVALID_REFRESH_TOKEN" ||
            errorCode === "TOKEN_REVOKED" ||
            errorCode === "USER_NOT_FOUND" ||
            !originalRequest ||
            originalRequest.url === "/refresh-token" ||
            originalRequest.url?.includes("/refresh-token") // 刷新token接口失败
          ) {
            // 清除 token
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            localStorage.removeItem("token_expires_at");

            // 清除用户状态
            import("@/stores/modules/user").then(({ useUserStore }) => {
              const userStore = useUserStore();
              userStore.clearCurrentUser();
              userStore.clearToken();
            });

            ElMessage.error(data?.message || "登录已过期，请重新登录");

            // 跳转到登录页
            if (
              typeof window !== "undefined" &&
              !window.location.pathname.includes("/login")
            ) {
              window.location.href = "/login";
            }
          } else if (originalRequest && !originalRequest._retry) {
            // 其他401错误，且未尝试过刷新
            ElMessage.error(data?.message || "未授权，请重新登录");
          }
          break;
        case 403:
          ElMessage.error("没有权限访问");
          break;
        case 404:
          ElMessage.error("请求的资源不存在");
          break;
        case 429:
          // 频率限制
          const message = data?.message || "请求过于频繁，请稍后再试";
          ElMessage.warning(message);
          break;
        case 500:
          ElMessage.error("服务器内部错误");
          break;
        case 502:
          ElMessage.error("网关错误");
          break;
        case 503:
          ElMessage.error("服务不可用");
          break;
        default:
          ElMessage.error(data?.message || `请求失败 (${status})`);
      }

      // 提取后端服务器地址和端口号信息（从后端服务配置中提取）
      const backendServerInfo = formatBackendServerInfo();
      const backendServerDetails = extractBackendServerInfo();

      // 打印详细的错误信息，包含后端服务器地址和端口号
      console.error("请求失败 (HTTP错误):", {
        message: data?.message || "请求失败",
        status,
        code: data?.code,
        backendServer: backendServerInfo, // 后端服务器地址
        backendServerDetails: backendServerDetails
          ? {
              协议: backendServerDetails.protocol,
              主机: backendServerDetails.host,
              端口: backendServerDetails.port,
            }
          : null,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL
          ? (error.config.baseURL.endsWith("/")
              ? error.config.baseURL.slice(0, -1)
              : error.config.baseURL) +
            (error.config.url?.startsWith("/")
              ? error.config.url
              : "/" + (error.config.url || ""))
          : error.config?.url,
        method: error.config?.method?.toUpperCase(),
        timestamp: new Date().toISOString(),
        data: data?.data,
        cooldown_seconds: data?.cooldown_seconds,
        requires_captcha: data?.requires_captcha,
        attempt_count: data?.attempt_count,
      });

      // 返回错误信息，包含 cooldown_seconds 等额外信息
      return Promise.reject({
        message: data?.message || "请求失败",
        status,
        data: data?.data,
        cooldown_seconds: data?.cooldown_seconds,
        code: data?.code,
        requires_captcha: data?.requires_captcha,
        attempt_count: data?.attempt_count,
      });
    } else if (error.request) {
      // 请求已发出但没有收到响应（可能是超时或网络错误）
      let errorMsg = "网络错误，请检查后端服务是否启动或网络连接是否正常";

      // 检查是否是超时错误
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        errorMsg = `请求超时（${REQUEST_TIMEOUT}ms），请稍后重试`;
        // 超时情况下强制关闭 loading
        if (!config?.skipLoading) {
          forceHideLoading();
        }
      }

      // 提取后端服务器地址和端口号信息（从后端服务配置中提取）
      const backendServerInfo = formatBackendServerInfo();
      const backendServerDetails = extractBackendServerInfo();
      const fullURL = error.config?.baseURL
        ? (error.config.baseURL.endsWith("/")
            ? error.config.baseURL.slice(0, -1)
            : error.config.baseURL) +
          (error.config.url?.startsWith("/")
            ? error.config.url
            : "/" + (error.config.url || ""))
        : error.config?.url || "未知";

      console.error("请求失败 (网络错误):", {
        message: errorMsg,
        backendServer: backendServerInfo, // 后端服务器地址
        backendServerDetails: backendServerDetails
          ? {
              协议: backendServerDetails.protocol,
              主机: backendServerDetails.host,
              端口: backendServerDetails.port,
            }
          : null,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: fullURL,
        method: error.config?.method?.toUpperCase(),
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      });
      ElMessage.error(errorMsg);
      return Promise.reject(new Error(errorMsg));
    } else {
      // 其他错误（如请求配置错误）
      const backendServerInfo = formatBackendServerInfo();
      const backendServerDetails = extractBackendServerInfo();

      console.error("请求配置错误:", {
        error: error.message,
        stack: error.stack,
        backendServer: backendServerInfo, // 后端服务器地址
        backendServerDetails: backendServerDetails
          ? {
              协议: backendServerDetails.protocol,
              主机: backendServerDetails.host,
              端口: backendServerDetails.port,
            }
          : null,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method?.toUpperCase(),
        timestamp: new Date().toISOString(),
        fullError: error,
      });
      ElMessage.error("请求配置错误");
      return Promise.reject(error);
    }
  }
);

export default request;
