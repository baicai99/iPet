/**
 * 认证相关表单验证工具
 * 
 * 统一登录/注册页面的验证逻辑，使用本地校验规则
 */

// ============================================================================
// 从本地校验模块导入
// ============================================================================

import {
    isValidEmail as sharedIsValidEmail,
    validatePassword as sharedValidatePassword,
    VALIDATION_MESSAGES,
} from '@/validation';

// ============================================================================
// 类型定义
// ============================================================================

export interface ValidationResult {
    valid: boolean
    message?: string
}

// Re-export regex for backward compatibility
export { EMAIL_REGEX, PASSWORD_REGEX } from '@/validation';

// ============================================================================
// 验证函数
// ============================================================================

/**
 * 验证邮箱格式
 * 
 * @param email - 邮箱地址
 * @returns 验证结果
 * 
 * @example
 * const result = validateEmail('user@example.com')
 * if (!result.valid) {
 *   showToast(result.message!)
 * }
 */
export function validateEmail(email: string): ValidationResult {
    const trimmed = email.trim()
    if (!trimmed) {
        return { valid: false, message: VALIDATION_MESSAGES.EMAIL_REQUIRED }
    }
    if (!sharedIsValidEmail(trimmed)) {
        return { valid: false, message: VALIDATION_MESSAGES.EMAIL_INVALID }
    }
    return { valid: true }
}

/**
 * 验证密码格式
 * 
 * @param password - 密码
 * @returns 验证结果
 */
export function validatePassword(password: string): ValidationResult {
    const trimmed = password.trim()
    if (!trimmed) {
        return { valid: false, message: VALIDATION_MESSAGES.PASSWORD_REQUIRED }
    }
    const result = sharedValidatePassword(trimmed)
    if (!result.isValid) {
        return { valid: false, message: result.error ?? VALIDATION_MESSAGES.PASSWORD_INVALID }
    }
    return { valid: true }
}


/**
 * 验证确认密码
 * 
 * @param password - 密码
 * @param confirmPassword - 确认密码
 * @returns 验证结果
 */
export function validateConfirmPassword(
    password: string,
    confirmPassword: string
): ValidationResult {
    if (password.trim() !== confirmPassword.trim()) {
        return { valid: false, message: VALIDATION_MESSAGES.PASSWORDS_NOT_MATCH }
    }
    return { valid: true }
}

/**
 * 验证登录表单
 * 
 * @param email - 邮箱
 * @param password - 密码
 * @returns 验证结果
 */
export function validateLoginForm(
    email: string,
    password: string
): ValidationResult {
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail || !trimmedPassword) {
        return { valid: false, message: VALIDATION_MESSAGES.EMAIL_AND_PASSWORD_REQUIRED }
    }

    const emailResult = validateEmail(trimmedEmail)
    if (!emailResult.valid) return emailResult

    const passwordResult = validatePassword(trimmedPassword)
    if (!passwordResult.valid) return passwordResult

    return { valid: true }
}

/**
 * 验证注册表单
 * 
 * @param email - 邮箱
 * @param password - 密码
 * @param confirmPassword - 确认密码
 * @returns 验证结果
 */
export function validateRegisterForm(
    email: string,
    password: string,
    confirmPassword: string
): ValidationResult {
    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()
    const trimmedConfirm = confirmPassword.trim()

    if (!trimmedEmail || !trimmedPassword || !trimmedConfirm) {
        return { valid: false, message: VALIDATION_MESSAGES.FORM_INCOMPLETE }
    }

    const emailResult = validateEmail(trimmedEmail)
    if (!emailResult.valid) return emailResult

    const passwordResult = validatePassword(trimmedPassword)
    if (!passwordResult.valid) return passwordResult

    const confirmResult = validateConfirmPassword(trimmedPassword, trimmedConfirm)
    if (!confirmResult.valid) return confirmResult

    return { valid: true }
}

// ============================================================================
// 错误处理工具
// ============================================================================

/**
 * 检查是否为限流错误 (HTTP 429)
 * 
 * @param error - 错误对象
 * @returns 是否为限流错误
 */
export function isRateLimitError(error: any): boolean {
    return Number(error?.statusCode) === 429
}

/**
 * 检查是否为网络错误
 * 
 * @param error - 错误对象
 * @returns 是否为网络错误
 */
export function isNetworkError(error: any): boolean {
    return error?.errMsg?.includes?.('request:fail') ?? false
}

/**
 * 从错误对象提取消息
 * 
 * @param error - 错误对象
 * @param fallback - 默认消息
 * @returns 错误消息
 */
export function getErrorMessage(error: any, fallback: string): string {
    const message = error?.data?.message || error?.errMsg
    if (message && typeof message === 'string') {
        return message
    }
    return fallback
}

/**
 * 根据 HTTP 状态码获取认证错误消息
 * 
 * @param error - 错误对象
 * @param context - 上下文 ('login' | 'register')
 * @returns 错误消息，如果不是已知状态码则返回 null
 */
export function getAuthErrorMessage(
    error: any,
    context: 'login' | 'register'
): string | null {
    const statusCode = Number(error?.statusCode || error?.code)

    if (context === 'login') {
        if (statusCode === 404) {
            return '该账号未注册，请先注册'
        }
        if (statusCode === 401) {
            const msg = error?.data?.message || ''
            if (msg.includes('deleted')) {
                return '该账号已注销'
            }
            return '账号或密码错误，请重试'
        }
    }

    if (context === 'register') {
        if (statusCode === 409) {
            return '该邮箱已被注册，请直接登录'
        }
    }

    return null
}
