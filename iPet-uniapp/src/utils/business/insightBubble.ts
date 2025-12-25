import { getCategoryTitle } from '@/data/categoryConfig'
import { evaluateTrend } from '@/domain/trend/trendEvaluator'
import { formatHeadline } from '@/domain/trend/trendFormatter'
import type { TrendResult, TrendDirection as CoreTrendDirection } from '@/domain/trend/trendTypes'

type TrendDirection = 'up' | 'down' | 'flat'
type InsightStatus = 'excellent' | 'good' | 'warning' | 'danger' | 'insufficient'

interface InsightParams {
    metricTitle?: string
    category?: string
    values?: Array<number | string>
    avg?: number | string
    trend?: number
    unit?: string
}

interface InsightState {
    status: InsightStatus
    direction: TrendDirection
    changePercent: number
    changeValue: number
    group: string
}

interface InsightResult {
    /** 完整文本（headline + advice） */
    text: string
    /** 事实句（与 TrendCard 一致） */
    headline: string
    /** 建议句 */
    advice: string
    /** 状态信息（兼容旧版） */
    state: InsightState
    /** 趋势判定结果（新增） */
    trendResult: TrendResult
}

const CATEGORY_GROUP_MAP: Record<string, string> = {
    bodyMeasurement: 'body',
    vitalSigns: 'vital',
    heart: 'vital',
    breathing: 'vital',
    activity: 'activity',
    fitnessRecord: 'activity',
    nutritionIntake: 'nutrition',
    sleep: 'sleep',
    medication: 'medical',
    symptoms: 'medical',
    periodTracking: 'medical',
    mentalHealth: 'mental',
    hearing: 'vital',
    otherData: 'default'
}

const GROUP_BEHAVIORS: Record<string, 'up' | 'down' | 'stable'> = {
    body: 'stable',
    vital: 'stable',
    activity: 'up',
    nutrition: 'up',
    sleep: 'up',
    medical: 'down',
    mental: 'stable',
    default: 'stable'
}

const DIRECTION_LABELS: Record<TrendDirection, string> = {
    up: '上升',
    down: '下降',
    flat: '保持稳定'
}

const DEFAULT_LIBRARY = {
    excellent: [
        '{metric}维持得非常好，继续保持现在的节奏就很理想。',
        '{category}数据平稳，日常习惯做得很到位。'
    ],
    good: [
        '{metric}整体趋势正常，偶尔的小波动无需担心。',
        '{category}处于可控范围，继续按计划执行就好。'
    ],
    warning: [
        '{metric}出现轻微{trendWord}，建议密切观察接下来几天的变化。',
        '监测到{category}有一点偏离，适度调整作息有助于回到熟悉的区间。'
    ],
    danger: [
        '{metric}的{trendWord}幅度偏大，如伴随精神或饮食异常请及时咨询医生。',
        '{category}短期内变化明显，建议复盘最近的喂养和训练安排。'
    ],
    insufficient: [
        '刚有少量{metric}记录，再积累几天数据会更好分析。',
        '需要更多{category}数据才能给出更准确的建议。'
    ]
}

