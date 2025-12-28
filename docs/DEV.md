# Development Guide (Baseline)

This document defines the minimal bootstrap steps and regression path for the backend admin UI.

## Scope
- App: `backend-ui` (Vite + React admin dashboard)
- Scripts: root `package.json` forwards to `backend-ui`

## Prerequisites
- Node.js + npm
- Backend API running (or mock enabled)

## Environment Variables
Primary entrypoint:
- `backend-ui/.env.development` (committed)
- Optional overrides: `backend-ui/.env.development.local` (not committed)

Required keys:
```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MOCK=false
```

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
