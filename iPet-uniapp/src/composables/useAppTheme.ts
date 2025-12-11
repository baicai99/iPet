import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePreferenceStore } from '@/stores/preferenceStore'

const THEME_CLASS = 'dark-theme'

const isWebPlatform = (() => {
    if (typeof uni !== 'undefined' && typeof uni.getSystemInfoSync === 'function') {
        try {
            const info = uni.getSystemInfoSync()
            const platform = info?.platform?.toLowerCase?.()
            return platform === 'web' || platform === 'h5'
        } catch (error) {
            console.warn('[Theme] detect platform failed', error)
        }
    }
    return typeof window !== 'undefined' && typeof document !== 'undefined'
})()

const applyThemeClass = (mode: string) => {
    if (typeof document === 'undefined') return
    const isDark = mode === 'dark'
    const targets: Element[] = []
    const root = document.documentElement
    if (root) {
        targets.push(root)
    }
    if (document.body) {
        targets.push(document.body)
    }
    targets.forEach((target) => {
        if (isDark) {
            target.classList.add(THEME_CLASS)
        } else {
            target.classList.remove(THEME_CLASS)
        }
    })
}

const safelyInvoke = (maybePromise: any) => {
    if (maybePromise && typeof maybePromise.then === 'function' && typeof maybePromise.catch === 'function') {
        maybePromise.catch((error: unknown) => {
            const errMsg = (error as any)?.errMsg || ''
            if (errMsg.includes('page not found') || errMsg.includes('not TabBar page')) {
                return
            }
            console.warn('[Theme] native chrome update skipped', error)
        })
    }
}

const updateNativeChrome = (mode: string) => {
    if (typeof uni === 'undefined' || isWebPlatform) {
        return
    }
    const isDark = mode === 'dark'
    const backgroundColor = isDark ? '#0f172a' : '#ffffff'
    const frontColor = isDark ? '#ffffff' : '#000000'

    if (typeof uni.setNavigationBarColor === 'function') {
        const result = uni.setNavigationBarColor({
            frontColor,
            backgroundColor
        })
        safelyInvoke(result)
    }

    if (typeof uni.setTabBarStyle === 'function') {
        const result = uni.setTabBarStyle({
            backgroundColor,
            borderStyle: isDark ? 'white' : 'black',
            color: isDark ? '#94a3b8' : '#374151',
            selectedColor: '#f97316'
        })
        safelyInvoke(result)
    }

    uni.$emit?.('theme-change', mode)
}

const syncTheme = (mode: string) => {
    applyThemeClass(mode)
    updateNativeChrome(mode)
}

export const useAppTheme = () => {
    const preferenceStore = usePreferenceStore()
    const { theme } = storeToRefs(preferenceStore)

    syncTheme(theme.value)

    watch(theme, (mode) => {
        syncTheme(mode)
    }, { immediate: false })

    return {
        theme,
        setTheme: preferenceStore.setTheme,
        toggleTheme: preferenceStore.toggleTheme,
        applyThemeClass,
        updateNativeChrome
    }
}
