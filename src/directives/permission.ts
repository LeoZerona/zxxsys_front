import type { Directive, DirectiveBinding } from 'vue'
import { hasPermission } from '@/utils/permission'

/**
 * 权限指令
 * 用法: v-permission="'permission:view'" 或 v-permission="['permission:view', 'permission:edit']"
 */
export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const permission = binding.value
    if (!hasPermission(permission)) {
      el.style.display = 'none'
      // 也可以直接移除元素
      // el.parentNode?.removeChild(el)
    }
  },
  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const permission = binding.value
    if (!hasPermission(permission)) {
      el.style.display = 'none'
    } else {
      el.style.display = ''
    }
  }
}

