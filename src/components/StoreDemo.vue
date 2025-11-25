
<template>
  <div class="store-demo">
    <el-tabs v-model="activeTab">
      <!-- 用户管理标签页 -->
      <el-tab-pane label="用户管理" name="user">
        <div class="user-section">
          <h3>用户信息</h3>
          <div v-if="userStore.isLoggedIn" class="user-info">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="用户名">{{ userStore.currentUser.username }}</el-descriptions-item>
              <el-descriptions-item label="邮箱">{{ userStore.currentUser.email }}</el-descriptions-item>
              <el-descriptions-item label="角色">
                <el-tag v-for="role in userStore.currentUser.roles" :key="role" type="primary" size="small">{{ role }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="权限">
                <el-tag v-for="permission in userStore.currentUser.permissions" :key="permission" size="small">{{ permission }}</el-tag>
              </el-descriptions-item>
            </el-descriptions>
            <div class="user-actions">
              <el-button type="danger" @click="handleLogout">退出登录</el-button>
            </div>
          </div>
          <div v-else class="login-form">
            <el-form :model="loginForm" label-width="80px">
              <el-form-item label="用户名">
                <el-input v-model="loginForm.username" />
              </el-form-item>
              <el-form-item label="密码">
                <el-input v-model="loginForm.password" type="password" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="handleLogin" :loading="userStore.loading">登录</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-tab-pane>

      <!-- 产品管理标签页 -->
      <el-tab-pane label="产品管理" name="product">
        <div class="product-section">
          <div class="product-filters">
            <el-form :inline="true" :model="productStore.filters">
              <el-form-item label="分类">
                <el-select v-model="productStore.filters.category" placeholder="选择分类" clearable>
                  <el-option v-for="category in productStore.categories" :key="category" :label="category" :value="category" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="productStore.filters.status" placeholder="选择状态" clearable>
                  <el-option label="活跃" value="active" />
                  <el-option label="未激活" value="inactive" />
                  <el-option label="已停产" value="discontinued" />
                </el-select>
              </el-form-item>
              <el-form-item label="搜索">
                <el-input v-model="productStore.filters.search" placeholder="搜索产品" />
              </el-form-item>
              <el-form-item label="价格范围">
                <el-input-number v-model="productStore.filters.minPrice" placeholder="最低价" :min="0" />
                <span class="separator">-</span>
                <el-input-number v-model="productStore.filters.maxPrice" placeholder="最高价" :min="0" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="applyFilters">应用筛选</el-button>
                <el-button @click="resetFilters">重置</el-button>
              </el-form-item>
            </el-form>

            <div class="sort-options">
              <span>排序方式：</span>
              <el-select v-model="productStore.sortBy" @change="handleSortChange">
                <el-option label="名称" value="name" />
                <el-option label="价格" value="price" />
                <el-option label="创建时间" value="createdAt" />
              </el-select>
              <el-button-group>
                <el-button :type="productStore.sortOrder === 'asc' ? 'primary' : ''" @click="productStore.sortOrder = 'asc'">升序</el-button>
                <el-button :type="productStore.sortOrder === 'desc' ? 'primary' : ''" @click="productStore.sortOrder = 'desc'">降序</el-button>
              </el-button-group>
            </div>
          </div>

          <div class="product-list">
            <el-table :data="productStore.filteredProducts" v-loading="productStore.loading">
              <el-table-column prop="name" label="产品名称" />
              <el-table-column prop="category" label="分类" />
              <el-table-column prop="price" label="价格" />
              <el-table-column prop="stock" label="库存" />
              <el-table-column prop="status" label="状态">
                <template #default="scope">
                  <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作">
                <template #default="scope">
                  <el-button size="small" @click="viewProduct(scope.row)">查看</el-button>
                  <el-button size="small" type="primary" @click="editProduct(scope.row)">编辑</el-button>
                </template>
              </el-table-column>
            </el-table>

            <el-pagination
              v-model:current-page="productStore.pagination.page"
              :page-size="productStore.pagination.pageSize"
              :total="productStore.pagination.total"
              layout="total, prev, pager, next"
              @current-change="handlePageChange"
            />
          </div>

          <div class="product-stats">
            <el-card header="产品统计">
              <el-row :gutter="20">
                <el-col :span="8">
                  <div class="stat-item">
                    <div class="stat-value">{{ productStore.products.length }}</div>
                    <div class="stat-label">总产品数</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="stat-item">
                    <div class="stat-value">{{ productStore.lowStockProducts.length }}</div>
                    <div class="stat-label">库存不足</div>
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="stat-item">
                    <div class="stat-value">{{ productStore.popularProducts.length }}</div>
                    <div class="stat-label">热门产品</div>
                  </div>
                </el-col>
              </el-row>
            </el-card>
          </div>
        </div>
      </el-tab-pane>

      <!-- 通知管理标签页 -->
      <el-tab-pane label="通知管理" name="notification">
        <div class="notification-section">
          <div class="notification-actions">
            <el-button type="primary" @click="showSuccessNotification">成功通知</el-button>
            <el-button type="warning" @click="showWarningNotification">警告通知</el-button>
            <el-button type="info" @click="showInfoNotification">信息通知</el-button>
            <el-button type="danger" @click="showErrorNotification">错误通知</el-button>
            <el-button @click="markAllAsRead">全部标记为已读</el-button>
            <el-button type="danger" @click="clearAllNotifications">清空所有通知</el-button>
          </div>

          <div class="notification-settings">
            <el-card header="通知设置">
              <el-form :model="notificationStore.settings" label-width="120px">
                <el-form-item label="启用声音">
                  <el-switch v-model="notificationStore.settings.enableSound" @change="updateNotificationSettings" />
                </el-form-item>
                <el-form-item label="桌面通知">
                  <el-switch v-model="notificationStore.settings.enableDesktop" @change="updateNotificationSettings" />
                </el-form-item>
                <el-form-item label="显示位置">
                  <el-select v-model="notificationStore.settings.position" @change="updateNotificationSettings">
                    <el-option label="右上" value="top-right" />
                    <el-option label="左上" value="top-left" />
                    <el-option label="右下" value="bottom-right" />
                    <el-option label="左下" value="bottom-left" />
                  </el-select>
                </el-form-item>
                <el-form-item label="最大显示数">
                  <el-input-number v-model="notificationStore.settings.maxNotifications" :min="1" :max="10" @change="updateNotificationSettings" />
                </el-form-item>
              </el-form>
            </el-card>
          </div>

          <div class="notification-list">
            <el-card header="通知列表">
              <el-badge :value="notificationStore.unreadCount" class="notification-badge">
                <span>未读通知</span>
              </el-badge>

              <el-empty v-if="notificationStore.notifications.length === 0" description="暂无通知" />

              <div v-else class="notification-items">
                <div
                  v-for="notification in notificationStore.latestNotifications"
                  :key="notification.id"
                  :class="['notification-item', { unread: !notification.read }]"
                >
                  <div class="notification-content">
                    <div class="notification-header">
                      <el-tag :type="notification.type" size="small">{{ notification.type }}</el-tag>
                      <span class="notification-title">{{ notification.title }}</span>
                      <el-button
                        v-if="notification.showClose"
                        type="text"
                        size="small"
                        @click="removeNotification(notification.id)"
                      >
                        关闭
                      </el-button>
                    </div>
                    <div class="notification-message">{{ notification.message }}</div>
                  </div>
                  <div class="notification-footer">
                    <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
                    <el-button v-if="!notification.read" type="text" size="small" @click="markAsRead(notification.id)">
                      标记为已读
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore, useProductStore, useNotificationStore } from '@/stores/modules'

