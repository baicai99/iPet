/**
 * Network Utils - 网络状态检测工具
 * 
 * 职责：
 * - 检测当前网络连接状态
 * - 检测运行平台（小程序/H5）
 * - 提供网络状态变化监听
 * 
 * 对应 PRD 4.2 节：离线状态拦截
 */

// ============================================================================
// State
// ============================================================================

/** 当前网络状态缓存 */
let networkConnected = true

/** 网络类型 */
let networkType: string = 'unknown'

// ============================================================================
// Platform Detection
// ============================================================================

/**
 * 检测是否为小程序环境
 */
export function isMiniProgram(): boolean {
    // #ifdef MP
    return true
    // #endif

    // #ifdef H5
    // H5 环境下检查 UA 或特定 API
    if (typeof window !== 'undefined') {
        const ua = navigator.userAgent.toLowerCase()
        return ua.includes('miniprogram') || ua.includes('wechatdevtools')
    }
    return false
    // #endif

    return false
}

/**
 * 检测是否为 H5 环境
 */
export function isH5(): boolean {
    // #ifdef H5
    return true
    // #endif
    return false
}

/**
 * 检测是否为 App 环境
 */
export function isApp(): boolean {
    // #ifdef APP-PLUS
    return true
    // #endif
    return false
}

// ============================================================================
// Network Status
// ============================================================================

/**
 * 初始化网络状态
 * 应该在应用启动时调用
 */
export function initNetworkStatus(): void {
    // 获取初始网络状态
    uni.getNetworkType({
        success: (res) => {
            networkType = res.networkType
            networkConnected = res.networkType !== 'none'
        }
    })

    // 监听网络状态变化
    uni.onNetworkStatusChange((res) => {
        networkConnected = res.isConnected
        networkType = res.networkType

        // 触发自定义事件供其他模块监听
        uni.$emit('networkStatusChange', {
            isConnected: res.isConnected,
            networkType: res.networkType
        })
    })
}

/**
 * 检测当前是否离线
 */
export function isOffline(): boolean {
    return !networkConnected
}

/**
 * 检测当前是否在线
 */
export function isOnline(): boolean {
    return networkConnected
}

/**
 * 获取当前网络类型
 * @returns 'wifi' | '2g' | '3g' | '4g' | '5g' | 'ethernet' | 'none' | 'unknown'
 */
export function getNetworkType(): string {
    return networkType
}

/**
 * 同步获取网络状态（可能需要等待）
 */
export async function getNetworkStatus(): Promise<{ isConnected: boolean; networkType: string }> {
    return new Promise((resolve) => {
        uni.getNetworkType({
            success: (res) => {
                networkConnected = res.networkType !== 'none'
                networkType = res.networkType
                resolve({
                    isConnected: networkConnected,
                    networkType: res.networkType
                })
            },
            fail: () => {
                resolve({
                    isConnected: true, // 失败时假设在线
                    networkType: 'unknown'
                })
            }
        })
    })
}

// ============================================================================
// Network Status Listeners
// ============================================================================

type NetworkChangeCallback = (status: { isConnected: boolean; networkType: string }) => void
const listeners: NetworkChangeCallback[] = []

/**
 * 添加网络状态变化监听器
 */
export function onNetworkChange(callback: NetworkChangeCallback): () => void {
    listeners.push(callback)

    // 监听 uni 事件
    const handler = (status: { isConnected: boolean; networkType: string }) => {
        callback(status)
    }
    uni.$on('networkStatusChange', handler)

    // 返回取消订阅函数
    return () => {
        const index = listeners.indexOf(callback)
        if (index > -1) {
            listeners.splice(index, 1)
        }
        uni.$off('networkStatusChange', handler)
    }
}

// ============================================================================
// Offline Blocking
// ============================================================================

/**
 * 离线时显示提示（小程序专用）
 */
export function showOfflineToast(message?: string): void {
    uni.showToast({
        title: message || '当前网络不可用，请连接网络后重试',
        icon: 'none',
        duration: 2500
    })
}

/**
 * 检查是否应该阻止离线操作（小程序健康写入专用）
 * 
 * @returns true 如果应该阻止操作
 */
export function shouldBlockOfflineHealthWrite(): boolean {
    // 只在小程序环境下阻止离线写入
    if (isMiniProgram() && isOffline()) {
        return true
    }
    return false
}

/**
 * 离线阻止并显示提示
 * 
 * @returns true 如果已阻止（离线状态）
 */
export function blockIfOffline(customMessage?: string): boolean {
    if (shouldBlockOfflineHealthWrite()) {
        showOfflineToast(customMessage)
        return true
    }
    return false
}

// ============================================================================
// Export
// ============================================================================

export default {
    isMiniProgram,
    isH5,
    isApp,
    initNetworkStatus,
    isOffline,
    isOnline,
    getNetworkType,
    getNetworkStatus,
    onNetworkChange,
    showOfflineToast,
    shouldBlockOfflineHealthWrite,
    blockIfOffline
}
