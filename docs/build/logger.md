# Logger Utility

The logger utility provides a structured logging interface with environment-based level gating for the iPet UniApp.

## Features

- 🎯 **Environment-aware**: Automatically filters logs based on dev/prod mode
- 📊 **Multiple log levels**: `debug`, `info`, `warn`, `error`
- 🏷️ **Namespaces**: Organize logs by component or feature
- 📅 **Timestamps**: ISO 8601 formatted timestamps on all logs
- 🔍 **Stack traces**: Preserves error stack traces for debugging

## Usage

### Basic Usage

```typescript
import { logger } from '@/utils/logger'

// Debug - dev only
logger.debug('User clicked button', { buttonId: 'submit' })

// Info - dev only
logger.info('Login successful', { userId: 123 })

// Warning - all environments
logger.warn('API response slow', { duration: 3000, endpoint: '/api/users' })

// Error - all environments
logger.error('Request failed', new Error('Network timeout'))
```

### Namespaced Logger

Create loggers with specific namespaces for better organization:

```typescript
import { createLogger } from '@/utils/logger'

const authLogger = createLogger('auth')
authLogger.info('User logged in', { userId: 123 })
// Output: [2025-12-25T04:17:07.123Z] [INFO] [auth] User logged in {...}

const apiLogger = createLogger('api')
apiLogger.warn('Rate limit approaching', { remaining: 10 })
// Output: [2025-12-25T04:17:07.456Z] [WARN] [api] Rate limit approaching {...}
```

### Child Loggers

Create nested namespaces:

```typescript
import { createLogger } from '@/utils/logger'

const parentLogger = createLogger('services')
const userService = parentLogger.child('user')
userService.info('Fetching user profile')
// Output: [2025-12-25T04:17:07.789Z] [INFO] [services:user] Fetching user profile
```

## Environment Behavior

### Development Mode (`import.meta.env.PROD === false`)

All log levels are enabled:
- ✅ `logger.debug()` → `console.log()`
- ✅ `logger.info()` → `console.log()`
- ✅ `logger.warn()` → `console.warn()`
- ✅ `logger.error()` → `console.error()`

### Production Mode (`import.meta.env.PROD === true`)

Only warnings and errors are enabled:
- ❌ `logger.debug()` → **silenced**
- ❌ `logger.info()` → **silenced**
- ✅ `logger.warn()` → `console.warn()`
- ✅ `logger.error()` → `console.error()`

This ensures:
- Production bundles are smaller (less noise)
- Critical warnings and errors are still visible for monitoring
- Error reporting services can still capture production errors

## Build Configuration

The logger works in tandem with Vite's terser configuration. See `vite.config.js`:

```javascript
terserOptions: {
  compress: {
    drop_console: false, // Don't drop ALL console
    pure_funcs: isProduction ? [
      'console.log',    // Remove in production
      'console.debug'   // Remove in production
    ] : []
    // console.warn and console.error are preserved
  }
}
```

## Integration with Error Monitoring

The logger preserves error stack traces, making it compatible with error monitoring services:

```typescript
try {
  await riskyOperation()
} catch (error) {
  logger.error('Operation failed', error)
  // Error with full stack trace is sent to console.error
  // Error monitoring tools (Sentry, etc.) can capture this
}
```

## Migration Guide (Optional)

**Note**: Migration is **not required** for Agent 3. The logger is provided as infrastructure only.

If you want to migrate existing `console.*` calls to use the logger:

```diff
- console.log('Debug info', data)
+ logger.debug('Debug info', data)

- console.log('User logged in', data)
+ logger.info('User logged in', data)

- console.warn('Slow response', data)
+ logger.warn('Slow response', data)

- console.error('Request failed', error)
+ logger.error('Request failed', error)
```

A future codemod agent can automate this migration if desired.

## API Reference

### `logger`

Default logger instance with namespace `'app'`.

### `createLogger(namespace: string): Logger`

Creates a new logger with a custom namespace.

**Parameters:**
- `namespace` - The namespace for this logger (e.g., `'auth'`, `'api'`, `'storage'`)

**Returns:** `Logger` instance

### `Logger` Methods

#### `debug(message: string, ...args: any[]): void`

Debug-level logging. Only enabled in development.

#### `info(message: string, ...args: any[]): void`

Info-level logging. Only enabled in development.

#### `warn(message: string, ...args: any[]): void`

Warning-level logging. Enabled in all environments.

#### `error(message: string, ...args: any[]): void`

Error-level logging. Enabled in all environments.

#### `child(namespace: string): Logger`

Creates a child logger with nested namespace.

## Examples

### Component-level logging

```typescript
import { createLogger } from '@/utils/logger'

const logger = createLogger('UserProfile')

export default {
  setup() {
    logger.debug('Component mounted')
    
    const handleSave = async () => {
      try {
        logger.info('Saving profile', { userId: 123 })
        await saveProfile()
        logger.info('Profile saved successfully')
      } catch (error) {
        logger.error('Failed to save profile', error)
      }
    }
    
    return { handleSave }
  }
}
```

### Service-level logging

```typescript
import { createLogger } from '@/utils/logger'

const logger = createLogger('api:users')

export class UserService {
  async fetchUser(id: number) {
    logger.debug('Fetching user', { id })
    
    const start = Date.now()
    const user = await api.get(`/users/${id}`)
    const duration = Date.now() - start
    
    if (duration > 2000) {
      logger.warn('Slow user fetch', { id, duration })
    }
    
    logger.info('User fetched', { id, duration })
    return user
  }
}
```
