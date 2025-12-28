# Security Baseline (Admin UI)

## Background
Security-sensitive data must not be persisted in long-lived storage, and the
frontend should provide a clear migration path toward stricter token and CSRF
protection when the backend is ready.

## Scope
- Backend admin UI (`backend-ui`)
- Token storage and browser-side baseline hardening

## Rules
- Do not store access tokens in `localStorage`.
- Current transition: store tokens in `sessionStorage` and migrate legacy tokens
  out of `localStorage` on startup.
- Long-term target: HttpOnly cookie + `withCredentials` + CSRF token (SameSite +
  server validation).
- Any rich-text/Markdown rendering must pass through a sanitizer before display.

## Example
```ts
// token.ts
const storage = sessionStorage;
storage.setItem('admin_token', token);
```

```ts
// markdownSanitizer.ts
const safe = sanitizeMarkdown(rawMarkdown);
```
