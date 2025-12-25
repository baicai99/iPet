# Build Meta Traceability

## Overview

Build meta traceability enables quick verification of production deployments by embedding build metadata directly into the build artifacts. This allows you to answer questions like:

- "Which API endpoint was this build configured to use?"
- "What git commit was used for this deployment?"
- "When was this artifact built?"
- "What environment mode was used?"

## How It Works

During the build process, a Vite plugin generates `build-meta.json` containing:

| Field | Description | Example |
|-------|-------------|---------|
| `mode` | Build mode | `"production"` |
| `platform` | Target platform | `"h5"`, `"mp-weixin"` |
| `apiBaseUrl` | API base URL from env | `"https://api.zhengjiyuan.top/api"` |
| `buildTime` | ISO 8601 timestamp | `"2025-12-25T04:17:26.000Z"` |
| `gitCommit` | Full git commit hash | `"61739586058567a3cdae82622bd62c08323fad28"` |
| `gitCommitShort` | Short commit hash (7 chars) | `"6173958"` |
| `version` | Package version | `"1.0.0"` |

## Files

### Plugin

**[build/vite-plugin-build-meta.ts](file:///Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/build/vite-plugin-build-meta.ts)**

Vite plugin that generates `build-meta.json` during the build process.

**Responsibilities:**
- Agent 5: Creates and maintains the plugin module
- Agent 3: Mounts the plugin in `vite.config.js`

### Runtime Tools

**[src/meta/readBuildMeta.ts](file:///Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/src/meta/readBuildMeta.ts)**

Optional utilities to read build metadata at runtime. Not integrated into main application flow.

**Use cases:**
- Debug panels
- Admin interfaces
- Runtime diagnostics
- Configuration drift detection

## Integration

### Plugin Setup (Agent 3)

Add the plugin to [vite.config.js](file:///Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/vite.config.js):

```javascript
import { buildMetaPlugin } from './build/vite-plugin-build-meta'

export default defineConfig({
  plugins: [
    uni(),
    buildMetaPlugin(), // Add this line
    // ... other plugins
  ]
})
```

### Plugin Options

```typescript
buildMetaPlugin({
  // Custom output filename (default: 'build-meta.json')
  outputFileName: 'build-meta.json',
  
  // Additional env vars to include (default: [])
  includeEnvVars: ['VITE_CUSTOM_VAR']
})
```

## Usage

### Build-Time

The plugin automatically runs during every build:

```bash
# H5 production build
npm run build:h5

# Output: dist/build/h5/build-meta.json
```

```bash
# Mini Program production build
npm run build:mp-weixin

# Output: dist/build/mp-weixin/build-meta.json
```

### Production Verification

Once deployed, you can verify the build metadata directly via HTTP. For pre-build verification, use the `npm run check:env` command family to ensure the configuration being injected matches targets.

```bash
# Direct access to build metadata
curl https://your-domain.com/build-meta.json

# Example response:
{
  "mode": "production",
  "platform": "h5",
  "apiBaseUrl": "https://api.zhengjiyuan.top/api",
  "buildTime": "2025-12-25T04:17:26.000Z",
  "gitCommit": "61739586058567a3cdae82622bd62c08323fad28",
  "gitCommitShort": "6173958",
  "version": "1.0.0"
}
```

**Quick verification checklist:**
1. ✅ Check API URL matches expected environment
2. ✅ Verify git commit matches deployed tag/branch
3. ✅ Confirm build timestamp is recent
4. ✅ Validate version number

### Runtime Usage (Optional)

For debugging or admin panels:

```typescript
import { readBuildMeta, getBuildInfo } from '@/meta/readBuildMeta'

// Fetch and display build info
async function showBuildInfo() {
  try {
    const meta = await readBuildMeta()
    console.log(getBuildInfo(meta))
    
    // Output:
    // Build Information
    // ─────────────────
    // Mode:        production
    // Platform:    h5
    // Version:     1.0.0
    // API URL:     https://api.zhengjiyuan.top/api
    // Build Time:  2025-12-25 12:17:26
    // Git Commit:  6173958
  } catch (error) {
    console.error('Could not load build metadata')
  }
}
```

### Configuration Drift Detection

The runtime reader can detect if the running code doesn't match the build configuration:

```typescript
import { readBuildMeta, validateRuntimeConfig } from '@/meta/readBuildMeta'

const meta = await readBuildMeta()
const warnings = validateRuntimeConfig(meta)

if (warnings.length > 0) {
  console.warn('Configuration drift detected:', warnings)
  // Example: ["API URL mismatch: runtime=/api, build=https://api.example.com/api"]
}
```

## Verification Examples

### Scenario 1: Production Deployment Check

After deploying to production:

```bash
# 1. Check what API URL the build uses
curl https://your-domain.com/build-meta.json | jq -r '.apiBaseUrl'
# Expected: https://api.zhengjiyuan.top/api

# 2. Verify git commit matches release tag
curl https://your-domain.com/build-meta.json | jq -r '.gitCommit'
# Cross-reference with: git rev-parse HEAD

# 3. Check build timestamp
curl https://your-domain.com/build-meta.json | jq -r '.buildTime'
```

### Scenario 2: Debugging Wrong API Calls

User reports: "App is calling the wrong API"

```bash
# Quickly verify which API the production build was configured with
curl https://your-domain.com/build-meta.json | jq .

# Compare with expected configuration
# If apiBaseUrl is wrong, rebuild with correct .env.production
```

### Scenario 3: Version Correlation

```bash
# Get deployed version
DEPLOYED_VERSION=$(curl -s https://your-domain.com/build-meta.json | jq -r '.version')

# Get deployed commit
DEPLOYED_COMMIT=$(curl -s https://your-domain.com/build-meta.json | jq -r '.gitCommit')

# Verify tag matches
git show $DEPLOYED_COMMIT:package.json | jq -r '.version'
# Should match DEPLOYED_VERSION
```

## Platform-Specific Behavior

### H5 Platform

- Platform detected as: `"h5"`
- Uses `VITE_API_BASE_URL` for API URL
- Output: `dist/build/h5/build-meta.json`

### Mini Program (mp-weixin, mp-alipay, etc.)

- Platform detected from `UNI_PLATFORM` or output directory
- Uses `VITE_API_BASE_URL_MP` (falls back to `VITE_API_BASE_URL`)
- Output: `dist/build/mp-weixin/build-meta.json`

> [!IMPORTANT]
> Mini Programs must use absolute URLs (e.g., `https://api.example.com/api`), not relative paths.

## Troubleshooting

### build-meta.json not generated

**Symptom:** File doesn't exist after build

**Possible causes:**
1. Plugin not mounted in `vite.config.js` (Agent 3's responsibility)
2. Build failed before `closeBundle` hook
3. Output directory permissions issue

**Solution:**
```bash
# Verify plugin is loaded
npm run build:h5 2>&1 | grep "Build Meta"
# Should see: [Build Meta] Generated: dist/build/h5/build-meta.json

# Check if file exists
ls -la dist/build/h5/build-meta.json
```

### gitCommit shows "unknown"

**Symptom:** `gitCommit` field contains `"unknown"` instead of hash

**Possible causes:**
1. Building outside of git repository
2. CI environment doesn't have `.git` directory
3. Git not installed

**Solution:**
```bash
# Verify git is available
git rev-parse HEAD

# In CI, ensure .git directory is checked out
# GitHub Actions: uses: actions/checkout@v3 with fetch-depth: 0
```

### apiBaseUrl is empty or wrong

**Symptom:** `apiBaseUrl` field is empty or incorrect

**Possible causes:**
1. Environment variable not set during build
2. Wrong .env file loaded
3. Build mode mismatch

**Solution:**
```bash
# Verify env vars during build
npm run build:h5 -- --mode production

# Check loaded env
cat .env.production | grep VITE_API_BASE_URL

# Explicitly set during build
VITE_API_BASE_URL=https://api.example.com/api npm run build:h5
```

### Cannot fetch build-meta.json at runtime

**Symptom:** `readBuildMeta()` throws 404 error

**Possible causes:**
1. File not included in deployment
2. Server routing doesn't serve static files from root
3. CORS issues (if fetching from different domain)

**Solution:**
```bash
# Verify file exists in deployment
ls dist/build/h5/build-meta.json

# Test static file serving
curl -I https://your-domain.com/build-meta.json
# Should return 200 OK

# For Nginx, ensure static files are served:
# location / {
#   try_files $uri $uri/ /index.html;
# }
```

## Related Documentation

- **Environment Variables**: [docs/env.md](file:///Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/docs/env.md) (if exists)
- **Build Configuration**: Managed by Agent 3
- **CI/CD Integration**: Managed by Agent 4

## Field Reference

### mode

**Type:** `string`

**Values:** `"development"` | `"production"`

**Source:** Vite build mode

**Usage:** Distinguish dev builds from production builds

### platform

**Type:** `string`

**Values:** `"h5"` | `"mp-weixin"` | `"mp-alipay"` | `"app"` | etc.

**Source:** `UNI_PLATFORM` environment variable or output directory detection

**Usage:** Identify which platform the build targets

### apiBaseUrl

**Type:** `string`

**Values:** Absolute URL (e.g., `"https://api.example.com/api"`) or relative path (e.g., `"/api"`)

**Source:** `VITE_API_BASE_URL_MP` (for mini programs) or `VITE_API_BASE_URL`

**Usage:** Verify which API endpoint the build is configured to use

> [!WARNING]
> This is the **build-time** API URL, not runtime. If the app dynamically changes API URLs, this may differ from actual runtime behavior.

### buildTime

**Type:** `string` (ISO 8601 format)

**Example:** `"2025-12-25T04:17:26.000Z"`

**Source:** `new Date().toISOString()` at build time

**Usage:** 
- Verify freshness of deployment
- Correlate with CI/CD pipeline timestamps
- Debug caching issues

### gitCommit

**Type:** `string`

**Example:** `"61739586058567a3cdae82622bd62c08323fad28"` or `"unknown"`

**Source:** `git rev-parse HEAD` (if git is available)

**Usage:**
- Correlate deployment with source code
- Verify correct tag/branch was built
- Debug "which code is running"

### gitCommitShort

**Type:** `string`

**Example:** `"6173958"` or `"unknown"`

**Source:** `git rev-parse --short=7 HEAD`

**Usage:** Human-readable commit reference

### version

**Type:** `string`

**Example:** `"1.0.0"`

**Source:** `package.json` version field

**Usage:** Track deployed version

## Best Practices

### 1. Automate Verification in CI/CD

```bash
#!/bin/bash
# verify-build-meta.sh

# After build, verify metadata exists and is valid
if [ ! -f dist/build/h5/build-meta.json ]; then
  echo "❌ build-meta.json not found"
  exit 1
fi

# Verify API URL matches expected environment
API_URL=$(cat dist/build/h5/build-meta.json | jq -r '.apiBaseUrl')
if [ "$API_URL" != "https://api.zhengjiyuan.top/api" ]; then
  echo "❌ Unexpected API URL: $API_URL"
  exit 1
fi

echo "✅ Build metadata verified"
```

### 2. Include in Release Notes

```markdown
## Release v1.2.3

**Build Info:**
- Commit: 6173958
- Build Time: 2025-12-25 12:17:26
- API Endpoint: https://api.zhengjiyuan.top/api

**Verification:**
```bash
curl https://app.example.com/build-meta.json
```
```

### 3. Display in Admin Panel

For internal tools or admin dashboards:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { readBuildMeta, getBuildInfo } from '@/meta/readBuildMeta'

const buildInfo = ref('')

onMounted(async () => {
  const meta = await readBuildMeta()
  buildInfo.value = getBuildInfo(meta)
})
</script>

<template>
  <pre>{{ buildInfo }}</pre>
</template>
```

### 4. Log on Startup (Development)

```typescript
// main.ts (development only)
if (import.meta.env.DEV) {
  import('@/meta/readBuildMeta').then(({ logBuildMeta }) => {
    logBuildMeta()
  })
}
```

## Security Considerations

> [!CAUTION]
> `build-meta.json` contains information about your infrastructure (API URLs, git commits). Consider:

1. **Public Information**: Only include data you're comfortable exposing publicly
2. **Sensitive URLs**: If your API URL contains secrets, use `includeEnvVars` carefully
3. **Commit Hashes**: Generally safe to expose, but be aware they reveal source code version

**Recommendation:** Build metadata is typically safe for public consumption, but review your organization's security policies.

## Examples

### Example 1: Production H5 Build

```json
{
  "mode": "production",
  "platform": "h5",
  "apiBaseUrl": "https://api.zhengjiyuan.top/api",
  "buildTime": "2025-12-25T04:17:26.000Z",
  "gitCommit": "61739586058567a3cdae82622bd62c08323fad28",
  "gitCommitShort": "6173958",
  "version": "1.0.0"
}
```

### Example 2: Development Build

```json
{
  "mode": "development",
  "platform": "h5",
  "apiBaseUrl": "/api",
  "buildTime": "2025-12-24T20:30:15.000Z",
  "gitCommit": "61739586058567a3cdae82622bd62c08323fad28",
  "gitCommitShort": "6173958",
  "version": "1.0.0"
}
```

### Example 3: Mini Program Build

```json
{
  "mode": "production",
  "platform": "mp-weixin",
  "apiBaseUrl": "https://api.zhengjiyuan.top/api",
  "buildTime": "2025-12-25T04:17:26.000Z",
  "gitCommit": "61739586058567a3cdae82622bd62c08323fad28",
  "gitCommitShort": "6173958",
  "version": "1.0.0"
}
```

## Summary

Build meta traceability provides:
- ✅ **Production Confidence**: Know exactly what was deployed
- ✅ **Quick Debugging**: Rapidly verify API configuration
- ✅ **Audit Trail**: Track which commit is running in production
- ✅ **Zero Runtime Cost**: Pure build-time metadata generation
- ✅ **Simple Verification**: Direct HTTP access to metadata

No changes to application code required. Just mount the plugin and build.
