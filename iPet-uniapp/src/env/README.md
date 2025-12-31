# Environment Variables

This module provides validated, type-safe access to environment variables for the iPet frontend application.

## Overview

The environment variable system has two validation points:

1. **Build-time validation** (`scripts/check-env.mjs`): Validates `.env` before the build starts
2. **Runtime validation** (`src/env/index.ts`): Validates `import.meta.env` when the app initializes

Both use the same validation schema defined in [`schema.ts`](file:///Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/src/env/schema.ts).

## Environment Variables

### Required Variables

#### `MODE`
- **Type**: `'development' | 'production'`
- **Description**: The current environment mode (set automatically by Vite)
- **Example**: `production`

#### `VITE_API_BASE_URL`
- **Type**: `string`
- **Description**: Base URL for API requests
- **Validation Rules**:
  - Must end with `/api`
  - **Development**: Can be relative path (e.g., `/api`) or absolute URL
  - **Production**: Must be absolute URL (e.g., `https://api.example.com/api`)
  - **Production**: Cannot be `localhost` or `127.0.0.1` (unless `VITE_ALLOW_LOCALHOST_PROD=true`)
- **Example (dev)**: `/api` or `http://localhost:3000/api`
- **Example (prod)**: `https://api.zhengjiyuan.top/api`

### Optional Variables

#### `VITE_API_BASE_URL_MP`
- **Type**: `string`
- **Description**: Base URL for Mini Program API requests (overrides `VITE_API_BASE_URL` in Mini Program builds)
- **Validation Rules**:
  - Must be absolute URL
  - Must end with `/api`
- **Default**: Empty string (falls back to `VITE_API_BASE_URL`)
- **Example**: `https://api.zhengjiyuan.top/api`

#### `VITE_AUTH_BOOTSTRAP`
- **Type**: `'guest' | 'login' | 'none'`
- **Description**: Authentication bootstrap strategy
  - `guest`: Auto guest login when no token (useful for dev/test)
  - `login`: Redirect to login page when no token (production default)
  - `none`: Do nothing when no token (for embedded scenarios)
- **Default**: `login`

#### `VITE_MOCK`
- **Type**: `boolean`
- **Description**: Enable mock API mode (uses local mock data instead of real API)
- **Default**: `false`
- **Example**: `true`, `false`, `1`, `0`, `on`, `off`

#### `VITE_DEV_BYPASS_AUTH`
- **Type**: `boolean`
- **Description**: Skip permission checks in development mode
- **Default**: `false`

#### `VITE_ENABLE_PERF_MONITOR`
- **Type**: `boolean`
- **Description**: Enable performance monitoring
- **Default**: `true`

#### `VITE_PERF_REPORT_URL`
- **Type**: `string`
- **Description**: URL to send performance reports
- **Default**: Empty string

#### `VITE_ALLOW_LOCALHOST_PROD`
- **Type**: `boolean`
- **Description**: Allow localhost URLs in production mode (for local testing of prod builds)
- **Default**: `false`

## Usage

### In Application Code

```typescript
import { Env } from '@/env'

// Access validated environment variables
console.log(Env.VITE_API_BASE_URL) // Type-safe, guaranteed to be valid
console.log(Env.MODE) // 'development' | 'production'
console.log(Env.VITE_AUTH_BOOTSTRAP) // 'guest' | 'login' | 'none'
```

### Build-time Validation

Run the validation script to check your `.env` file:

```bash
# Validate production environment
node scripts/check-env.mjs --mode production

# Validate development environment
node scripts/check-env.mjs --mode development
```

**Example Output (Success):**
```
✅ Environment validation passed (mode: production)
   - MODE: production
   - VITE_API_BASE_URL: https://api.zhengjiyuan.top/api
   - VITE_AUTH_BOOTSTRAP: login
```

**Example Output (Failure):**
```
❌ Environment validation failed (mode: production):
   - VITE_API_BASE_URL is required in production mode
   - VITE_API_BASE_URL_MP should end with /api, got: "https://api.example.com"

Please fix the errors in .env and try again.
```

### Local Integration

Add validation as an npm script:

```json
{
  "scripts": {
    "check-env:prod": "node scripts/check-env.mjs --mode production",
    "check-env:dev": "node scripts/check-env.mjs --mode development",
    "prebuild": "npm run check-env:prod"
  }
}
```

## Example .env Files

### `.env`

```bash
# Unified environment file
# 开发建议使用 /api 走代理；生产请改为绝对地址
VITE_API_BASE_URL=/api
VITE_API_BASE_URL_MP=https://api.zhengjiyuan.top/api
VITE_AUTH_BOOTSTRAP=login
VITE_MOCK=false
```

## Validation Rules Summary

| Variable | Required | Development | Production | Must End with `/api` |
|----------|----------|-------------|------------|----------------------|
| `VITE_API_BASE_URL` | Yes (Prod only) | Relative or Absolute | Absolute only | Yes |
| `VITE_API_BASE_URL_MP` | No | Absolute | Absolute | Yes |
| `VITE_AUTH_BOOTSTRAP` | No | Any | Any | N/A |

## Troubleshooting

### "VITE_API_BASE_URL is required in production mode"

Make sure `.env` contains `VITE_API_BASE_URL` with an absolute URL:

```bash
VITE_API_BASE_URL=https://api.example.com/api
```

### "VITE_API_BASE_URL must be an absolute URL in production mode"

In production, relative paths like `/api` are not allowed. Use a full URL:

```bash
# ❌ Wrong
VITE_API_BASE_URL=/api

# ✅ Correct
VITE_API_BASE_URL=https://api.example.com/api
```

### "VITE_API_BASE_URL should end with /api"

All API base URLs must end with `/api` for consistency:

```bash
# ❌ Wrong
VITE_API_BASE_URL=https://api.example.com

# ✅ Correct
VITE_API_BASE_URL=https://api.example.com/api
```

## Architecture

This module is designed to be **independent** from the existing [`src/utils/config.ts`](file:///Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/src/utils/config.ts). Both can coexist:

- **`src/utils/config.ts`**: Legacy runtime validation (still used by existing code)
- **`src/env/**`**: New validated environment system (for new code and future migrations)

Other agents can gradually migrate to use `src/env/index.ts` for better type safety and fail-fast validation.
