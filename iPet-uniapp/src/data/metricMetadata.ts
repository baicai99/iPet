/**
 * MetricKey - String Literal Type for all metric keys
 * Provides autocomplete and compile-time type checking
 */
export type MetricKey =
    | 'shoulder_height'
    | 'body_temp'
    | 'weight'
    | 'body_fat'
    | 'bmi'
    | 'lean_mass'
    | 'waist'
    | 'meal'
    | 'water'
    | 'protein'
    | 'carb'
    | 'fat'
    | 'diet_energy'
    | 'walk_duration'
    | 'run_distance'
    | 'run_pace'
    | 'fitness_training'

    | 'stool'
    | 'anxiety'
    | 'depression'
    | 'training'
    | 'bathing'
    | 'deworming'
    | 'rabies_vaccine'
    | 'fish_oil'
    | 'calcium'
    | 'fiber'
    | 'vomiting'
    | 'tooth_brushing'

export interface MetricEnumOption {
    value: number | string;
    label: string;
    icon?: string;
    color?: string;
    severity?: 'normal' | 'warning' | 'danger';
}

export interface TrendInsightConfig {
    up?: string;
    down?: string;
    stable?: string;
}

export interface MetricMetadata {
    key: MetricKey;
    title: string;
    icon?: string;
    displayUnit?: string;
    unit?: string;
    category: string;
    valueType: 'number' | 'enum' | 'score' | 'time' | 'distance' | 'text';
    description?: string;
    recommendation?: string;
    tips?: string;
    enumOptions?: MetricEnumOption[];
    trendInsights?: TrendInsightConfig;
    relatedMetrics?: MetricKey[];
    visualization?: { type: string; options?: Record<string, unknown> };
    calculationMethod?: 'sum' | 'latest' | 'avg';
    interactionMode?: string;
    formConfig?: Record<string, unknown>;
    features?: Record<string, unknown>;
    timeDisplay?: Record<string, unknown>;
}

/**
 * Centralized metric metadata configuration.
 * All static information about metrics lives here.
 */