const GROUP_LIBRARY: Record<string, Record<string, string[]>> = {
    body: {
        excellent: [
            '{metric}保持在熟悉区间，体态管理得很到位。',
            '最近{metric}波动极小，说明基础代谢相当稳定。',
            '维持住现在的{metric}节奏，就能持续保持匀称体型。'
        ],
        good: [
            '{metric}整体平稳，偶尔的小起伏属于正常范围。',
            '{category}数据延续近期水平，可以继续当前的喂养计划。'
        ],
        warning_up: [
            '最近{metric}{trendWord}，留意零食和主食的热量分配。',
            '{metric}{trendWord}速度略快，可尝试增加一些互动游戏消耗热量。'
        ],
        warning_down: [
            '{metric}{trendWord}开始明显，确认进食和精神状态是否正常。',
            '监测到{metric}{trendWord}，若伴随食欲下降需多观察。'
        ],
        danger_up: [
            '本周 {metric} {trendWord}幅度约 {changePercent}% ，建议及时复盘饮食运动安排。',
            '{metric}{trendWord}较快，如已超过计划目标，请考虑咨询营养或兽医建议。'
        ],
        danger_down: [
            '{metric}短期内快速{trendWord}，若出现无力或呕吐请尽快就医。',
            '检测到{metric}{trendWord}明显，建议排查是否有消化或内分泌问题。'
        ],
        insufficient: [
            '还需要更多{metric}记录，才能判断体态趋势。',
            '再累积几次{metric}数据，分析结果会更可靠。'
        ]
    },
    vital: {
        excellent: [
            '{metric}维持在稳定范围，生命体征表现很理想。',
            '这一段时间{metric}十分平稳，说明身体负担小。'
        ],
        good: [
            '{metric}波动轻微，属于健康允许的上下浮动。',
            '{category}总体正常，适度保持现在的作息即可。'
        ],
        warning_up: [
            '{metric}{trendWord}，注意是否处于紧张或炎症期，必要时测量几次确认。',
            '检测到{metric}小幅{trendWord}，如果持续请考虑减少高强度运动。'
        ],
        warning_down: [
            '{metric}{trendWord}略快，低温同样需要留意环境保暖与精神状况。',
            '{category}出现下降趋势，若伴随嗜睡请尽快复查。'
        ],
        danger_up: [
            '{metric}明显{trendWord}，如超过经验安全值需尽快就诊排查。',
            '生命体征短期内{trendWord}明显，建议联系医生确认是否为炎症或感染。'
        ],
        danger_down: [
            '{metric}{trendWord}幅度较大，请确认是否有低体温或休克风险。',
            '指标快速{trendWord}，务必观察呼吸与心率是否同步异常。'
        ],
        insufficient: [
            '生命体征需要多次观测，再采集几条{metric}数据会更准确。',
            '目前{metric}记录偏少，建议连续监测以排除偶发因素。'
        ]
    },
    activity: {
        excellent: [
            '{metric}{trendWord}明显，毛孩子精力正好，保持现在的出行频率就很棒。',
            '活动记录显示持续提升，耐力正在被稳稳拉起。'
        ],
        good: [
            '{metric}保持稳步推进，按当前节奏就能维持肌肉状态。',
            '活动曲线平稳，可以再增加一点趣味训练丰富体验。'
        ],
        warning_down: [
            '{metric}{trendWord}，不妨安排更多互动或户外散步唤醒活力。',
            '最近活动量减少，尝试调整遛狗时间或更新玩具。'
        ],
        danger_down: [
            '{metric}{trendWord}幅度达到 {changePercent}% ，警惕潜在不适或情绪低落，必要时咨询医生。',
            '活动突然减少，若伴随拒食或精神差请及时就诊。'
        ],
        insufficient: [
            '活动记录较少，继续记录几天才能评估训练成果。',
            '需要更多{metric}数据，才能衡量运动是否达标。'
        ]
    },
    nutrition: {
        excellent: [
            '{metric}逐步{trendWord}，营养补给非常到位。',
            '摄入量接近计划目标，肌肉与毛发的状态会更稳。'
        ],
        good: [
            '{metric}整体平稳，偶尔微调即可贴合食谱。',
            '喂食节奏保持一致，吸收效率更容易被身体记住。'
        ],
        warning_down: [
            '{metric}{trendWord}，需确认是否挑食或消化不适。',
            '最近摄入量下降，适当调换口味或温热食物帮助恢复食欲。'
        ],
        danger_down: [
            '{metric}{trendWord}幅度较大，若持续拒食请尽快联系兽医。',
            '摄入量大幅下降，谨防脱水或低血糖，必要时补充电解质。'
        ],
        warning_up: [
            '摄入{trendWord}略快，注意控制零食和加餐节奏。',
            '{metric}持续{trendWord}，可适当调整热量密度避免肠胃负担。'
        ],
        danger_up: [
            '本周{metric}明显{trendWord}，若伴随腹泻需尽快排查食物卫生问题。',
            '摄入突然增加，注意观察体重与排便情况是否同步变化。'
        ],
        insufficient: [
            '暂时只有少量{metric}记录，多观察几天更易发现规律。',
            '需要连续记录饮食，才能匹配合适的营养方案。'
        ]
    },
    sleep: {
        excellent: [
            '{metric}逐步{trendWord}，说明休息质量在稳步提升。',
            '睡眠表现优秀，深睡比例更高时精力会更好。'
        ],
        good: [
            '{metric}大致平稳，说明作息节奏被很好地坚持着。',
            '休息时长变化不大，可继续维持现在的睡前仪式。'
        ],
        warning_down: [
            '{metric}{trendWord}，尝试提前散步或安抚，帮助快速入睡。',
            '睡眠略减，若伴随焦躁可减少咖啡因类零食。'
        ],
        danger_down: [
            '{metric}下降明显，如连续几天不足建议排查疼痛或环境干扰。',
            '长时间睡眠不足，必要时咨询医生排除隐性不适。'
        ],
        insufficient: [
            '睡眠还缺少几天记录，再观察即可找到作息规律。',
            '需要更多睡眠数据，才能判断是否进入稳定周期。'
        ]
    },
    medical: {
        excellent: [
            '{metric}记录减少，说明身体正在顺利恢复。',
            '{category}保持低频出现，日常护理做得很到位。'
        ],
        good: [
            '{metric}波动不大，随访周期可以保持原节奏。',
            '{category}状态平稳，继续执行医生给的护理建议即可。'
        ],
        warning_up: [
            '{metric}{trendWord}，留意是否存在复发征兆。',
            '近期{category}{trendWord}，建议尽快复盘药物和生活细节。'
        ],
        danger_up: [
            '{metric}快速{trendWord}，如症状明显请立刻联系医生。',
            '{category}短期内多次出现，建议带宠物做一次复诊。'
        ],
        insufficient: [
            '需要更多{metric}记录，才能观察康复节奏。',
            '刚开始跟踪{category}，持续记录会更易发现规律。'
        ]
    },
    mental: {
        excellent: [
            '{metric}保持平稳，情绪调节做得很好。',
            '心理状态波动小，说明环境安全感充足。'
        ],
        good: [
            '{metric}轻微波动属正常范围，继续陪伴即可。',
            '{category}仍在可控水平，可适时增加互动游戏。'
        ],
        warning_up: [
            '情绪指数出现{trendWord}，尝试增加嗅闻或解压活动。',
            '{metric}{trendWord}略快，关注是否出现分离焦虑。'
        ],
        warning_down: [
            '{metric}{trendWord}，若出现长时间低落需适当转移注意力。',
            '心理活力下降，可尝试奖励训练重建自信。'
        ],
        danger_up: [
            '{metric}剧烈{trendWord}，如伴随破坏或叫唤，建议寻求行为训练支持。',
            '情绪波动大，必要时请专业训练师介入。'
        ],
        danger_down: [
            '{metric}明显{trendWord}，若持续无精打采请尽快咨询医生排除躯体疾病。',
            '心理状态走低，建议安排更多陪伴或户外曬太阳。'
        ],
        insufficient: [
            '再记录几次情绪状态，才能判断是否需要干预。',
            '数据偏少，持续追踪有助于识别触发因素。'
        ]
    }
}

