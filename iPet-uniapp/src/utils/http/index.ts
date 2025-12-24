/**
 * HTTP Client Module
 * 
 * 统一导出 HTTP 请求相关工具，提供 ApiClient 兼容层。
 * 
 * @example
 * import { request, generateRequestId } from '@/utils/http'
 */

export { generateRequestId, isValidRequestId } from './generateRequestId'

// 重新导出 request 作为兼容层，保持现有调用方式不变
export { default as request } from '@/utils/common/request'

// 导出类型
export type { RequestConfig } from '@/utils/common/request'
