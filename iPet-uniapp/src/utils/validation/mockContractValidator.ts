/**
 * ============================================================================
 * Summary Snapshot Schema - Mock/API 契约定义
 * ============================================================================
 * 
 * 用途：
 * - 定义 SummarySnapshot 的标准结构
 * - 在开发期验证 Mock 数据契约
 * - 防止字段漂移导致骨架屏卡死
 * 
 * 使用：
 * 1. Mock handler 返回前自动验证
 * 2. 开发环境启动时自动检查
 * 3. 发现问题立即报错 + 自动修复
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface SummarySnapshotSchema {
    /** 任务列表 (必须是数组) */
    tasks: Array<{
        id: string
        title: string
        dueDate?: string
        completed?: boolean
        [key: string]: any
    }>

    /** 置顶指标 (必须是数组) */
    pinnedMetrics: Array<{
        key: string
        value?: number
        unit?: string
        trend?: 'up' | 'down' | 'stable'
        [key: string]: any
    }>

    /** 趋势数据 (必须是数组) */
    trends: Array<{
        key: string
        trend: 'up' | 'down' | 'stable'
        changePercent?: number
        [key: string]: any
    }>

    /** 每日汇总 (必须是对象) */
    dailySummaries: Record<string, {
        date: string
        [key: string]: any
    }>

    /** 宠物 ID */
    petId: string

    /** 时间戳 */
    timestamp: number
}

// ============================================================================
// Validation Rules
// ============================================================================

interface ValidationRule {
    field: string
    type: 'array' | 'object' | 'string' | 'number'
    required: boolean
    defaultValue?: any
}

const SUMMARY_SNAPSHOT_RULES: ValidationRule[] = [
    { field: 'tasks', type: 'array', required: true, defaultValue: [] },
    { field: 'pinnedMetrics', type: 'array', required: true, defaultValue: [] },
    { field: 'trends', type: 'array', required: true, defaultValue: [] },
    { field: 'dailySummaries', type: 'object', required: true, defaultValue: {} },
    { field: 'petId', type: 'string', required: true },
    { field: 'timestamp', type: 'number', required: true }
]

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationError {
    field: string
    expectedType: string
    actualType: string
    actualValue: any
    fixed: boolean
    fixedValue?: any
}

export interface ValidationResult {
    valid: boolean
    errors: ValidationError[]
    fixed: boolean
    data: any
}

// ============================================================================
// Validator
// ============================================================================

/**
 * 验证并修复 SummarySnapshot 数据
 * 
 * @param data - 待验证的数据
 * @param options - 验证选项
 * @returns 验证结果 + 修复后的数据
 */
export function validateSummarySnapshot(
    data: any,
    options: { autoFix?: boolean; logErrors?: boolean } = {}
): ValidationResult {
    const { autoFix = true, logErrors = true } = options

    const errors: ValidationError[] = []
    let fixedData = { ...data }
    let hasErrors = false
    let hasFixed = false

    // 逐个验证字段
    for (const rule of SUMMARY_SNAPSHOT_RULES) {
        const value = fixedData[rule.field]
        const actualType = getType(value)
        const isValid = actualType === rule.type

        if (!isValid) {
            hasErrors = true

            const error: ValidationError = {
                field: rule.field,
                expectedType: rule.type,
                actualType,
                actualValue: value,
                fixed: false
            }

            // 🛠️ 自动修复
            if (autoFix && rule.defaultValue !== undefined) {
                fixedData[rule.field] = rule.defaultValue
                error.fixed = true
                error.fixedValue = rule.defaultValue
                hasFixed = true
            }

            errors.push(error)
        }
    }

    // 📊 日志输出
    if (logErrors && errors.length > 0) {
        console.group('🚨 [Mock Contract] Validation Errors')
        errors.forEach(err => {
            const emoji = err.fixed ? '🔧' : '❌'
            const color = err.fixed ? 'color: orange' : 'color: red'

            console.log(
                `%c${emoji} ${err.field}: expected ${err.expectedType}, got ${err.actualType}`,
                color
            )

            if (err.fixed) {
                console.log(
                    `   %c✅ Auto-fixed: ${JSON.stringify(err.actualValue)} → ${JSON.stringify(err.fixedValue)}`,
                    'color: green'
                )
            } else {
                console.log(
                    `   %c⚠️ Value: ${JSON.stringify(err.actualValue)}`,
                    'color: orange'
                )
            }
        })
        console.groupEnd()
    }

    return {
        valid: !hasErrors,
        errors,
        fixed: hasFixed,
        data: fixedData
    }
}

/**
 * 获取值的精确类型
 */
function getType(value: any): string {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (Array.isArray(value)) return 'array'
    if (typeof value === 'object') return 'object'
    return typeof value
}

// ============================================================================
// Development-only Validator (启动时检查)
// ============================================================================

/**
 * 开发环境启动时自动校验 Mock 示例数据
 * 在 main.ts 或 App.vue 中调用
 */
export function validateMockContractOnStartup() {
    // 仅在开发环境运行
    if (import.meta.env.PROD) return

    console.group('🔍 [Mock Contract] Startup Validation')

    // 示例 Mock 数据（从你的 Mock handler 中获取）
    const mockExample = {
        tasks: [
            { id: '1', title: 'Test task' }
        ],
        pinnedMetrics: [
            { key: 'weight', value: 5.2 }
        ],
        trends: [
            { key: 'weight', trend: 'up' as const }
        ],
        dailySummaries: {
            '2024-01-01': { date: '2024-01-01' }
        },
        petId: 'test_pet',
        timestamp: Date.now()
    }

    const result = validateSummarySnapshot(mockExample)

    if (result.valid) {
        console.log('%c✅ Mock contract is valid!', 'color: green; font-weight: bold')
    } else {
        console.warn(
            `%c⚠️ Found ${result.errors.length} contract violations`,
            'color: orange; font-weight: bold'
        )

        if (result.fixed) {
            console.log('%c🔧 All violations were auto-fixed', 'color: green')
        }
    }

    console.groupEnd()
}

// ============================================================================
// Mock Handler Wrapper (包装 Mock handler)
// ============================================================================

/**
 * 包装 Mock handler，自动验证返回值
 * 
 * @example
 * ```typescript
 * export const mockSummaryData = withContractValidation(() => {
 *     return {
 *         tasks: [],
 *         pinnedMetrics: null,  // ← 会被自动修复为 []
 *         // ...
 *     }
 * })
 * ```
 */
export function withContractValidation<T extends (...args: any[]) => any>(
    handler: T
): T {
    return ((...args: any[]) => {
        const result = handler(...args)

        // 仅在开发环境验证
        if (import.meta.env.DEV) {
            const validation = validateSummarySnapshot(result, {
                autoFix: true,
                logErrors: true
            })

            if (!validation.valid) {
                console.warn(
                    '%c[Mock Contract] Handler returned invalid data, auto-fixed',
                    'color: orange; font-weight: bold',
                    { original: result, fixed: validation.data }
                )
            }

            return validation.data
        }

        return result
    }) as T
}
