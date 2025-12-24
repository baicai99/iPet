# Health Check and Version Endpoints

System health check and version visibility endpoints for iPet Backend.

## Endpoints

### GET /api/system/health

**Liveness probe** - Returns basic system health status.

**Response (200 OK):**
```json
{
  "status": "ok",
  "version": "0.0.1",
  "commit": "abc1234",
  "buildTime": "2025-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

| Field       | Type   | Description                             |
|-------------|--------|-----------------------------------------|
| status      | string | `ok` or `degraded`                      |
| version     | string | Application version from `APP_VERSION`  |
| commit      | string | Git commit hash from `GIT_COMMIT`       |
| buildTime   | string | ISO timestamp from `BUILD_TIME`         |
| uptime      | number | Seconds since process started           |

---

### GET /api/system/ready

**Readiness probe** - Extends health check with database connectivity.

**Response (200 OK) - Ready:**
```json
{
  "status": "ok",
  "version": "0.0.1",
  "commit": "abc1234",
  "buildTime": "2025-01-01T00:00:00.000Z",
  "uptime": 3600,
  "db": "connected"
}
```

**Response (503 Service Unavailable) - Not Ready:**
```json
{
  "status": "degraded",
  "version": "0.0.1",
  "commit": "abc1234",
  "buildTime": "2025-01-01T00:00:00.000Z",
  "uptime": 3600,
  "db": "disconnected"
}
```

---

## Environment Variables

| Variable      | Default              | Description                      |
|---------------|----------------------|----------------------------------|
| `APP_VERSION` | `0.0.1`              | Application version              |
| `GIT_COMMIT`  | `unknown`            | Git commit hash                  |
| `BUILD_TIME`  | Process start time   | Build timestamp (ISO format)     |
| `NODE_ENV`    | `development`        | Environment name                 |

---

## Startup Logging

On startup, the backend logs a version fingerprint:

```
🚀 iPet Backend Starting
   env: production
   version: 0.0.1
   commit: abc1234
   buildTime: 2025-01-01T00:00:00.000Z
✅ Server listening on port 3000
```

---

## Usage Examples

```bash
# Health check
curl http://localhost:3000/api/system/health

# Readiness check
curl http://localhost:3000/api/system/ready

# Check with jq for formatted output
curl -s http://localhost:3000/api/system/health | jq
```

---

## Kubernetes Probe Configuration

```yaml
livenessProbe:
  httpGet:
    path: /api/system/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/system/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3
```

---

## Docker Compose Health Check

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/system/ready"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```
