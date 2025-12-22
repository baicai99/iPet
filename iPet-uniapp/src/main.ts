import App from './App.vue'
import { i18n } from '@/locale'
import { initPermission } from './permission'
import { initAuthHandlers } from '@/services/authSetup'
import { initGlobalErrorHandler } from '@/utils/performance/performanceMonitor'
import { APP_CONFIG, IS_MOCK_MODE } from '@/utils/config'



// #ifdef VUE3
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
// uview-plus is handled by easycom in pages.json for tree-shaking

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  pinia.use(createPersistedState({
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync,
    },
  }))
  app.use(pinia)
  app.use(i18n)

  // Initialize permission interceptors
  initPermission()
  console.log('Current API_BASE_URL:', APP_CONFIG.API_BASE_URL)
  console.log('Run mode:', APP_CONFIG.RUN_MODE)
  console.log('Mock mode enabled:', IS_MOCK_MODE ? '✅ YES - Network calls are blocked' : '❌ NO')

  // Initialize auth handlers
  initAuthHandlers()

  // Initialize global error handler for performance monitoring
  initGlobalErrorHandler(app)

  return {
    app
  }
}
// #endif
