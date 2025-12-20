export const iconfontChar = (hexCode: string): string => {
    const normalized = hexCode.trim().toLowerCase().replace(/^0x/, '').replace(/^\\u/, '')
    const codePoint = Number.parseInt(normalized, 16)
    if (!Number.isFinite(codePoint)) return ''
    return String.fromCharCode(codePoint)
}

/**
 * Alibaba Iconfont (Unicode usage)
 * - Use these values directly in `<text class="iconfont">...</text>`
 * - Keep this mapping as the single source of truth for UI icon glyphs.
 */
export const ICONFONT_UNICODE = {
    // Tabbar
    likeFill: iconfontChar('e668'),
    like: iconfontChar('e669'),
    my: iconfontChar('e78b'),
    myFill: iconfontChar('e78c'),

    // Health metrics
    shoulderHeight: iconfontChar('e7ef'),
    bodyTemp: iconfontChar('e67a'),
    weight: iconfontChar('e737'),
    bodyFat: iconfontChar('e7e2'),
    bmi: iconfontChar('e799'),
    leanMass: iconfontChar('eaf9'),
    waist: iconfontChar('e6a6'),
    meal: iconfontChar('e63d'),
    water: iconfontChar('e6bc'),
    protein: iconfontChar('e6aa'),
    carb: iconfontChar('e995'),
    fat: iconfontChar('e692'),
    dietEnergy: iconfontChar('e842'),
    walkDuration: iconfontChar('e927'),
    runDistance: iconfontChar('e643'),
    runPace: iconfontChar('e7a7'),
    fitnessTraining: iconfontChar('e6e1'),
    stool: iconfontChar('e5b5'),
    anxiety: iconfontChar('e613'),
    depression: iconfontChar('e66f'),
    training: iconfontChar('eb6b'),
    bathing: iconfontChar('e60b'),
    deworming: iconfontChar('e8e8'),
    rabiesVaccine: iconfontChar('e743'),
    fishOil: iconfontChar('e9ef'),
    calcium: iconfontChar('e992'),
    fiber: iconfontChar('e63e'),
    vomiting: iconfontChar('ed76'),
    toothBrushing: iconfontChar('e6c9'),

    // Pets
    petDefault: iconfontChar('e552'),
    petDog: iconfontChar('e647'),
    petCat: iconfontChar('e64d'),

    // Fallback
    file: iconfontChar('e739')
} as const