const pickRandom = (templates: string[] = []): string => {
    if (!templates.length) return ''
    const index = Math.floor(Math.random() * templates.length)
    return templates[index]
}

const normalizeNumber = (value: number | string | undefined): number | null => {
    if (value === null || value === undefined) return null
    const num = typeof value === 'number' ? value : Number(value)
    return Number.isFinite(num) ? num : null
}

const mapCategoryToGroup = (category?: string): string => {
    if (!category) return 'default'
    return CATEGORY_GROUP_MAP[category] || 'default'
}

const pickTemplate = (group: string, status: InsightStatus, direction: TrendDirection): string => {
    const templates = GROUP_LIBRARY[group] || {}
    const candidates: string[] = []

    if (direction && (status === 'warning' || status === 'danger')) {
        candidates.push(`${status}_${direction}`)
    }
    candidates.push(status)

    for (const key of candidates) {
        const list = key && templates[key]
        if (list && list.length) {
            return pickRandom(list)
        }
    }

    // fallback to default shared phrases
    for (const key of candidates) {
        const list = (DEFAULT_LIBRARY as any)[key]
        if (list && list.length) {
            return pickRandom(list)
        }
    }

    return ''
}

const determineState = (params: InsightParams & { group: string }): InsightState => {
    const rawValues = Array.isArray(params.values) ? params.values : []
    const values = rawValues
        .map(val => normalizeNumber(val))
        .filter((val): val is number => val !== null)

    if (values.length < 2) {
        return {
            status: 'insufficient',
            direction: 'flat',
            changePercent: 0,
            changeValue: 0,
            group: params.group
        }
    }

    const latest = values[values.length - 1]
    const previous = values[values.length - 2]
    const trendValue = typeof params.trend === 'number' ? params.trend : latest - previous
    const direction: TrendDirection = trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'flat'
    const avgValue = normalizeNumber(params.avg) ?? latest
    const base = Math.max(Math.abs(previous), Math.abs(latest), Math.abs(avgValue), 1)
    const changePercent = Number(((trendValue / base) * 100).toFixed(1))
    const magnitude = Math.abs(changePercent) / 100
    const changeValue = Number(Math.abs(trendValue).toFixed(2))
    const behavior = GROUP_BEHAVIORS[params.group] || 'stable'

    const calmThreshold = 0.02
    const warningThreshold = 0.06
    let status: InsightStatus = 'good'

    if (behavior === 'stable') {
        if (magnitude <= calmThreshold) {
            status = 'excellent'
        } else if (magnitude <= warningThreshold) {
            status = 'warning'
        } else {
            status = 'danger'
        }
    } else {
        if (direction === 'flat') {
            status = 'good'
        } else {
            const directionMatches =
                (behavior === 'up' && direction === 'up') ||
                (behavior === 'down' && direction === 'down')

            if (directionMatches) {
                status = magnitude >= warningThreshold ? 'excellent' : 'good'
            } else {
                status = magnitude >= warningThreshold ? 'danger' : 'warning'
            }
        }
    }

    return {
        status,
        direction,
        changePercent,
        changeValue,
        group: params.group
    }
}

