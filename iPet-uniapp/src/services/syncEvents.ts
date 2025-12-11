export type SyncEventSource = 'data' | 'auth' | 'system' | 'manual' | string

export interface SyncTriggerPayload {
    reason?: string
    source?: SyncEventSource
    debounceMs?: number
    immediate?: boolean
}

type Listener = (payload: SyncTriggerPayload) => void

const listeners = new Set<Listener>()

export const onSyncTrigger = (listener: Listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export const emitSyncTrigger = (payload: SyncTriggerPayload = {}) => {
    const normalized: SyncTriggerPayload = {
        source: payload.source ?? 'system',
        ...payload
    }
    listeners.forEach(listener => listener(normalized))
}

export const emitDataChanged = (payload: SyncTriggerPayload = {}) => {
    emitSyncTrigger({
        ...payload,
        source: payload.source ?? 'data'
    })
}

export const onDataChanged = (listener: Listener) => {
    return onSyncTrigger((payload) => {
        if (payload.source === 'data') {
            listener(payload)
        }
    })
}
