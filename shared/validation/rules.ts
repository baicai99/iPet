/**
 * Shared validation rules and constants for both frontend and backend
 * This module contains regex patterns and validation functions used across the application
 */

// ==================== Email Validation ====================
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates if a string is a valid email format
 */
export const isValidEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    return EMAIL_REGEX.test(email.trim());
};

// ==================== Password Validation ====================
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)\S+$/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

/**
 * Password validation result
 */
export interface PasswordValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates password strength and format
 * - At least 8 characters
 * - Contains at least one letter and one number
 * - No whitespace allowed
 */
export const validatePassword = (password: string): PasswordValidationResult => {
    if (!password || typeof password !== 'string') {
        return { isValid: false, error: '密码不能为空' };
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
        return { isValid: false, error: `密码至少需要${PASSWORD_MIN_LENGTH}位` };
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
        return { isValid: false, error: `密码不能超过${PASSWORD_MAX_LENGTH}位` };
    }

    if (!PASSWORD_REGEX.test(password)) {
        return { isValid: false, error: '密码需包含字母和数字，且不允许空格' };
    }

    return { isValid: true };
};

/**
 * Simple password validity check (returns boolean only)
 */
export const isValidPassword = (password: string): boolean => {
    return validatePassword(password).isValid;
};

// ==================== Verification Code ====================
export const VERIFICATION_CODE_REGEX = /^\d{6}$/;

/**
 * Validates if a string is a valid 6-digit verification code
 */
export const isValidVerificationCode = (code: string): boolean => {
    if (!code || typeof code !== 'string') return false;
    return VERIFICATION_CODE_REGEX.test(code.trim());
};

// ==================== Nickname Validation ====================
export const NICKNAME_MIN_LENGTH = 1;
export const NICKNAME_MAX_LENGTH = 12;

/**
 * Validates nickname length (content filtering should be done separately)
 */
export const isValidNicknameLength = (nickname: string): boolean => {
    if (!nickname || typeof nickname !== 'string') return false;
    const trimmed = nickname.trim();
    return trimmed.length >= NICKNAME_MIN_LENGTH && trimmed.length <= NICKNAME_MAX_LENGTH;
};

// ==================== Validation Messages ====================
/**
 * 统一校验错误消息
 * 确保前后端显示一致的校验提示
 */
export const VALIDATION_MESSAGES = {
    // Email
    EMAIL_REQUIRED: '邮箱不能为空',
    EMAIL_INVALID: '请输入有效的邮箱地址',

    // Password
    PASSWORD_REQUIRED: '密码不能为空',
    PASSWORD_TOO_SHORT: `密码至少需要${PASSWORD_MIN_LENGTH}位`,
    PASSWORD_TOO_LONG: `密码不能超过${PASSWORD_MAX_LENGTH}位`,
    PASSWORD_INVALID: '密码需包含字母和数字，且不允许空格',

    // Confirm Password
    PASSWORDS_NOT_MATCH: '两次输入的密码不一致',

    // Form
    FORM_INCOMPLETE: '请填写所有字段',
    EMAIL_AND_PASSWORD_REQUIRED: '邮箱和密码不能为空',

    // Nickname
    NICKNAME_TOO_SHORT: `昵称至少需要${NICKNAME_MIN_LENGTH}个字符`,
    NICKNAME_TOO_LONG: `昵称不能超过${NICKNAME_MAX_LENGTH}个字符`,
    NICKNAME_CONTAINS_SENSITIVE: '昵称包含敏感词汇',

    // Verification Code
    CODE_REQUIRED: '验证码不能为空',
    CODE_INVALID: '请输入6位数字验证码',
} as const;

export type ValidationMessageKey = keyof typeof VALIDATION_MESSAGES;