export const METRIC_METADATA: Record<MetricKey, MetricMetadata> = {
    shoulder_height: {
        key: 'shoulder_height',
        title: '肩高',
        icon: 'icon-colum-height',
        unit: 'cm',
        displayUnit: '厘米',
        category: 'bodyMeasurement',
        valueType: 'number',
        description: '肩高是狗狗体型的关键指标，反映骨骼发育和整体身材。',
        recommendation: '成年中型犬肩高一般在 40–50 cm 之间，品种会有差异。',
        tips: '定期测量肩高，可帮助评估体型是否偏胖或偏瘦。',
        visualization: {
            type: 'trend_line',
            options: { smooth: true }
        }
    },
    body_temp: {
        key: 'body_temp',
        title: '体温',
        icon: 'icon-temperature',
        unit: '°C',
        displayUnit: '摄氏度',
        category: 'vitalSigns',
        valueType: 'number',
        description: '体温是判断宠物是否发烧或低温的重要指标，稳定维持可反映健康状态。',
        recommendation: '成犬常见体温在 38.0–39.3℃，幼犬略高。连续两天超过 39.5℃ 建议就医。',
        tips: '测量时尽量选择同一时段，可使用肛温或专业耳温枪，异常时及时记录。',
        visualization: {
            type: 'trend_line',
            options: { smooth: true, baseline: true }
        }
    },
    weight: {
        key: 'weight',
        title: '体重',
        icon: 'icon-weight',
        unit: 'kg',
        displayUnit: '千克',
        category: 'bodyMeasurement',
        valueType: 'number',
        description: '体重可以反映营养与运动平衡情况，持续上升或下降都需要关注。',
        recommendation: '同体型犬只保持一个月内波动不超过 5% 较为理想。',
        tips: '每周固定时间称重，保持记录能快速发现异常波动。',
        trendInsights: {
            up: '建议适当减少零食摄入，增加运动量。',
            down: '体重下降，请关注进食情况。',
            stable: '体重保持稳定，继续保持！'
        },
        visualization: {
            type: 'trend_line',
            options: { smooth: true }
        },
        relatedMetrics: ['meal', 'walk_duration']
    },
    body_fat: {
        key: 'body_fat',
        title: '体脂率',
        icon: 'icon-percentage',
        unit: 'percent',
        displayUnit: '%',
        category: 'bodyMeasurement',
        valueType: 'number',
        description: '体脂率衡量身体脂肪比例，过高或过低都会影响健康。',
        recommendation: '一般建议 15%–25%，视品种与年龄略有差异。',
        tips: '搭配体重和围度一起观察，更易判断胖瘦趋势。',
        visualization: {
            type: 'trend_line',
            options: { smooth: true }
        }
    },
    bmi: {
        key: 'bmi',
        title: 'BMI',
        icon: 'icon-calculator',
        category: 'bodyMeasurement',
        valueType: 'number',
        description: '宠物 BMI 是从体重与身长估算的体型指数，仅作趋势参考。',
        recommendation: '正常区间依赖品种，一般 18–26 为较合适范围。',
        tips: 'BMI 与体脂率、体重一起观察更有意义。',
        visualization: {
            type: 'trend_line',
            options: {
                smooth: true,
            }
        }
    },
    lean_mass: {
        key: 'lean_mass',
        title: '去脂体重',
        icon: 'icon-muscle',
        unit: 'kg',
        displayUnit: '千克',
        category: 'bodyMeasurement',
        valueType: 'number',
        description: '去脂体重衡量肌肉、骨骼等非脂肪部分，对评估肌肉质量很有价值。',
        recommendation: '保持稳定或缓慢上升通常代表肌肉质量良好。',
        tips: '配合力量训练与高质量蛋白摄入，缓慢提升去脂体重。',
        visualization: {
            type: 'trend_line',
            options: { smooth: true }
        }
    },
    waist: {
        key: 'waist',
        title: '腰围',
        icon: 'icon-diet-waist-1',
        unit: 'cm',
        displayUnit: '厘米',
        category: 'bodyMeasurement',
        valueType: 'number',
        description: '腰围反映脂肪堆积情况，大幅上升可能提示超重风险。',
        recommendation: '建议与体重、体脂率一起监测，保持平稳波动。',
        tips: '测量时让狗狗站立呼气，用软尺水平贴身测量。',
        visualization: {
            type: 'trend_line',
            options: { smooth: true }
        },
        relatedMetrics: ['weight', 'body_fat']
    },
    meal: {
        key: 'meal',
        title: '今日饭量',
        icon: 'icon-Bowl',
        unit: 'g',
        displayUnit: '克',
        category: 'nutritionIntake',
        valueType: 'number',
        description: '记录每日进食量，帮助判断消化与食欲变化。',
        recommendation: '成年犬每日建议摄入量需根据体重和狗粮热量计算。',
        tips: '若出现拒食或忽然暴食，应结合运动量和情绪变化一起查看。',
        visualization: {
            type: 'daily_bar',
            options: { goal: 500 }
        },
        calculationMethod: 'sum'
    },
    water: {
        key: 'water',
        title: '今日喝水',
        icon: 'icon-water',
        unit: 'ml',
        displayUnit: '毫升',
        category: 'nutritionIntake',
        valueType: 'number',
        description: '饮水量可反映代谢与健康状态，过少或过多都需关注。',
        recommendation: '常见经验：体重(kg) x 50–70 ml/天，视运动与气温调整。',
        tips: '确保清洁饮水，夏天和运动后适当增加。',
        visualization: {
            type: 'daily_bar',
            options: { goal: 500 } // Example goal, ideally dynamic
        },
        calculationMethod: 'sum'
    },
    protein: {
        key: 'protein',
        title: '蛋白质摄入',
        icon: 'icon-protein',
        unit: 'g',
        displayUnit: '克',
        category: 'nutritionIntake',
        valueType: 'number',
        description: '蛋白质是肌肉和免疫的重要原料，过低会影响体能。',
        recommendation: '按兽医建议或配方标准给食，不建议频繁大幅波动。',
        tips: '搭配去脂体重监测，确保训练期有足够蛋白补给。',
        visualization: {
            type: 'daily_bar'
        },
        calculationMethod: 'sum'
    },
    carb: {
        key: 'carb',
        title: '碳水化合物',
        icon: 'icon-bread',
        unit: 'g',
        displayUnit: '克',
        category: 'nutritionIntake',
        valueType: 'number',
        description: '碳水化合物提供能量，过量易导致体重上升。',
        recommendation: '运动量大时可适当提高，休息日则适当降低。',
        tips: '注意零食与主粮叠加，避免总量失控。',
        visualization: {
            type: 'daily_bar'
        },
        calculationMethod: 'sum'
    },
    fat: {
        key: 'fat',
        title: '总脂肪',
        icon: 'icon-Cheese',
        unit: 'g',
        displayUnit: '克',
        category: 'nutritionIntake',
        valueType: 'number',
        description: '脂肪是高能量来源，也影响毛发与皮肤状态。',
        recommendation: '保持稳定，避免突然大幅上升导致体重增加。',
        tips: '检查零食和肉类脂肪比例，必要时使用低脂配方。',
        visualization: {
            type: 'daily_bar'
        },
        calculationMethod: 'sum'
    },
    diet_energy: {
        key: 'diet_energy',
        title: '膳食能量',
        icon: 'icon-fire',
        unit: 'kcal',
        displayUnit: '千卡',
        category: 'nutritionIntake',
        valueType: 'number',
        description: '每日能量总摄入，用于平衡体重与活动需求。',
        recommendation: '对体重维持期，能量基本稳定即可；增肌/减脂需调整。',
        tips: '记录主粮、零食与加餐的总热量，避免遗漏。',
        visualization: {
            type: 'daily_bar'
        },
        calculationMethod: 'sum'
    },
    walk_duration: {
        key: 'walk_duration',
        title: '步行时长',
        icon: 'icon-walk',
        unit: 'minute',
        displayUnit: '分钟',
        category: 'activity',
        valueType: 'time',
        description: '每日步行有助于消耗能量并提供环境刺激。',
        recommendation: '成犬常规建议 30–60 分钟，可分多次完成。',
        tips: '炎热天气缩短或分时段完成，注意饮水补充。',
        trendInsights: {
            up: '运动量保持不错，继续加油！',
            down: '最近运动量不足，周末带它去公园跑跑吧！',
            stable: '运动量稳定，保持规律很重要。'
        },
        visualization: {
            type: 'daily_bar',
            options: { goal: 45 }
        },
        calculationMethod: 'sum'
    },
    run_distance: {
        key: 'run_distance',
        title: '跑步距离',
        icon: 'icon-run',
        unit: 'km',
        displayUnit: '公里',
        category: 'activity',
        valueType: 'distance',
        description: '跑步距离反映耐力和训练量，需循序渐进。',
        recommendation: '保持平稳增加，每周不超过 10% 的增量更安全。',
        tips: '关注关节与爪垫状态，地面过热时避免跑步。',
        visualization: {
            type: 'daily_bar'
        },
        calculationMethod: 'sum'
    },
    run_pace: {
        key: 'run_pace',
        title: '跑步速度',
        icon: 'icon-speed',
        unit: 'min_per_km',
        displayUnit: '分/公里',
        category: 'activity',
        valueType: 'time',
        description: '配速用于衡量耐力训练强度，数值越小速度越快。',
        recommendation: '耐力为主时保持舒适可交谈的配速，冲刺训练再降低配速。',
        tips: '逐步提升，避免突然高强度导致拉伤。',
        visualization: {
            type: 'trend_line',
            options: { smooth: true }
        }
    },
    fitness_training: {
        key: 'fitness_training',
        title: '体能训练',
        icon: 'icon-dumbbell',
        category: 'activity',
        valueType: 'score',
        description: '体能训练强度主观 1–10 分，帮助记录每日负荷。',
        recommendation: '连续高强度日不宜过多，注意穿插轻松恢复日。',
        tips: '结合步行与跑步量一起看，避免过度训练。',
        visualization: {
            type: 'daily_bar'
        }
    },

    stool: {
        key: 'stool',
        title: '排泄状况',
        icon: 'icon-poop',
        category: 'excretion',
        valueType: 'text',
        interactionMode: 'status_tag',
        formConfig: {
            type: 'tags',
            multiSelect: false,
            options: [
                { label: '羊屎蛋', value: 1 },
                { label: '干', value: 2 },
                { label: '偏干', value: 3 },
                { label: '正常', value: 4 },
                { label: '偏稀', value: 5 },
                { label: '稀', value: 6 },
                { label: '水样', value: 7 }
            ]
        },
        description: '记录排便次数和状态，帮助监测消化健康。',
        recommendation: '大多数犬每天 1–2 次，质地成型不软不硬为宜。',
        tips: '若连续多天稀/硬便或带血，及时咨询兽医。',
        visualization: {
            type: 'state_grid',
            options: {
                levels: ['偏干', '正常', '偏稀']
            }
        }
    },
    anxiety: {
        key: 'anxiety',
        title: '焦虑风险',
        icon: 'icon-anxiety',
        category: 'mentalHealth',
        valueType: 'text',
        description: '焦虑风险分数越高表示可能存在焦虑行为或情绪波动。',
        recommendation: '持续高分建议增加陪伴、训练或咨询行为专家。',
        tips: '结合睡眠、运动与环境变化一起观察，降低突发应激。',
        visualization: {
            type: 'state_grid',
            options: {
                levels: ['Low', 'Medium', 'High']
            }
        }
    },
    depression: {
        key: 'depression',
        title: '抑郁',
        icon: 'icon-sad',
        category: 'mentalHealth',
        valueType: 'text',
        description: '抑郁情绪可能表现为食欲下降、活力减退、不愿互动。',
        recommendation: '若持续低落超过 2 周，建议咨询兽医或行为专家。',
        tips: '增加陪伴时间、户外活动和游戏互动，有助于改善情绪。',
        visualization: {
            type: 'state_grid',
            options: {
                levels: ['None', 'Mild', 'Severe']
            }
        }
    },
    training: {
        key: 'training',
        title: '训练',
        icon: 'icon-Whistle',
        unit: 'min',
        displayUnit: '分钟',
        category: 'activity',
        valueType: 'time',
        description: '记录宠物的训练时长，包括基础服从训练、技能训练等。',
        recommendation: '建议每天进行 10-30 分钟的训练，保持宠物活跃和听话。',
        tips: '训练时间不宜过长，注意观察宠物的疲劳程度。',
        visualization: {
            type: 'daily_bar'
        },
        calculationMethod: 'sum'
    },
    bathing: {
        key: 'bathing',
        title: '洗澡',
        icon: 'icon-bath',
        unit: 'count',
        displayUnit: '次',
        category: 'otherData',
        valueType: 'number',
        interactionMode: 'task',
        formConfig: {
            type: 'tags',
            multiSelect: false,
            options: [
                { label: '在家洗', value: 'home' },
                { label: '宠物店', value: 'shop' }
            ]
        },
        description: '记录宠物洗澡频率，保持皮肤和毛发健康。',
        recommendation: '一般建议每 1-2 周洗澡一次，具体根据品种和活动量调整。',
        tips: '洗澡过频可能破坏皮肤油脂平衡，导致皮肤干燥。',
        features: {
            schedulable: true,
            defaultRepeat: 'week',
            recurrenceMode: 'elastic' // Elastic: next date based on ACTUAL completion
        },
        visualization: {
            type: 'event_timeline'
        },
        timeDisplay: {
            miniChartDays: 30,
            detailDefaultTab: 'month'
        }
    },
    deworming: {
        key: 'deworming',
        title: '驱虫',
        icon: 'icon-bug',
        unit: 'count',
        displayUnit: '次',
        category: 'medication',
        valueType: 'number',
        interactionMode: 'task',
        formConfig: {
            type: 'tags',
            multiSelect: true, // 保持允许记录时多选，但在预约时我们会通过代码限制
            options: [
                { label: '体内驱虫', value: 'internal' },
                { label: '体外驱虫', value: 'external' }
            ]
        },
        description: '记录体内外驱虫次数，预防寄生虫感染。',
        recommendation: '建议分开设置计划：体内驱虫通常每3个月一次，体外驱虫通常每月一次。',
        tips: '驱虫后观察宠物排便情况，如有异常及时就医。',
        features: {
            schedulable: true,
            defaultRepeat: 'month',
            recurrenceMode: 'anchor' // Anchor: strict cycles
        },
        visualization: {
            type: 'event_timeline'
        },
        timeDisplay: {
            miniChartDays: 90,
            detailDefaultTab: 'six_month'
        }
    },
    rabies_vaccine: {
        key: 'rabies_vaccine',
        title: '疫苗',
        icon: 'icon-vaccine',
        unit: 'count',
        displayUnit: '次',
        category: 'medication',
        valueType: 'number',
        interactionMode: 'task',
        formConfig: {
            type: 'tags',
            multiSelect: false,
            options: [
                { label: '狂犬疫苗', value: 'rabies' },
                { label: '六联疫苗', value: 'six_in_one' },
                { label: '八联疫苗', value: 'eight_in_one' }
            ]
        },
        description: '记录宠物常规疫苗（狂犬、基础病多联）接种情况，保护宠物和家人安全。',
        recommendation: '按免疫证安排“两针多联+狂犬”后，通常每年加强一次，确保免疫效果。',
        tips: '接种后 7 天内避免洗澡和剧烈运动。',
        features: {
            schedulable: true,
            defaultRepeat: 'year',
            recurrenceMode: 'anchor'
        },
        visualization: {
            type: 'event_timeline'
        },
        timeDisplay: {
            miniChartDays: 180,
            detailDefaultTab: 'year'
        }
    },
    fish_oil: {
        key: 'fish_oil',
        title: '鱼油',
        icon: 'icon-fish',
        unit: 'ml',
        displayUnit: '毫升',
        category: 'nutritionIntake',
        valueType: 'number',
        description: '记录鱼油补充量，富含 Omega-3，有助于皮肤和关节健康。',
        recommendation: '根据体重，每天补充 0.5-2ml 鱼油。',
        tips: '选择宠物专用鱼油，避免人用鱼油可能含有的添加剂。',
        visualization: {
            type: 'daily_bar'
        },
        calculationMethod: 'sum'
    },
    calcium: {
        key: 'calcium',
        title: '钙',
        icon: 'icon-bone',
        unit: 'mg',
        displayUnit: '毫克',
        category: 'nutritionIntake',
        valueType: 'number',
        description: '记录钙摄入量，支持骨骼和牙齿健康。',
        recommendation: '成年犬每天需要 50-100mg/kg 体重的钙。',
        tips: '过量补钙可能导致骨骼问题，应根据兽医建议补充。',
        visualization: {
            type: 'daily_bar'
        },
        calculationMethod: 'sum'
    },
    fiber: {
        key: 'fiber',
        title: '纤维',
        icon: 'icon-vegetable',
        unit: 'g',
        displayUnit: '克',
        category: 'nutritionIntake',
        valueType: 'number',
        description: '记录膳食纤维摄入量，促进消化系统健康。',
        recommendation: '建议每天摄入 2-5g 纤维，具体根据体重调整。',
        tips: '适量纤维有助于肠道蠕动，但过多可能影响营养吸收。',
        visualization: {
            type: 'daily_bar'
        },
        calculationMethod: 'sum'
    },
    vomiting: {
        key: 'vomiting',
        title: '呕吐',
        icon: 'icon-Vomiting',
        category: 'vitalSigns',
        valueType: 'text',
        description: '记录呕吐频率和状态，帮助监测消化系统健康和潜在疾病。',
        recommendation: '偶尔呕吐可能是正常现象，但频繁呕吐需及时就医。',
        tips: '记录呕吐物的颜色、内容物和时间，有助于兽医诊断。',
        visualization: {
            type: 'event_timeline'
        },
        timeDisplay: {
            miniChartDays: 30,
            detailDefaultTab: 'month'
        }
    },
    tooth_brushing: {
        key: 'tooth_brushing',
        title: '刷牙',
        icon: 'icon-Tooth',
        unit: 'count',
        displayUnit: '次',
        category: 'otherData',
        valueType: 'number',
        interactionMode: 'task',
        formConfig: {
            type: 'tags',
            multiSelect: false,
            options: [] // Check-in type, no selection needed
        },
        description: '记录刷牙次数，维护口腔健康，预防牙结石和牙龈疾病。',
        recommendation: '建议每周至少刷牙 2-3 次，理想情况下每天刷牙。',
        tips: '使用宠物专用牙膏和牙刷，从小培养刷牙习惯更容易接受。',
        features: {
            schedulable: true,
            defaultRepeat: 'week',
            recurrenceMode: 'elastic'
        },
        visualization: {
            type: 'event_timeline'
        },
        timeDisplay: {
            miniChartDays: 30,
            detailDefaultTab: 'month'
        }
    }
}

