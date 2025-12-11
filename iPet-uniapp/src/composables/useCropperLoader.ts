import { shallowRef, ref } from 'vue'

// Module-level singleton for cropper component caching
let cachedCropperModule: any = null

/**
 * Composable for lazy loading the u-cropper component
 * Uses a singleton pattern to avoid loading the module multiple times
 */
export function useCropperLoader() {
    const cropperComponent = shallowRef<any>(null)
    const isLoading = ref(false)
    const error = ref<Error | null>(null)

    const loadCropper = async (): Promise<void> => {
        if (cropperComponent.value) return

        if (cachedCropperModule) {
            cropperComponent.value = cachedCropperModule
            return
        }

        isLoading.value = true
        error.value = null

        try {
            const module = await import('uview-plus/components/u-cropper/u-cropper.vue')
            cachedCropperModule = module.default
            cropperComponent.value = cachedCropperModule
        } catch (e) {
            error.value = e as Error
            console.error('[useCropperLoader] Failed to load cropper:', e)
        } finally {
            isLoading.value = false
        }
    }

    const unloadCropper = () => {
        cropperComponent.value = null
    }

    return {
        cropperComponent,
        isLoading,
        error,
        loadCropper,
        unloadCropper
    }
}
