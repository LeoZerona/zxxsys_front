# 后端Token刷新需求文档

## 概述
前端已实现无感刷新Token功能，当access_token过期时，会自动使用refresh_token刷新获取新的access_token，用户无需重新登录。

## 后端需要实现的接口

### 1. 刷新Token接口

**接口路径**: `POST /api/refresh-token`

**请求体**:
```json
{
  "refresh_token": "your_refresh_token_here"
}
```

**成功响应** (200):
```json
{
  "success": true,
  "message": "Token刷新成功",
  "data": {
    "access_token": "new_access_token",
    "token_type": "Bearer",
    "expires_in": 3600  // token有效期（秒），例如3600秒=1小时
  }
}
```

**错误响应** (401):
```json
{
  "success": false,
  "message": "刷新Token失败",
  "code": "INVALID_REFRESH_TOKEN"  // 或其他错误代码
}
```

### 2. 错误代码说明

前端会根据以下错误代码进行不同处理：

#### 可自动恢复的错误（会尝试刷新token）:
- `TOKEN_EXPIRED`: access_token已过期
- `INVALID_TOKEN`: access_token无效

#### 不可恢复的错误（会跳转到登录页）:
- `INVALID_REFRESH_TOKEN`: refresh_token无效或已过期
- `TOKEN_REVOKED`: token已被撤销
- `USER_NOT_FOUND`: 用户不存在

### 3. 401错误响应格式

当access_token过期时，后端应返回：
```json
{
  "success": false,
  "message": "Token已过期",
  "code": "TOKEN_EXPIRED"
}
```

### 4. 重要注意事项

1. **刷新Token接口不应显示Loading**: 
   - 前端已设置刷新token请求不显示loading，避免用户看到闪烁
   - 后端应快速响应刷新请求（建议<500ms）

2. **Token有效期建议**:
   - `access_token`: 建议1-2小时
   - `refresh_token`: 建议7-30天
   - 前端会在access_token过期前5分钟自动刷新

3. **并发请求处理**:
   - 前端已实现并发请求时只刷新一次token的机制
   - 多个同时发起的请求会等待同一个刷新操作完成

4. **刷新Token后**:
   - 旧的access_token应立即失效
   - refresh_token可以保持不变，也可以轮换（如果后端支持）

5. **安全性**:
   - refresh_token应存储在httpOnly cookie中（如果可能）
   - 或使用更安全的存储方式
   - 建议实现refresh_token轮换机制

## 前端实现的功能

1. ✅ **自动刷新**: 在token过期前5分钟自动刷新
2. ✅ **401错误自动重试**: 当收到401错误时，自动刷新token并重试原请求
3. ✅ **并发请求处理**: 多个请求同时失败时，只刷新一次token
4. ✅ **无感刷新**: 刷新过程不显示loading，用户无感知
5. ✅ **错误区分**: 区分可恢复和不可恢复的错误

## 测试建议

1. 测试access_token过期时的自动刷新
2. 测试refresh_token过期时的处理
3. 测试并发请求时的token刷新
4. 测试刷新token后原请求的重试
5. 测试网络错误时的处理

