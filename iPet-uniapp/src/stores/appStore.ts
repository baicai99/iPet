import { defineStore } from 'pinia'

interface AppState {
    isAppReady: boolean;
    isNetworkReady: boolean;
}

export const useAppStore = defineStore('app', {
    state: (): AppState => ({
        isAppReady: false,
        isNetworkReady: false
    }),
    actions: {
        setAppReady(status: boolean) {
            this.isAppReady = status
        },
        setNetworkReady(status: boolean) {
            this.isNetworkReady = status
        }
    }
})
