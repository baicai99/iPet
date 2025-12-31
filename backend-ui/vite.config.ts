import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      {
        name: 'exclude-msw-in-build',
        apply: 'build',
        closeBundle() {
          // 在生产构建中删除 MSW Service Worker（从 public 复制的文件）
          const mswPath = path.resolve(__dirname, 'dist/mockServiceWorker.js');
          if (fs.existsSync(mswPath)) {
            fs.unlinkSync(mswPath);
            console.info('[Build] Removed mockServiceWorker.js from production bundle');
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            antd: ['antd', '@ant-design/icons'],
            charts: ['echarts', 'echarts-for-react'],
            vendor: ['axios', '@tanstack/react-query'],
          },
        },
      },
    },
  }
})
