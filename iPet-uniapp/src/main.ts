import App from './App.vue'
import { i18n } from '@/locale'
import { initPermission } from './permission'
import { initAuthHandlers } from '@/services/authSetup'



// #ifdef VUE3
import { createSSRApp } from 'vue'
import * as Pinia from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import uviewPlus from 'uview-plus'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = Pinia.createPinia()
  pinia.use(createPersistedState({
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync,
    },
  }))
  app.use(pinia)
  app.use(i18n)
  app.use(uviewPlus)

  // Initialize permission interceptors
  initPermission()
  console.log('Current VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
  console.log('Mock mode enabled:', import.meta.env.VITE_USE_MOCK === 'true' ? '✅ YES - Network calls are blocked' : '❌ NO')

  // Initialize auth handlers
  initAuthHandlers()

  return {
    app,
    Pinia
  }
}
// #endif
