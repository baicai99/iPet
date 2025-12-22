import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { viteMockServe } from 'vite-plugin-mock'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'


// Explicitly set the input directory to src to avoid auto-detection issues
process.env.UNI_INPUT_DIR = path.resolve(__dirname, 'src')

export default defineConfig(({ mode }) => {
    const isProduction = mode === 'production'
    return {
        plugins: [
            uni(),
            viteMockServe({
                mockPath: 'mock',
                enable: !isProduction,
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
