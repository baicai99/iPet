import { StrictMode, Fragment } from 'react'
import { createRoot } from 'react-dom/client'
import { loadRuntimeConfig } from './core/config/runtimeConfig'
import './index.css'
import App from './App.tsx'

/**
 * 启用 MSW (Mock Service Worker)
 */
async function enableMocking() {
  if (import.meta.env.VITE_MOCK !== 'true') {
    return;
  }

  const { worker } = await import('./mocks/browser');

  // `worker.start()` returns a Promise that resolves
  // once the Service Worker is up and ready to intercept requests.
  return worker.start();
}

/**
 * 应用启动函数
 */
async function bootstrap() {
  try {
    // 1. 加载运行时配置（关键步骤）
    await loadRuntimeConfig();

    // 2. 启用 MSW（如需要）
    await enableMocking();

    // 3. 渲染应用
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element #root not found');
    }

    const RootWrapper = import.meta.env.DEV ? Fragment : StrictMode;

    createRoot(rootElement).render(
      <RootWrapper>
        <App />
      </RootWrapper>,
    );
  } catch (error) {
    console.error('[Bootstrap] Failed to start application:', error);

    // 显示友好的错误页面
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 40px;
          text-align: center;
          background-color: #f0f2f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        ">
          <h1 style="color: #ff4d4f; margin-bottom: 16px;">应用启动失败</h1>
          <p style="color: #666; margin-bottom: 24px;">
            请刷新页面重试，或联系技术支持。
          </p>
          <pre style="
            background: #fff;
            border: 1px solid #d9d9d9;
            border-radius: 4px;
            padding: 16px;
            max-width: 600px;
            overflow: auto;
            text-align: left;
            color: #ff4d4f;
            font-size: 12px;
          ">${error instanceof Error ? error.message : String(error)}</pre>
          <button 
            onclick="window.location.reload()" 
            style="
              margin-top: 24px;
              padding: 8px 24px;
              background: #1677ff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
            "
          >
            刷新页面
          </button>
        </div>
      `;
    }
  }
}

// 启动应用
bootstrap();
