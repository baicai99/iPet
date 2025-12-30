# Development Guide (Baseline)

This document defines the minimal bootstrap steps and regression path for the backend admin UI.

## Scope
- App: `backend-ui` (Vite + React admin dashboard)
- Scripts: root `package.json` forwards to `backend-ui`

## Prerequisites
- Node.js + npm
- Backend API running (or mock enabled)

## Environment Variables
Primary entrypoint (dev mode):
- `backend-ui/.env.dev` (committed)
- Optional overrides: `backend-ui/.env.dev.local` (not committed)
- Shared defaults: `backend-ui/.env`, `backend-ui/.env.local`

Required keys (dev):
```
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:3000
VITE_MOCK=false
```

Notes:
- When `VITE_API_PROXY_TARGET` is set, Vite proxies `/api/*` to the target to avoid CORS in dev.
- For remote API, set `VITE_API_PROXY_TARGET=https://api.zhengjiyuan.top`.

To enable mock mode locally:
```
VITE_MOCK=true
```

## Install
From repo root:
```
cd backend-ui
npm install
```

## Run (Dev)
From `backend-ui`:
```
npm run dev
```

## Quality Gates (from repo root)
```
npm run typecheck
npm run lint
npm run build
```

## E2E (from repo root)
```
npm run test:e2e
```

## Minimal Regression Path (Manual)
1. Login
2. Dashboard
3. Users list
4. Open user detail drawer
5. Articles list

Notes:
- Use valid admin credentials from the backend seed or your local env.
- If mock mode is enabled (`VITE_MOCK=true`), steps should work without backend.
