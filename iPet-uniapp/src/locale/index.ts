import { createI18n } from 'vue-i18n'
import zhHans from './zh-Hans'

export const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: 'zh-Hans',
    fallbackLocale: 'zh-Hans',
    messages: {
        'zh-Hans': zhHans
    }
})