import { usePreferenceStore } from '@/stores/preferenceStore'

/**
 * Get metadata for a specific metric.
 * 
 * @param {string} metricKey - The unique metric identifier
 * @returns {MetricMetadata | undefined} Metric metadata or undefined if not found
 */
const VACCINE_FORM_OPTIONS = [
    { label: '狂犬疫苗', value: 'rabies' },
    { label: '六联疫苗', value: 'six_in_one' },
    { label: '八联疫苗', value: 'eight_in_one' }
]

const VACCINE_KEYS = new Set(['rabies_vaccine', 'vaccine'])

const normalizeMetricMetadata = (metadata: MetricMetadata): MetricMetadata => {
    if (!VACCINE_KEYS.has(metadata.key)) {
        return metadata
    }

    return {
        ...metadata,
        title: '疫苗',
        description: metadata.description || '记录宠物常规疫苗（狂犬、基础病多联）接种情况，保护宠物和家人安全。',
        recommendation: metadata.recommendation || '按免疫证安排“两针多联+狂犬”后，通常每年加强一次，确保免疫效果。',
        formConfig: {
            type: 'tags',
            multiSelect: false,
            ...(metadata.formConfig || {}),
            options: VACCINE_FORM_OPTIONS
        }
    }
}

export function getMetricMetadata(metricKey: MetricKey | string): MetricMetadata | undefined {
    const resolvedKey = (metricKey === 'vaccine' ? 'rabies_vaccine' : metricKey) as MetricKey
    const baseConfig = METRIC_METADATA[resolvedKey]
    const base = baseConfig
        ? (resolvedKey === metricKey ? baseConfig : { ...baseConfig, key: metricKey as MetricKey })
        : undefined
    if (!base) return undefined

    try {
        const store = usePreferenceStore()
        const override = store.metricConfig?.[metricKey]
        if (override) {
            return normalizeMetricMetadata({
                ...base,
                ...override,
                trendInsights: {
                    ...(base.trendInsights || {}),
                    ...(override.trendInsights || {})
                }
            })
        }
    } catch (e) {
        // Store might not be ready or Pinia not installed yet (e.g. in tests)
    }
    return normalizeMetricMetadata(base)
}

/**
 * Get all metric keys.
 * 
 * @returns {string[]} Array of all metric keys
 */
export function getAllMetricKeys(): MetricKey[] {
    return Object.keys(METRIC_METADATA) as MetricKey[]
}

/**
 * Get all metrics for a specific category.
 * 
 * @param {string} category - The category to filter by
 * @returns {MetricMetadata[]} Array of metric metadata for the category
 */
export function getMetricsByCategory(category: string): MetricMetadata[] {
    return Object.values(METRIC_METADATA).filter(m => m.category === category)
}

/**
 * Check if a metric key exists.
 * 
 * @param {string} metricKey - The metric key to check
 * @returns {boolean} True if the metric exists
 */
export function metricExists(metricKey: string): boolean {
    return metricKey in METRIC_METADATA
}
