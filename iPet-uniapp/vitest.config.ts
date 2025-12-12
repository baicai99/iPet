import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.{test,spec}.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/utils/**/*.ts'],
            exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts']
        }
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
            '@shared': resolve(__dirname, '../shared')
        }
    }
})
