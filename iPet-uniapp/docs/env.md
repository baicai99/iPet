# Environment Variables Reference

This document describes all environment variables used in the iPet UniApp project.

## Environment Files

- `.env` - Single source of truth for all environments

Environment variables are loaded from `.env` regardless of the build mode. Adjust values in `.env` before building for different environments.

## API Configuration

### VITE_API_BASE_URL

**Type:** `string`

**Required:** Yes (production), Optional (development)

**Description:** Base URL for API requests. Must end with `/api` (without trailing slash).

**Values:**
- **Development:** `/api` (relative, uses Vite proxy)
- **Production:** `https://api.zhengjiyuan.top/api` (absolute URL)

**Usage:**
```typescript
import { API_BASE_URL } from '@/utils/config'
// API_BASE_URL = "https://api.zhengjiyuan.top/api"
```

**Validation Rules:**
- Production: Must be absolute URL (https://)
- Production: Cannot be localhost (unless `VITE_ALLOW_LOCALHOST_PROD=true`)
- Development: Can be relative path (for Vite proxy)
- Must end with `/api`

**Related:**
- Used in build metadata (see [docs/build-meta.md](file:///Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/docs/build-meta.md))
- Configured in [src/utils/config.ts](file:///Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/src/utils/config.ts)

---

### VITE_API_BASE_URL_MP

**Type:** `string`

**Required:** Yes (for mini-program builds)

**Description:** Base URL for API requests in mini-program environments. Must be absolute URL.

**Values:**
- **Development:** `http://localhost:3000/api` (local backend)
- **Production:** `https://api.zhengjiyuan.top/api`

**Usage:**
Mini programs cannot use relative URLs, so this must always be an absolute URL.

**Validation Rules:**
- Must be absolute URL (http:// or https://)
- Cannot be relative path
- Must end with `/api`

**Related:**
- Used when building for `mp-weixin`, `mp-alipay`, etc.
- Captured in build metadata for mini-program builds

---

### VITE_PROXY_TARGET

**Type:** `string`

**Optional:** Yes

**Default:** `http://localhost:3000`

**Description:** Proxy target for Vite dev server. Where `/api` requests are forwarded during development.

**Values:**
- `http://localhost:3000` - Local backend
- `https://api.zhengjiyuan.top` - Remote backend

**Usage:**
Only affects development server. Production builds don't use proxy.

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_PROXY_TARGET || 'http://localhost:3000'
    }
  }
}
```

---

## Authentication

### VITE_AUTH_BOOTSTRAP

**Type:** `string`

**Optional:** Yes

**Default:** `"login"`

**Description:** Authentication bootstrap strategy when no token is found.

**Values:**
- `guest` - Auto guest login (useful for dev/test)
- `login` - Redirect to login page (production default)
- `none` - Do nothing (for embedded scenarios)

**Usage:**
```typescript
import { AUTH_BOOTSTRAP_MODE } from '@/utils/config'
// AUTH_BOOTSTRAP_MODE = "guest" | "login" | "none"
```

**Recommendations:**
- **Development:** `guest` (faster iteration)
- **Production:** `login` (secure by default)

---

### VITE_DEV_BYPASS_AUTH

**Type:** `boolean`

**Optional:** Yes

**Default:** `false`

**Description:** Skip permission checks in development mode.

**Values:**
- `true` / `1` / `on` - Bypass auth checks
- `false` / `0` / `off` / (unset) - Normal auth checks

**Usage:**
```typescript
import { DEV_BYPASS_AUTH } from '@/utils/config'
if (DEV_BYPASS_AUTH) {
  // Skip permission check
}
```

> [!CAUTION]
> Only affects development mode. Production always enforces auth.

---

## Mock Data

### VITE_MOCK

**Type:** `boolean`

**Optional:** Yes

**Default:** `false`

**Description:** Enable mock data server instead of real API.

**Values:**
- `true` / `1` / `on` - Use mock data
- `false` / `0` / `off` / (unset) - Use real API

**Usage:**
```typescript
import { USE_MOCK } from '@/utils/config'
// USE_MOCK = true | false
```

**Related:**
- Mock data defined in `mock/**`
- Uses `vite-plugin-mock`

---

## Performance Monitoring

### VITE_ENABLE_PERF_MONITOR

**Type:** `boolean`

**Optional:** Yes

**Default:** `true`

**Description:** Enable performance monitoring.

**Values:**
- `true` / (default) - Monitoring enabled
- `false` - Monitoring disabled

**Usage:**
```typescript
import { ENABLE_PERFORMANCE_MONITOR } from '@/utils/config'
```

---

### VITE_PERF_REPORT_URL

**Type:** `string`

**Optional:** Yes

**Default:** `""` (empty string)

**Description:** URL to send performance reports to.

**Usage:**
```typescript
import { PERFORMANCE_REPORT_URL } from '@/utils/config'
if (PERFORMANCE_REPORT_URL) {
  // Send report to URL
}
```

---

## Development Tools

### VITE_ALLOW_LOCALHOST_PROD

**Type:** `boolean`

**Optional:** Yes

**Default:** `false`

**Description:** Allow localhost URLs in production builds (for testing).

**Values:**
- `true` - Allow localhost in production
- `false` - (default) Reject localhost in production

**Usage:**
Only use for local testing of production builds. Never deploy with this enabled.

```bash
# Test production build locally
VITE_ALLOW_LOCALHOST_PROD=true npm run build:h5
```

> [!WARNING]
> Never enable in actual production deployments.

---

## Build-Time Variables

The following variables are captured during build and embedded in `build-meta.json`:

- `VITE_API_BASE_URL` - API endpoint used in build
- `VITE_API_BASE_URL_MP` - Mini-program API endpoint (if applicable)

See [docs/build-meta.md](file:///Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/docs/build-meta.md) for details on how to verify these after deployment.

---

## Environment Variable Access

### Build-Time vs Runtime

Vite environment variables are replaced at **build time**:

```typescript
// ✅ This works (compile-time)
const apiUrl = import.meta.env.VITE_API_BASE_URL

// ❌ This doesn't work (dynamic access)
const key = 'VITE_API_BASE_URL'
const apiUrl = import.meta.env[key]  // Will be undefined
```

### Centralized Access

Always use `src/utils/config.ts` to access environment variables:

```typescript
// ✅ Recommended
import { API_BASE_URL, USE_MOCK } from '@/utils/config'

// ❌ Not recommended (bypasses validation)
const apiUrl = import.meta.env.VITE_API_BASE_URL
```

Benefits of using `config.ts`:
- Validation and error handling
- Type safety
- Single source of truth
- Fallback logic

---

## Validation

Environment variables are validated in [src/utils/config.ts](file:///Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/src/utils/config.ts):

**Production Checks:**
- `VITE_API_BASE_URL` must be set
- Cannot be relative path
- Cannot be localhost (unless explicitly allowed)
- Must end with `/api`

**Development Warnings:**
- Missing variables trigger console warnings
- Invalid formats show warnings

**Fail-Fast:**
Production builds will **throw errors** if critical variables are missing or invalid.

---

## Examples

### .env

```bash
# API Configuration
# 开发建议使用 /api 走代理；生产请改为绝对地址
VITE_API_BASE_URL=/api
VITE_API_BASE_URL_MP=https://api.zhengjiyuan.top/api
VITE_PROXY_TARGET=http://localhost:3000

# Mock & Auth
VITE_MOCK=false
VITE_AUTH_BOOTSTRAP=guest
VITE_DEV_BYPASS_AUTH=false
```

---

## Troubleshooting

### "VITE_API_BASE_URL not set" error

**Cause:** Environment variable missing in production build

**Solution:**
```bash
# Check .env
cat .env | grep VITE_API_BASE_URL

# Or set explicitly
VITE_API_BASE_URL=https://api.example.com/api npm run build:h5
```

### "Prod 环境禁止使用相对路径" error

**Cause:** Using relative path (e.g., `/api`) in production

**Solution:** Use absolute URL in `.env`:
```bash
VITE_API_BASE_URL=https://api.zhengjiyuan.top/api
```

### "Prod 环境禁止使用 localhost" error

**Cause:** Using localhost URL in production build

**Solutions:**
1. Use real domain in `.env`
2. For local testing only: `VITE_ALLOW_LOCALHOST_PROD=true npm run build:h5`

### Mini Program "invalid url" error

**Cause:** Using relative path in `VITE_API_BASE_URL_MP`

**Solution:** Always use absolute URL for mini programs:
```bash
VITE_API_BASE_URL_MP=https://api.zhengjiyuan.top/api
```

---

## Related Documentation

- [Build Meta Traceability](file:///Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/docs/build-meta.md) - How environment variables are captured in builds
- [API Configuration](file:///Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/src/utils/config.ts) - Source code for config validation

---

## Summary

| Variable | Required | Default | Build-Time Capture |
|----------|----------|---------|-------------------|
| `VITE_API_BASE_URL` | Prod: Yes, Dev: No | Dev: `/api` | ✅ Yes |
| `VITE_API_BASE_URL_MP` | MP builds: Yes | - | ✅ Yes (MP only) |
| `VITE_PROXY_TARGET` | No | `http://localhost:3000` | ❌ No |
| `VITE_AUTH_BOOTSTRAP` | No | `login` | ❌ No |
| `VITE_DEV_BYPASS_AUTH` | No | `false` | ❌ No |
| `VITE_MOCK` | No | `false` | ❌ No |
| `VITE_ENABLE_PERF_MONITOR` | No | `true` | ❌ No |
| `VITE_PERF_REPORT_URL` | No | `""` | ❌ No |
| `VITE_ALLOW_LOCALHOST_PROD` | No | `false` | ❌ No |
