/**
 * Guest 账户升级/绑定规则
 * 定义游客升级和邮箱绑定的边界条件
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface GuestUser {
    isGuest: boolean;
    email?: string | null;
}

// ============================================================================
// 规则检查
// ============================================================================

/**
 * 检查用户是否可以升级账户
 * 只有 guest 用户可以升级
 */
export function canUpgradeAccount(user: GuestUser): boolean {
    return user.isGuest === true;
}

/**
 * 检查用户是否可以绑定邮箱
 * 只有 guest 用户且尚未绑定邮箱才可以
 */
export function canBindEmail(user: GuestUser): boolean {
    return user.isGuest === true && !user.email;
}

/**
 * 获取升级账户的校验结果
 */
export function validateUpgradeEligibility(user: GuestUser): {
    eligible: boolean;
    error?: string;
} {
    if (!user.isGuest) {
        return { eligible: false, error: GUEST_ERROR_MESSAGES.NOT_GUEST };
    }
    return { eligible: true };
}

/**
 * 获取绑定邮箱的校验结果
 */
export function validateBindEmailEligibility(user: GuestUser): {
    eligible: boolean;
    error?: string;
} {
    if (!user.isGuest) {
        return { eligible: false, error: GUEST_ERROR_MESSAGES.NOT_GUEST };
    }
    if (user.email) {
        return { eligible: false, error: GUEST_ERROR_MESSAGES.ALREADY_HAS_EMAIL };
    }
    return { eligible: true };
}

// ============================================================================
// 错误消息
// ============================================================================

export const GUEST_ERROR_MESSAGES = {
    NOT_GUEST: '只有游客账户可以升级',
    ALREADY_HAS_EMAIL: '该账户已绑定邮箱',
    UPGRADE_REQUIRED: '请先升级为正式账户',
} as const;
