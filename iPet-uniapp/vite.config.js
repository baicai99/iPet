import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { viteMockServe } from 'vite-plugin-mock'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'


// Explicitly set the input directory to src to avoid auto-detection issues
process.env.UNI_INPUT_DIR = path.resolve(__dirname, 'src')

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '')
    const isProduction = mode === 'production'
    const isTruthy = (value) => {
        if (typeof value !== 'string') return false
        const normalized = value.trim().toLowerCase()
        return normalized === 'true' || normalized === '1' || normalized === 'on'
    }
    // Only enable runtime mock server when the shared VITE_MOCK flag is truthy
    const enableMock = isTruthy(env.VITE_MOCK)

    // Proxy target: use VITE_PROXY_TARGET or default to localhost:3000 for local dev
    const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:3000'
    console.log(`[Vite] Proxy target: ${proxyTarget}`)

    return {
        plugins: [
            uni(),
            viteMockServe({
                mockPath: 'mock',
                enable: enableMock,
            }),
            visualizer({
                filename: 'dist/stats.html',
                open: false,
                gzipSize: true,
                brotliSize: true,
            }),
        ],
        esbuild: {
            target: 'es2020'
        },
        build: {
            target: 'es2020',
            minify: 'terser',
            terserOptions: {
                compress: {
                    // In development mode build, keep console for debugging Mock
                    // In production mode, drop console for smaller bundle
                    drop_console: isProduction,
                    drop_debugger: true,
                    pure_funcs: isProduction ? ['console.log'] : []
                }
            },
            rollupOptions: {
                output: {
                    manualChunks: {
                        'charts-vendor': ['@qiun/uni-ucharts']
                    }
                }
            }
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '@shared': path.resolve(__dirname, '../shared'),
                '@mock': path.resolve(__dirname, 'mock')
            },
        },
        server: {
            fs: {
                allow: [path.resolve(__dirname), path.resolve(__dirname, '..')]
            },
            proxy: {
                '/api': {
                    target: proxyTarget,
                    changeOrigin: true,
                    secure: false, // Allow localhost without SSL
                },
                // Legacy: /users/register 后端路由不在 /api 下
                // TODO: 后端迁移后删除此代理
                '/users': {
                    target: proxyTarget,
                    changeOrigin: true,
                    secure: false,
                }
            }
        },
        css: {
            preprocessorOptions: {
                scss: {
                    silenceDeprecations: ['legacy-js-api', 'import'],
                },
            },
        },
    }
})
