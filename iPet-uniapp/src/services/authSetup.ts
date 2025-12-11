import { setupStoreHandlers } from '@/utils/common/request'
import { useUserStore } from '@/stores/userStore'

export const initAuthHandlers = () => {
    const userStore = useUserStore()

    setupStoreHandlers({
        setToken: (token, expiresAt) => {
            userStore.setToken(token, expiresAt)
        },
        clearSession: () => {
            userStore.clearLocalSession()
        }
    })
}
