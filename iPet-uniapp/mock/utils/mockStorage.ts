declare const uni: any
declare const global: any

interface StorageAdapter {
    get<T = any>(key: string): T | null
    set<T = any>(key: string, value: T): void
    remove(key: string): void
    clear(): void
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
            },
            clear: () => {
                store.clear()
            }
        } as StorageAdapter
    }

    return globalAny.__IPET_MOCK_STORAGE__ as StorageAdapter
}

let cachedStorage: StorageAdapter | null = null

// Helper to safely get global object
const getGlobal = (): any => {
    if (typeof globalThis !== 'undefined') return globalThis
    if (typeof self !== 'undefined') return self
    if (typeof window !== 'undefined') return window
    if (typeof global !== 'undefined') return global
    throw new Error('Unable to locate global object')
}

export const getMockStorage = (): StorageAdapter => {
    if (cachedStorage) {
        return cachedStorage
    }

    // Try UniApp Storage first
    if (typeof uni !== 'undefined' && typeof uni.getStorageSync === 'function') {
        cachedStorage = {
            get: (key) => {
                const val = uni.getStorageSync(key)
                if (typeof val === 'string' && val.length > 0) {
                    try {
                        return JSON.parse(val)
                    } catch {
                        return val
                    }
                }
                return val
            },
            set: (key, value) => {
                try {
                    // uni.setStorage usually handles object serialization, but we can be explicit if needed
                    uni.setStorageSync(key, value)
                } catch (e) {
                    console.error('MockStorage set error:', e)
                }
            },
            remove: (key) => {
                if (typeof uni.removeStorageSync === 'function') {
                    uni.removeStorageSync(key)
                } else {
                    uni.setStorageSync(key, null)
                }
            },
            clear: () => {
                try {
                    uni.clearStorageSync()
                } catch (e) {
                    console.error('MockStorage clear error:', e)
                }
            }
        }
        return cachedStorage
    }

    // Try Browser localStorage fallback
    const glob = getGlobal()
    if (glob.localStorage) {
        cachedStorage = {
            get: (key) => {
                const item = glob.localStorage.getItem(key)
                try {
                    return item ? JSON.parse(item) : null
                } catch {
                    return item
                }
            },
            set: (key, value) => {
                try {
                    glob.localStorage.setItem(key, JSON.stringify(value))
                } catch (e) {
                    console.error('localStorage set error:', e)
                }
            },
            remove: (key) => glob.localStorage.removeItem(key),
            clear: () => glob.localStorage.clear()
        }
        return cachedStorage
    }

    // Default to Memory Storage
    cachedStorage = createMemoryStorage()
    return cachedStorage
}
