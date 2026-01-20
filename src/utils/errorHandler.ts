import { ElMessage, ElMessageBox } from "element-plus";

/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK = "network", // 网络错误
  TIMEOUT = "timeout", // 超时错误
  VALIDATION = "validation", // 验证错误
  PERMISSION = "permission", // 权限错误
  SERVER = "server", // 服务器错误
  UNKNOWN = "unknown", // 未知错误
}

/**
 * 错误信息接口
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  code?: string | number;
  status?: number;
  retryable?: boolean; // 是否可重试
  action?: string; // 建议操作
}

/**
 * 判断错误类型
 */
export function getErrorType(error: any): ErrorType {
  if (!error) return ErrorType.UNKNOWN;

  // 网络错误
  if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
    return ErrorType.TIMEOUT;
  }

  if (!error.response && error.request) {
    return ErrorType.NETWORK;
  }

  if (error.response) {
    const status = error.response.status || error.status;

    switch (status) {
      case 400:
        return ErrorType.VALIDATION;
      case 401:
      case 403:
        return ErrorType.PERMISSION;
      case 500:
      case 502:
      case 503:
        return ErrorType.SERVER;
      default:
        return ErrorType.UNKNOWN;
    }
  }

  return ErrorType.UNKNOWN;
}

/**
 * 获取错误信息
 */
export function getErrorInfo(error: any): ErrorInfo {
  const type = getErrorType(error);
  let message = "发生未知错误";
  let code: string | number | undefined;
  let status: number | undefined;
  let retryable = false;
  let action: string | undefined;

  if (error.response) {
    status = error.response.status || error.status;
    const data = error.response.data;
    message = data?.message || error.message || "请求失败";
    code = data?.code || error.code;
  } else if (error.request) {
    message = error.message || "网络错误，请检查网络连接";
    code = error.code;
    retryable = true;
    action = "请检查网络连接后重试";
  } else {
    message = error.message || "发生未知错误";
    code = error.code;
  }

  // 根据错误类型设置默认消息和建议操作
  switch (type) {
    case ErrorType.TIMEOUT:
      message = message || "请求超时，请稍后重试";
      retryable = true;
      action = action || "请稍后重试或检查网络连接";
      break;
    case ErrorType.NETWORK:
      message = message || "网络错误，请检查网络连接";
      retryable = true;
      action = action || "请检查网络连接后重试";
      break;
    case ErrorType.VALIDATION:
      message = message || "请求参数错误";
      break;
    case ErrorType.PERMISSION:
      message = message || "没有权限访问";
      action = "请联系管理员获取权限";
      break;
    case ErrorType.SERVER:
      message = message || "服务器错误";
      retryable = true;
      action = "请稍后重试或联系管理员";
      break;
  }

  return {
    type,
    message,
    code,
    status,
    retryable,
    action,
  };
}

/**
 * 显示错误消息
 */
export function showError(error: any, options?: {
  duration?: number;
  showAction?: boolean;
  onRetry?: () => void;
}): void {
  const { duration = 3000, showAction = false, onRetry } = options || {};
  const errorInfo = getErrorInfo(error);

  // 如果错误已经被处理过，不再重复显示
  if (error._handled) {
    return;
  }

  // 构造消息内容
  let messageContent = errorInfo.message;
  if (errorInfo.action && showAction) {
    messageContent += `\n${errorInfo.action}`;
  }

  // 根据错误类型显示不同类型的消息
  switch (errorInfo.type) {
    case ErrorType.NETWORK:
    case ErrorType.TIMEOUT:
      ElMessage.warning({
        message: messageContent,
        duration,
        showClose: true,
      });
      break;
    case ErrorType.PERMISSION:
      ElMessage.error({
        message: messageContent,
        duration: 0, // 权限错误不自动关闭
        showClose: true,
      });
      break;
    default:
      ElMessage.error({
        message: messageContent,
        duration,
        showClose: true,
      });
  }

  // 标记错误已处理
  error._handled = true;
}

/**
 * 显示错误并询问是否重试
 */
export async function showErrorWithRetry(
  error: any,
  retryFn: () => Promise<void>
): Promise<void> {
  const errorInfo = getErrorInfo(error);

  if (!errorInfo.retryable) {
    showError(error);
    return;
  }

  try {
    await ElMessageBox.confirm(
      `${errorInfo.message}\n\n${errorInfo.action || "是否重试？"}`,
      "操作失败",
      {
        confirmButtonText: "重试",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
    // 用户选择重试
    await retryFn();
  } catch {
    // 用户取消，不做任何操作
  }
}

/**
 * 处理 API 错误
 */
export function handleApiError(error: any): void {
  // 验证码相关错误不在这里处理，由业务代码处理
  const captchaErrorCodes = ["REQUIRES_CAPTCHA", "INVALID_CAPTCHA"];
  if (error.code && captchaErrorCodes.includes(error.code)) {
    return;
  }

  showError(error);
}

