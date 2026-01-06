import { io, Socket } from "socket.io-client";
import { ElMessage } from "element-plus";

// WebSocket 服务器地址配置
// 优先使用环境变量 VITE_WS_BASE_URL
// 如果没有配置，则根据环境自动选择：
// - 开发环境：优先使用 VITE_API_TARGET，如果没有则使用 localhost:5000
// - 测试/生产环境：从 VITE_API_BASE_URL 推断基础 URL
const getWebSocketURL = () => {
  // 优先使用专门的 WebSocket 环境变量
  if (import.meta.env.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  
  // 开发环境：优先使用 VITE_API_TARGET（后端服务地址）
  if (import.meta.env.DEV) {
    const apiTarget = import.meta.env.VITE_API_TARGET;
    if (apiTarget && apiTarget.startsWith("http")) {
      return apiTarget;
    }
    // 如果没有配置，使用默认值
    return "http://localhost:5000";
  }
  
  // 生产/测试环境：从 VITE_API_BASE_URL 推断基础 URL
  const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://192.168.0.101:5000/api";
  if (apiUrl.startsWith("http")) {
    // 提取基础 URL（去掉 /api）
    const baseUrl = apiUrl.replace("/api", "");
    return baseUrl;
  }
  
  // 默认值
  return "http://192.168.0.101:5000";
};

// 任务进度数据类型
export interface TaskProgressData {
  task_id: number;
  status: string;
  processed_groups: number;
  total_groups: number;
  progress_percentage: number;
  current_group?: {
    type_name: string;
    subject_name: string;
    channel_code: string;
  };
  message?: string;
}

export interface TaskCompletedData {
  task_id: number;
  data: any;
}

export interface TaskErrorData {
  task_id: number;
  error: string;
}

export interface TaskStatusData {
  task_id: number;
  status: string;
  data: any;
}

// WebSocket 连接管理类
class SocketManager {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private taskRooms: Set<number> = new Set(); // 已加入的任务房间
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private isConnecting: boolean = false; // 是否正在连接中
  private shouldReconnect: boolean = true; // 是否应该重连

  // 连接 WebSocket
  connect(): void {
    // 如果已经连接，直接返回
    if (this.socket?.connected) {
      console.log("WebSocket 已连接");
      return;
    }

    // 如果正在连接中，避免重复连接
    if (this.isConnecting) {
      console.log("WebSocket 正在连接中，跳过重复连接");
      return;
    }

    // 如果超过最大重连次数，停止连接
    if (this.reconnectAttempts >= this.maxReconnectAttempts && !this.shouldReconnect) {
      console.warn("WebSocket 已达到最大重连次数，停止连接");
      return;
    }

    this.isConnecting = true;
    const wsUrl = getWebSocketURL();
    console.log("连接 WebSocket:", wsUrl);

    // 如果已有 socket 实例但未连接，先断开
    if (this.socket && !this.socket.connected) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(wsUrl, {
      transports: ["websocket", "polling"], // 优先使用 WebSocket，失败时降级到轮询
      reconnection: this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts, // 根据重连次数决定是否自动重连
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
      autoConnect: true,
    });

    // 监听连接成功
    this.socket.on("connect", () => {
      this.connected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.shouldReconnect = true;
      console.log("WebSocket 连接成功");

      // 重新加入之前加入的房间
      this.taskRooms.forEach((taskId) => {
        this.joinTask(taskId);
      });
    });

    // 监听连接断开
    this.socket.on("disconnect", (reason) => {
      this.connected = false;
      this.isConnecting = false;
      console.log("WebSocket 断开连接:", reason);
      
      // 如果是主动断开，不重连
      if (reason === "io client disconnect") {
        this.shouldReconnect = false;
      }
    });

    // 监听连接错误
    this.socket.on("connect_error", (error) => {
      this.isConnecting = false;
      this.reconnectAttempts++;
      console.error("WebSocket 连接错误:", error);
      
      // 如果达到最大重连次数，停止重连并提示用户
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.shouldReconnect = false;
        // 只在最后一次失败时提示，避免重复提示
        if (this.reconnectAttempts === this.maxReconnectAttempts) {
          ElMessage.warning("WebSocket 连接失败，请检查网络连接或服务器状态");
        }
      }
    });

    // 监听重连尝试
    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`WebSocket 重连尝试 ${attemptNumber}/${this.maxReconnectAttempts}`);
    });

    // 监听重连失败
    this.socket.on("reconnect_failed", () => {
      console.error("WebSocket 重连失败");
      this.shouldReconnect = false;
    });

    // 监听服务器确认连接
    this.socket.on("connected", (data) => {
      console.log("服务器确认连接:", data);
    });

    // 监听通用错误
    this.socket.on("error", (data: { message: string }) => {
      console.error("WebSocket 错误:", data);
      // 避免重复提示错误
      if (this.reconnectAttempts === 0) {
        ElMessage.error(data.message || "WebSocket 发生错误");
      }
    });

    // 监听离开房间确认
    this.socket.on("left", (data: { message: string }) => {
      console.log("离开房间确认:", data);
    });
  }

  // 断开连接
  disconnect(): void {
    this.shouldReconnect = false; // 主动断开时，停止重连
    if (this.socket) {
      // 离开所有房间
      this.taskRooms.forEach((taskId) => {
        this.leaveTask(taskId);
      });
      this.taskRooms.clear();
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    }
  }

  // 加入任务房间
  joinTask(taskId: number): void {
    if (!this.socket) {
      this.connect();
      // 等待连接后再加入
      this.socket?.once("connect", () => {
        this.emitJoinTask(taskId);
      });
      return;
    }

    if (!this.connected) {
      // 如果未连接，先连接再加入
      this.socket.once("connect", () => {
        this.emitJoinTask(taskId);
      });
      return;
    }

    this.emitJoinTask(taskId);
  }

  private emitJoinTask(taskId: number): void {
    if (this.socket && !this.taskRooms.has(taskId)) {
      this.socket.emit("join_task", { task_id: taskId });
      this.taskRooms.add(taskId);
      console.log(`加入任务房间: ${taskId}`);
    }
  }

  // 离开任务房间
  leaveTask(taskId: number): void {
    if (this.socket && this.taskRooms.has(taskId)) {
      this.socket.emit("leave_task", { task_id: taskId });
      this.taskRooms.delete(taskId);
      console.log(`离开任务房间: ${taskId}`);
    }
  }

  // 监听任务进度更新
  onTaskProgress(callback: (data: TaskProgressData) => void): void {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.on("task_progress", callback);
  }

  // 取消监听任务进度更新
  offTaskProgress(callback?: (data: TaskProgressData) => void): void {
    if (callback) {
      this.socket?.off("task_progress", callback);
    } else {
      this.socket?.off("task_progress");
    }
  }

  // 监听任务完成
  onTaskCompleted(callback: (data: TaskCompletedData) => void): void {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.on("task_completed", callback);
  }

  // 取消监听任务完成
  offTaskCompleted(callback?: (data: TaskCompletedData) => void): void {
    if (callback) {
      this.socket?.off("task_completed", callback);
    } else {
      this.socket?.off("task_completed");
    }
  }

  // 监听任务错误
  onTaskError(callback: (data: TaskErrorData) => void): void {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.on("task_error", callback);
  }

  // 取消监听任务错误
  offTaskError(callback?: (data: TaskErrorData) => void): void {
    if (callback) {
      this.socket?.off("task_error", callback);
    } else {
      this.socket?.off("task_error");
    }
  }

  // 监听任务状态（加入房间时返回的当前状态）
  onTaskStatus(callback: (data: TaskStatusData) => void): void {
    if (!this.socket) {
      this.connect();
    }
    this.socket?.on("task_status", callback);
  }

  // 取消监听任务状态
  offTaskStatus(callback?: (data: TaskStatusData) => void): void {
    if (callback) {
      this.socket?.off("task_status", callback);
    } else {
      this.socket?.off("task_status");
    }
  }

  // 获取连接状态
  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  // 手动重置重连状态（用于需要重新连接时）
  resetReconnectState(): void {
    this.reconnectAttempts = 0;
    this.shouldReconnect = true;
  }

  // 获取 Socket 实例（用于高级用法）
  getSocket(): Socket | null {
    return this.socket;
  }
}

// 导出单例
export const socketManager = new SocketManager();

