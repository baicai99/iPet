/**
 * Request ID Generator
 * 
 * 生成符合 UUID v4 格式的请求标识符，用于请求追踪和日志关联。
 * 
 * @see docs/frontend/运维与可观测性层.md
 */

/**
 * 生成 UUID v4 格式的 Request ID
 * 
 * 优先使用 crypto.randomUUID()，不支持时回退到手动生成。
 * 
 * @returns UUID v4 格式字符串，如 "550e8400-e29b-41d4-a716-446655440000"
 */
export const generateRequestId = (): string => {
    // 优先使用原生 crypto.randomUUID（现代浏览器和 Node 18+ 支持）
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }

    // 回退方案：手动生成 UUID v4
    // 格式: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // 其中 y 为 [8, 9, a, b] 之一
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

/**
 * 验证字符串是否为有效的 UUID v4 格式
 */
export const isValidRequestId = (id: string): boolean => {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidV4Regex.test(id)
}

export default generateRequestId
