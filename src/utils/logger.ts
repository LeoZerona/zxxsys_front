/**
 * 统一的日志工具
 * 用于替代硬编码的调试日志代码
 */

interface LogData {
  location?: string;
  message: string;
  data?: any;
  timestamp?: number;
  sessionId?: string;
  runId?: string;
  hypothesisId?: string;
}

interface LoggerConfig {
  enabled: boolean;
  endpoint?: string;
  endpointId?: string;
  sessionId?: string;
  runId?: string;
}

// 从环境变量读取配置
const getLoggerConfig = (): LoggerConfig => {
  const enabled = import.meta.env.VITE_DEBUG_LOG === 'true' || import.meta.env.DEV;
  const endpoint = import.meta.env.VITE_DEBUG_LOG_ENDPOINT;
  const endpointId = import.meta.env.VITE_DEBUG_LOG_ENDPOINT_ID;
  
  return {
    enabled: enabled && !!endpoint && !!endpointId,
    endpoint,
    endpointId,
    sessionId: import.meta.env.VITE_DEBUG_LOG_SESSION_ID || 'default-session',
    runId: import.meta.env.VITE_DEBUG_LOG_RUN_ID || 'run1',
  };
};

const config = getLoggerConfig();

/**
 * 发送调试日志
 * @param logData 日志数据
 */
export function debugLog(logData: LogData): void {
  // 如果未启用或配置不完整，直接返回
  if (!config.enabled || !config.endpoint || !config.endpointId) {
    return;
  }

  try {
    const payload = {
      location: logData.location,
      message: logData.message,
      data: logData.data,
      timestamp: logData.timestamp || Date.now(),
      sessionId: logData.sessionId || config.sessionId,
      runId: logData.runId || config.runId,
      hypothesisId: logData.hypothesisId,
    };

    // 使用 fetch 发送日志，静默失败（不阻塞主流程）
    fetch(`${config.endpoint}/${config.endpointId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => {
      // 静默失败，不影响主流程
    });
  } catch (error) {
    // 静默失败，不影响主流程
    console.warn('Debug log failed:', error);
  }
}

/**
 * 创建带位置信息的日志函数
 * @param location 代码位置（如 'cleaningWarehouse/index.vue:722'）
 * @returns 日志函数
 */
export function createLogger(location: string) {
  return (message: string, data?: any, hypothesisId?: string) => {
    debugLog({
      location,
      message,
      data,
      hypothesisId,
    });
  };
}