// 获取各个store
const userStore = useUserStore()
const productStore = useProductStore()
const notificationStore = useNotificationStore()

// 当前激活的标签页
const activeTab = ref('user')

// 登录表单
const loginForm = ref({
  username: '',
  password: ''
})

// 用户相关方法
const handleLogin = async () => {
  const result = await userStore.login(loginForm.value.username, loginForm.value.password)
  if (result.success) {
    notificationStore.success('登录成功', `欢迎回来，${userStore.currentUser.username}!`)
    loginForm.value = { username: '', password: '' }
  } else {
    notificationStore.error('登录失败', '用户名或密码错误')
  }
}

const handleLogout = () => {
  userStore.logout()
  notificationStore.info('已退出登录', '您已成功退出系统')
}

// 产品相关方法
const applyFilters = () => {
  // 筛选条件已经在store中，这里只是为了触发响应式更新
  notificationStore.info('筛选已应用', '已应用新的筛选条件')
}

const resetFilters = () => {
  productStore.resetFilters()
  notificationStore.info('筛选已重置', '已重置所有筛选条件')
}

const handleSortChange = () => {
  // 排序方式已经在store中，这里只是为了触发响应式更新
  notificationStore.info('排序已更新', `已按${productStore.sortBy}进行${productStore.sortOrder === 'asc' ? '升序' : '降序'}排序`)
}

