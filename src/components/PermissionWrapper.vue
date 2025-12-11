<template>
  <slot v-if="hasAccess" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { hasPermission, hasAllPermissions } from '@/utils/permission'

interface Props {
  permission?: string | string[]
  requireAll?: boolean // 如果为true，需要所有权限；如果为false，只需要任意一个权限
}

const props = withDefaults(defineProps<Props>(), {
  requireAll: false
})

const hasAccess = computed(() => {
  if (!props.permission) {
    return true
  }

  if (Array.isArray(props.permission)) {
    return props.requireAll 
      ? hasAllPermissions(props.permission)
      : hasPermission(props.permission)
  }

  return hasPermission(props.permission)
})
</script>

