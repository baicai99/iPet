interface StorageAdapter {
    get<T = any>(key: string): T | null
    set<T = any>(key: string, value: T): void
    remove(key: string): void
}

const createMemoryStorage = (): StorageAdapter => {
    const globalAny = globalThis as Record<string, any>

    if (!globalAny.__IPET_MOCK_STORAGE__) {
        const store = new Map<string, any>()
        globalAny.__IPET_MOCK_STORAGE__ = {
            get: (key: string) => (store.has(key) ? store.get(key) : null),
            set: (key: string, value: any) => {
                store.set(key, value)
            },
            remove: (key: string) => {
                store.delete(key)
            }
        } as StorageAdapter
    }

    return globalAny.__IPET_MOCK_STORAGE__ as StorageAdapter
}

let cachedStorage: StorageAdapter | null = null

export const getMockStorage = (): StorageAdapter => {
    if (cachedStorage) {
        return cachedStorage
    }

    if (typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function') {
        cachedStorage = {
            get: (key) => uni.getStorageSync(key),
            set: (key, value) => uni.setStorageSync(key, value),
            remove: (key) => {
                if (typeof uni.removeStorageSync === 'function') {
                    uni.removeStorageSync(key)
                } else {
                    uni.setStorageSync(key, null)
                }
            }
        }
        return cachedStorage
    }

    cachedStorage = createMemoryStorage()
    return cachedStorage
}
