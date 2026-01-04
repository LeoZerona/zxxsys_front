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

  // 连接 WebSocket
  connect(): void {
    if (this.socket?.connected) {
      console.log("WebSocket 已连接");
      return;
    }

    const wsUrl = getWebSocketURL();
    console.log("连接 WebSocket:", wsUrl);

    this.socket = io(wsUrl, {
      transports: ["websocket", "polling"], // 优先使用 WebSocket，失败时降级到轮询
      reconnection: true, // 自动重连
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
    });

    // 监听连接成功
    this.socket.on("connect", () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log("WebSocket 连接成功");

      // 重新加入之前加入的房间
      this.taskRooms.forEach((taskId) => {
        this.joinTask(taskId);
      });
    });

    // 监听连接断开
    this.socket.on("disconnect", (reason) => {
      this.connected = false;
      console.log("WebSocket 断开连接:", reason);
    });

    // 监听连接错误
    this.socket.on("connect_error", (error) => {
      this.reconnectAttempts++;
      console.error("WebSocket 连接错误:", error);
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        ElMessage.warning("WebSocket 连接失败，请检查网络连接");
      }
    });

    // 监听服务器确认连接
    this.socket.on("connected", (data) => {
      console.log("服务器确认连接:", data);
    });

    // 监听通用错误
    this.socket.on("error", (data: { message: string }) => {
      console.error("WebSocket 错误:", data);
      ElMessage.error(data.message || "WebSocket 发生错误");
    });
  }

  // 断开连接
  disconnect(): void {
    if (this.socket) {
      // 离开所有房间
      this.taskRooms.forEach((taskId) => {
        this.leaveTask(taskId);
      });
      this.taskRooms.clear();
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
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

  // 获取 Socket 实例（用于高级用法）
  getSocket(): Socket | null {
    return this.socket;
  }
}

// 导出单例
export const socketManager = new SocketManager();