const formatTemplate = (
    template: string,
    context: InsightParams & InsightState & { categoryTitle: string }
): string => {
    if (!template) return ''
    return template
        .replace(/\{metric\}/g, context.metricTitle || '该指标')
        .replace(/\{category\}/g, context.categoryTitle || '该类目')
        .replace(/\{trendWord\}/g, DIRECTION_LABELS[context.direction] || '')
        .replace(/\{changePercent\}/g, Math.abs(context.changePercent).toString())
        .replace(/\{changeValue\}/g, context.changeValue.toString())
        .replace(/\{unit\}/g, context.unit || '')
}

/**
 * 将 TrendResult 映射为 InsightState（兼容旧版）
 */
const mapTrendResultToState = (result: TrendResult, group: string): InsightState => {
    // 映射 direction
    let direction: TrendDirection = 'flat'
    if (result.direction === 'up') direction = 'up'
    else if (result.direction === 'down') direction = 'down'

    // 映射 status
    let status: InsightStatus = 'good'
    if (result.status === 'insufficient') {
        status = 'insufficient'
    } else if (result.status === 'stable') {
        status = 'excellent'
    } else {
        // trending
        const absChange = Math.abs(result.changePercent ?? 0)
        if (absChange >= 30) status = 'danger'
        else if (absChange >= 10) status = 'warning'
        else status = 'good'
    }

    return {
        status,
        direction,
        changePercent: result.changePercent ?? 0,
        changeValue: Math.abs(result.changePercent ?? 0),
        group
    }
}

/**
 * 构建建议句（只负责建议，不计算趋势）
 * 
 * @param state 状态信息
 * @param params 上下文参数
 * @returns 建议句文本
 */
export const buildAdvice = (
    state: InsightState,
    params: { metricTitle?: string; category?: string; unit?: string }
): string => {
    const group = state.group
    const categoryTitle = getCategoryTitle(params.category || 'default')

    const template = pickTemplate(group, state.status, state.direction)
    const fallbackTemplate =
        template ||
        pickTemplate('default', state.status, state.direction) ||
        pickRandom(DEFAULT_LIBRARY[state.status] || [])

    return formatTemplate(fallbackTemplate, {
        ...params,
        ...state,
        categoryTitle
    })
}

/**
 * 构建 Insight 气泡内容（headline + advice 结构）
 * 
 * @param params 输入参数
 * @returns InsightResult 包含 headline、advice 和完整 text
 * 
 * @example
 * ```typescript
 * const result = buildInsightBubble({
 *   metricTitle: '体重',
 *   category: 'bodyMeasurement',
 *   values: [10, 10.2, 10.5, 10.8, 11]
 * })
 * // result.headline = "体重相比上周增长 5%"
 * // result.advice = "最近体重上升，留意零食和主食的热量分配。"
 * // result.text = "体重相比上周增长 5%，最近体重上升，留意零食和主食的热量分配。"
 * ```
 */
export const buildInsightBubble = (params: InsightParams): InsightResult => {
    const group = mapCategoryToGroup(params.category)

    // 1. 提取数值数组
    const rawValues = Array.isArray(params.values) ? params.values : []
    const values = rawValues
        .map(val => normalizeNumber(val))
        .filter((val): val is number => val !== null)

    // 2. 使用统一趋势判定引擎
    const trendResult = evaluateTrend({
        values,
        totalRecordDays: values.length,
        windowDays: 7
    })

    // 3. 生成事实句（与 TrendCard 完全一致）
    const headline = formatHeadline(params.metricTitle || '该指标', trendResult)

    // 4. 映射为 InsightState（兼容旧版）
    const state = mapTrendResultToState(trendResult, group)

    // 5. 生成建议句
    const advice = buildAdvice(state, params)

    // 6. 组合：headline + advice（用逗号连接）
    const text = advice ? `${headline}，${advice}` : headline

    return {
        text,
        headline,
        advice,
        state,
        trendResult
    }
}

/**
 * 仅构建建议句（供外部使用 TrendResult 时调用）
 * 
 * @param trendResult 趋势判定结果
 * @param params 上下文参数
 * @returns 建议句文本
 */
export const buildAdviceFromTrendResult = (
    trendResult: TrendResult,
    params: { metricTitle?: string; category?: string; unit?: string }
): string => {
    const group = mapCategoryToGroup(params.category)
    const state = mapTrendResultToState(trendResult, group)
    return buildAdvice(state, params)
}
