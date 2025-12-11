import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * Image Cache Store - LRU cache for avatar/image URLs
 * 
 * 缓存策略：
 * - H5 端：将小尺寸图片转为 Base64 存储，刷新后仍可使用
 * - APP 端：存储本地临时文件路径，APP 重启后仍可访问
 */

// 最大允许转 Base64 的文件大小 (500KB)
const MAX_BASE64_SIZE = 500 * 1024;

// 检测是否为 H5 环境
const isH5 = (): boolean => {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
};

export const useImageCacheStore = defineStore('imageCache', () => {
    // 使用普通对象代替 Map，便于 JSON 序列化
    // 格式: { [remoteUrl]: localPath | base64DataUrl }
    const cache = ref<Record<string, string>>({});

    // 限制缓存大小，防止 storage 溢出
    const MAX_CACHE_SIZE = 30;

    // 获取缓存键的数量
    const cacheSize = computed(() => Object.keys(cache.value).length);

    /**
     * 设置缓存（直接设置，不做 Base64 转换）
     */
    const set = (remoteUrl: string, localPath: string): void => {
        if (!remoteUrl || !localPath) return;

        // 如果超出容量，删除最早的
        const keys = Object.keys(cache.value);
        if (keys.length >= MAX_CACHE_SIZE && !cache.value[remoteUrl]) {
            delete cache.value[keys[0]];
        }

        cache.value[remoteUrl] = localPath;
        console.log('[ImageCache] Set cache:', remoteUrl, '→', localPath.substring(0, 50) + '...');
    };

    /**
     * 将本地文件转为 Base64 并缓存
     * H5 端会转换，其他端直接存储路径
     */
    const setWithBase64 = async (remoteUrl: string, localFilePath: string): Promise<void> => {
        if (!remoteUrl || !localFilePath) return;

        console.log('[ImageCache] setWithBase64 called:', { remoteUrl, localFilePath, isH5: isH5() });

        if (isH5()) {
            try {
                // 使用 fetch 获取 blob 数据
                const response = await fetch(localFilePath);
                const blob = await response.blob();

                console.log('[ImageCache] Blob size:', blob.size);

                // 检查文件大小
                if (blob.size > MAX_BASE64_SIZE) {
                    console.warn('[ImageCache] File too large for Base64 caching:', blob.size);
                    set(remoteUrl, localFilePath);
                    return;
                }

                // 转换为 Base64
                const base64 = await blobToBase64(blob);
                console.log('[ImageCache] Base64 converted, length:', base64.length);
                set(remoteUrl, base64);
            } catch (error) {
                console.error('[ImageCache] Failed to convert to Base64:', error);
                set(remoteUrl, localFilePath);
            }
        } else {
            // 非 H5 端直接存储路径
            set(remoteUrl, localFilePath);
        }
    };

    /**
     * 将 Blob 转换为 Base64 Data URL
     */
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    /**
     * Get cached local path for a remote URL
     */
    const get = (remoteUrl: string): string | undefined => {
        if (!remoteUrl) return undefined;
        return cache.value[remoteUrl];
    };

    /**
     * 获取可显示的图片路径
     * 优先返回本地缓存路径/Base64，如果没有则返回原远程路径
     * 
     * 注意：Cache MISS 在首次加载时是正常行为，图片会在后台被缓存
     */
    const resolve = (remoteUrl?: string | null): string => {
        if (!remoteUrl) return '';

        const cached = cache.value[remoteUrl];
        if (cached) {
            // 使用 debug 级别，避免控制台噪音
            console.debug('[ImageCache] Cache HIT:', remoteUrl);
            return cached;
        }

        // 首次加载时 MISS 是正常的，使用 debug 级别
        console.debug('[ImageCache] Cache MISS:', remoteUrl);
        return remoteUrl;
    };

    /**
     * Check if a URL is cached
     */
    const has = (remoteUrl: string): boolean => {
        return remoteUrl in cache.value;
    };

    /**
     * Clear all cached entries
     */
    const clear = (): void => {
        cache.value = {};
    };

    /**
     * Remove a specific entry
     */
    const remove = (remoteUrl: string): void => {
        delete cache.value[remoteUrl];
    };

    /**
     * 清理无效的缓存条目
     * 在 H5 端，清理非 Base64 的临时路径（blob: 等）
     */
    const cleanupInvalidEntries = (): void => {
        if (!isH5()) return;

        const keys = Object.keys(cache.value);
        let cleanedCount = 0;
        for (const key of keys) {
            const path = cache.value[key];
            // 保留 Base64 data URL 和 http(s) URL
            if (path.startsWith('data:') || path.startsWith('http')) {
                continue;
            }
            // 清理其他临时路径 (blob:, wxfile://, etc.)
            delete cache.value[key];
            cleanedCount++;
        }
        if (cleanedCount > 0) {
            console.log('[ImageCache] Cleaned', cleanedCount, 'invalid entries');
        }
    };

    /**
     * 【H5 专用】从远程 URL 下载并缓存为 Base64
     * 用于预加载列表中的图片
     */
    const cacheRemoteAsBase64 = async (remoteUrl: string): Promise<void> => {
        if (!remoteUrl || cache.value[remoteUrl]) return;

        if (isH5()) {
            try {
                const response = await fetch(remoteUrl, { mode: 'cors' });
                if (!response.ok) return;

                const blob = await response.blob();
                if (blob.size > MAX_BASE64_SIZE) return;

                const base64 = await blobToBase64(blob);
                set(remoteUrl, base64);
            } catch (error) {
                // CORS 或网络错误，静默失败
                console.debug('[ImageCache] Failed to cache remote image:', remoteUrl);
            }
        } else {
            // APP 端使用 downloadFile
            uni.downloadFile({
                url: remoteUrl,
                success: (res) => {
                    if (res.statusCode === 200 && res.tempFilePath) {
                        set(remoteUrl, res.tempFilePath);
                    }
                }
            });
        }
    };

    /**
     * 调试用：打印当前缓存状态
     */
    const debugPrintCache = (): void => {
        console.log('[ImageCache] Current cache:', {
            size: Object.keys(cache.value).length,
            keys: Object.keys(cache.value),
            values: Object.entries(cache.value).map(([k, v]) => ({
                key: k,
                valueType: v.startsWith('data:') ? 'base64' : v.startsWith('http') ? 'url' : 'temp',
                valueLength: v.length
            }))
        });
    };

    return {
        cache,
        cacheSize,
        get,
        set,
        setWithBase64,
        has,
        clear,
        remove,
        resolve,
        cleanupInvalidEntries,
        cacheRemoteAsBase64,
        debugPrintCache
    };
}, {
    persist: {
        paths: ['cache']
    } as any
});
