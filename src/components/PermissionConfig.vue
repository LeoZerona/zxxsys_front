<template>
  <el-dialog
    v-model="visible"
    title="权限过滤配置"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form :model="config" label-width="120px">
      <el-form-item label="启用权限过滤">
        <el-switch
          v-model="config.enabled"
          active-text="启用"
          inactive-text="禁用"
        />
        <div class="form-tip">
          启用后，系统将根据用户权限过滤菜单和功能按钮
        </div>
      </el-form-item>

      <el-form-item label="生效环境">
        <el-radio-group v-model="config.env">
          <el-radio label="development">开发环境</el-radio>
          <el-radio label="test">测试环境</el-radio>
          <el-radio label="production">生产环境</el-radio>
        </el-radio-group>
        <div class="form-tip">
          当前环境: <strong>{{ currentEnv }}</strong>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getPermissionFilterConfigValue,
  setPermissionFilterConfig,
  type PermissionFilterEnv
} from '@/utils/permission'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const config = ref({
  enabled: true,
  env: 'production' as PermissionFilterEnv
})

const currentEnv = computed(() => {
  const mode = import.meta.env.MODE
  if (mode === 'development') return '开发环境'
  if (mode === 'test' || mode === 'testing') return '测试环境'
  return '生产环境'
})

// 加载配置
function loadConfig() {
  const savedConfig = getPermissionFilterConfigValue()
  config.value = { ...savedConfig }
}

// 保存配置
function handleSave() {
  setPermissionFilterConfig(config.value)
  ElMessage.success('权限过滤配置已保存')
  visible.value = false
  // 刷新页面以应用配置
  setTimeout(() => {
    window.location.reload()
  }, 500)
}

// 取消
function handleCancel() {
  visible.value = false
}

// 监听对话框显示，加载配置
watch(visible, (val) => {
  if (val) {
    loadConfig()
  }
})
</script>

<style scoped lang="scss">
.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  
  strong {
    color: #409eff;
  }
}
</style>

