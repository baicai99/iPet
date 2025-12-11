import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { viteMockServe } from 'vite-plugin-mock'
import path from 'path'


// Explicitly set the input directory to src to avoid auto-detection issues
process.env.UNI_INPUT_DIR = path.resolve(__dirname, 'src')

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    return {
        plugins: [
            uni(),
            viteMockServe({
                mockPath: 'mock',
                enable: env.VITE_USE_MOCK === 'true',
            }),
        ],
        esbuild: {
            target: 'es2020'
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '@shared': path.resolve(__dirname, '../shared')
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
