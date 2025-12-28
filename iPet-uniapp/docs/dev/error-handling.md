# Error Handling Baseline (Admin UI)

## Background
To keep error feedback consistent and traceable, the admin UI standardizes API
errors, user notifications, and UI crash handling.

## Scope
- Backend admin UI (`backend-ui`)
- Axios interceptors, TanStack Query global handlers, and UI error boundary

## Rules
- Axios interceptors must throw `AppError { code, message, requestId, detail }`.
- Use the `notify` wrapper for all global error/success messaging.
- TanStack Query `onError` uses `notify.error` to unify feedback.
- Page-level crashes are handled by `ErrorBoundary` with retry + back home actions.

## Example
```ts
// Interceptor
throw new AppError('NETWORK_ERROR', '网络连接失败', requestId, { status });

// Query global handler
queryCache: {
  onError: (error) => notify.error(error, '请求失败，请稍后重试'),
}

// UI crash guard
<ErrorBoundary>
  <AppRouter />
</ErrorBoundary>
```
