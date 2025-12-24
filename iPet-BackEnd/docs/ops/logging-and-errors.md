# Logging & Error Handling

This document describes the observability infrastructure for the iPet backend, including RequestId tracing, structured logging, and unified error responses.

## RequestId Flow

Every HTTP request is assigned a unique `X-Request-Id` that propagates through the entire request lifecycle:

```
Client Request
   │
   ▼
RequestIdMiddleware
   │ - Reads X-Request-Id from header (or generates UUID)
   │ - Sets req.requestId
   │ - Responds with X-Request-Id header
   │ - Stores in AsyncLocalStorage
   ▼
Route Handler / Service Layer
   │ - getRequestId() available anywhere
   ▼
HttpObservabilityInterceptor
   │ - Logs with requestId
   ▼
GlobalExceptionFilter (if error)
   │ - Includes requestId in error response
   ▼
Response to Client (with X-Request-Id header)
```

### Pass-through Behavior

| Scenario | Behavior |
|----------|----------|
| Client sends `X-Request-Id: abc...` | Uses client-provided ID (if valid) |
| No header provided | Generates new UUID v4 |
| Invalid format | Generates new UUID v4 |

Valid ID format: 8-128 characters, alphanumeric + `._:-`

---

## Structured Log Format

All HTTP request logs are output as JSON with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `ts` | string | ISO 8601 timestamp |
| `level` | string | `info`, `warn`, or `error` |
| `type` | string | Log category (e.g., `http.request`) |
| `requestId` | string | Unique request identifier |
| `method` | string | HTTP method (GET, POST, etc.) |
| `url` | string | Request path (without query) |
| `statusCode` | number | HTTP response status code |
| `durationMs` | number | Request duration in milliseconds |
| `userId` | string? | User ID if authenticated |
| `ip` | string | Client IP address |
| `error` | string? | Error message (error logs only) |

### Example

```json
{"ts":"2025-12-24T11:21:00.000Z","level":"info","type":"http.request","requestId":"a1b2c3d4-e5f6-7890-abcd-ef1234567890","method":"GET","url":"/api/pets","statusCode":200,"durationMs":12.34,"userId":"user_123","ip":"192.168.1.1"}
```

---

## Error Response Protocol

All exceptions are handled by `GlobalExceptionFilter` and return a unified format:

```typescript
interface ErrorResponse {
  code: string;      // Machine-readable error code
  message: string;   // Human-readable message
  requestId: string; // For log correlation
  details?: unknown; // Validation errors or extra context
}
```

### Error Codes

| HTTP Status | Code |
|-------------|------|
| 400 | `BAD_REQUEST` |
| 401 | `UNAUTHORIZED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 422 | `VALIDATION_ERROR` |
| 429 | `TOO_MANY_REQUESTS` |
| 500 | `INTERNAL_ERROR` |

### Examples

**Validation Error (400)**
```json
{
  "code": "BAD_REQUEST",
  "message": "email must be an email; password should not be empty",
  "requestId": "abc-123-def",
  "details": ["email must be an email", "password should not be empty"]
}
```

**Not Found (404)**
```json
{
  "code": "NOT_FOUND",
  "message": "Cannot GET /api/nonexistent",
  "requestId": "xyz-789-uvw"
}
```

---

## Debugging with RequestId

To trace a request through logs:

```bash
# Find all log entries for a specific request
grep "requestId\":\"your-request-id" /var/log/app.log

# Or with jq for structured search
cat /var/log/app.log | jq 'select(.requestId == "your-request-id")'
```

### Correlation Workflow

1. User reports error with `requestId` from response
2. Search logs for that `requestId`
3. View complete request lifecycle: timing, status, errors
4. Cross-reference with user context (`userId`, `ip`)

---

## Files

- `src-backend/observability/request-id.middleware.ts` - RequestId generation/passthrough
- `src-backend/observability/request-context.ts` - AsyncLocalStorage for requestId propagation
- `src-backend/observability/observability-logger.service.ts` - Structured JSON logger
- `src-backend/observability/http-observability.interceptor.ts` - Request logging interceptor
- `src-backend/observability/global-exception.filter.ts` - Unified error responses
- `src-backend/observability/observability.module.ts` - Module registration