const handlePageChange = (page: number) => {
  productStore.setPagination(page)
}

const viewProduct = (product: any) => {
  productStore.setCurrentProduct(product)
  notificationStore.info('查看产品', `正在查看产品：${product.name}`)
}

const editProduct = (product: any) => {
  notificationStore.info('编辑产品', `正在编辑产品：${product.name}`)
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'warning'
    case 'discontinued': return 'danger'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '活跃'
    case 'inactive': return '未激活'
    case 'discontinued': return '已停产'
    default: return status
  }
}

// 通知相关方法
const showSuccessNotification = () => {
  notificationStore.success('成功', '这是一个成功通知示例')
}

const showWarningNotification = () => {
  notificationStore.warning('警告', '这是一个警告通知示例')
}

const showInfoNotification = () => {
  notificationStore.info('信息', '这是一个信息通知示例')
}

const showErrorNotification = () => {
  notificationStore.error('错误', '这是一个错误通知示例')
}

const markAllAsRead = () => {
  notificationStore.markAllAsRead()
  notificationStore.success('操作成功', '所有通知已标记为已读')
}

const clearAllNotifications = () => {
  notificationStore.clearAllNotifications()
  notificationStore.success('操作成功', '所有通知已清空')
}

const removeNotification = (id: string) => {
  notificationStore.removeNotification(id)
}

const markAsRead = (id: string) => {
  notificationStore.markAsRead(id)
}

const updateNotificationSettings = () => {
  notificationStore.updateSettings(notificationStore.settings)
  notificationStore.success('设置已更新', '通知设置已保存')
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// 初始化
onMounted(() => {
  // 初始化用户
  userStore.initUser()

  // 初始化通知设置
  notificationStore.initSettings()

  // 获取产品列表
  productStore.fetchProducts()
})
</script>

<style scoped lang="scss">
.store-demo {
  padding: 20px;

  .user-section {
    .user-info {
      margin-bottom: 20px;

      .user-actions {
        margin-top: 20px;
        text-align: right;
      }
    }

    .login-form {
      max-width: 400px;
    }
  }

  .product-section {
    .product-filters {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f5f7fa;
      border-radius: 4px;

      .separator {
        margin: 0 10px;
      }

      .sort-options {
        margin-top: 15px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
    }

    .product-list {
      margin-bottom: 20px;
    }

    .product-stats {
      .stat-item {
        text-align: center;

        .stat-value {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .stat-label {
          color: #909399;
        }
      }
    }
  }

  .notification-section {
    .notification-actions {
      margin-bottom: 20px;

      .el-button {
        margin-right: 10px;
        margin-bottom: 10px;
      }
    }

    .notification-settings {
      margin-bottom: 20px;
    }

    .notification-list {
      .notification-badge {
        margin-bottom: 15px;
        display: inline-block;
      }

      .notification-items {
        max-height: 400px;
        overflow-y: auto;

        .notification-item {
          padding: 10px;
          border-bottom: 1px solid #ebeef5;

          &.unread {
            background-color: #f0f9ff;
          }

          &:last-child {
            border-bottom: none;
          }

          .notification-content {
            .notification-header {
              display: flex;
              align-items: center;
              margin-bottom: 5px;

              .notification-title {
                margin-left: 10px;
                font-weight: bold;
              }
            }

            .notification-message {
              margin-bottom: 5px;
            }
          }

          .notification-footer {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
}
</style>
