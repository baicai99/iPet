import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger, createLogger } from '../logger'

describe('Logger Utility', () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        // Spy on console methods
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { })
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
    })

    afterEach(() => {
        // Restore original console methods
        consoleLogSpy.mockRestore()
        consoleWarnSpy.mockRestore()
        consoleErrorSpy.mockRestore()
    })

    describe('Default logger instance', () => {
        it('should export a default logger instance', () => {
            expect(logger).toBeDefined()
            expect(logger.debug).toBeInstanceOf(Function)
            expect(logger.info).toBeInstanceOf(Function)
            expect(logger.warn).toBeInstanceOf(Function)
            expect(logger.error).toBeInstanceOf(Function)
        })
    })

    describe('Logger methods', () => {
        it('should have all log level methods', () => {
            const customLogger = createLogger('test')

            expect(typeof customLogger.debug).toBe('function')
            expect(typeof customLogger.info).toBe('function')
            expect(typeof customLogger.warn).toBe('function')
            expect(typeof customLogger.error).toBe('function')
        })

        it('should format messages with timestamp, level, and namespace', () => {
            const customLogger = createLogger('test-namespace')
            customLogger.warn('Test message')

            expect(consoleWarnSpy).toHaveBeenCalled()
            const callArgs = consoleWarnSpy.mock.calls[0][0]
            expect(callArgs).toMatch(/\[WARN\]/)
            expect(callArgs).toMatch(/\[test-namespace\]/)
            expect(callArgs).toMatch(/Test message/)
        })

        it('should support additional arguments', () => {
            logger.warn('Message', { foo: 'bar' }, 123)

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                expect.stringContaining('Message'),
                { foo: 'bar' },
                123
            )
        })
    })

    describe('Production mode behavior', () => {
        const originalEnv = import.meta.env.PROD

        afterEach(() => {
            // Restore original environment
            // @ts-ignore - Allow modifying readonly property for testing
            import.meta.env.PROD = originalEnv
        })

        it('should always call warn in production', () => {
            // @ts-ignore - Allow modifying readonly property for testing
            import.meta.env.PROD = true

            logger.warn('Production warning')
            expect(consoleWarnSpy).toHaveBeenCalled()
        })

        it('should always call error in production', () => {
            // @ts-ignore - Allow modifying readonly property for testing
            import.meta.env.PROD = true

            const error = new Error('Test error')
            logger.error('Production error', error)

            expect(consoleErrorSpy).toHaveBeenCalled()
        })

        it('should NOT call debug in production', () => {
            // @ts-ignore - Allow modifying readonly property for testing
            import.meta.env.PROD = true

            logger.debug('Production debug')
            expect(consoleLogSpy).not.toHaveBeenCalled()
        })

        it('should NOT call info in production', () => {
            // @ts-ignore - Allow modifying readonly property for testing
            import.meta.env.PROD = true

            logger.info('Production info')
            expect(consoleLogSpy).not.toHaveBeenCalled()
        })
    })

    describe('Development mode behavior', () => {
        const originalEnv = import.meta.env.PROD

        afterEach(() => {
            // Restore original environment
            // @ts-ignore - Allow modifying readonly property for testing
            import.meta.env.PROD = originalEnv
        })

        it('should call debug in development', () => {
            // @ts-ignore - Allow modifying readonly property for testing
            import.meta.env.PROD = false

            logger.debug('Dev debug')
            expect(consoleLogSpy).toHaveBeenCalled()
        })

        it('should call info in development', () => {
            // @ts-ignore - Allow modifying readonly property for testing
            import.meta.env.PROD = false

            logger.info('Dev info')
            expect(consoleLogSpy).toHaveBeenCalled()
        })
    })

    describe('Child logger', () => {
        it('should create child logger with nested namespace', () => {
            const parentLogger = createLogger('parent')
            const childLogger = parentLogger.child('child')

            childLogger.warn('Test')

            expect(consoleWarnSpy).toHaveBeenCalled()
            const callArgs = consoleWarnSpy.mock.calls[0][0]
            expect(callArgs).toMatch(/\[parent:child\]/)
        })
    })

    describe('Error stack trace preservation', () => {
        it('should preserve error stack traces', () => {
            const error = new Error('Test error')
            const originalStack = error.stack

            logger.error('Error occurred', error)

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.any(String),
                error
            )

            // Verify the error object is passed through unchanged
            const passedError = consoleErrorSpy.mock.calls[0][1]
            expect(passedError).toBe(error)
            expect(passedError.stack).toBe(originalStack)
        })
    })
})
