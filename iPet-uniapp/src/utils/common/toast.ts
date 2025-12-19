/**
 * 统一 Toast 工具
 * 
 * 消除各页面重复的 showToast 函数定义
 * 提供一致的用户反馈体验
 */

export interface ToastOptions {
  title: string
  icon?: 'success' | 'loading' | 'error' | 'none'
  duration?: number
  mask?: boolean
}

/**
 * 显示 Toast 消息
 * 
 * @param title - 显示的消息内容
 * @param icon - 图标类型，默认 'none'
 * @param duration - 显示时长（毫秒），默认 2000
 * 
 * @example
 * showToast('操作成功')
 * showToast('登录成功', 'success')
 */
export function showToast(
  title: string,
  icon: ToastOptions['icon'] = 'none',
  duration = 2000
): void {
  uni.showToast({
    title,
    icon,
    duration,
  })
}

/**
 * 显示成功 Toast
 * 
 * @example
 * showSuccess('保存成功')
 */
export function showSuccess(title: string): void {
  showToast(title, 'success')
}

/**
 * 显示错误 Toast（使用 none 图标，因为 error 图标兼容性较差）
 * 
 * @example
 * showError('操作失败，请重试')
 */
export function showError(title: string): void {
  showToast(title, 'none')
}

/**
 * 显示加载 Toast
 * 
 * @param title - 加载提示文字，默认 '加载中...'
 * 
 * @example
 * showLoading()
 * showLoading('正在提交...')
 */
export function showLoading(title = '加载中...'): void {
  uni.showLoading({ title, mask: true })
}

/**
 * 隐藏加载 Toast
 * 
 * @example
 * showLoading()
 * try {
 *   await doSomething()
 * } finally {
 *   hideLoading()
 * }
 */
export function hideLoading(): void {
  uni.hideLoading()
}

/**
 * 显示模态对话框
 * 
 * @param options - 对话框配置
 * @returns Promise<boolean> - 用户是否点击确认
 * 
 * @example
 * const confirmed = await showModal({ title: '提示', content: '确认删除？' })
 * if (confirmed) { ... }
 */
export function showModal(options: {
  title?: string
  content: string
  showCancel?: boolean
  cancelText?: string
  confirmText?: string
}): Promise<boolean> {
  return new Promise((resolve) => {
    uni.showModal({
      title: options.title || '提示',
      content: options.content,
      showCancel: options.showCancel ?? true,
      cancelText: options.cancelText || '取消',
      confirmText: options.confirmText || '确定',
      success: (res) => {
        resolve(res.confirm)
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}
