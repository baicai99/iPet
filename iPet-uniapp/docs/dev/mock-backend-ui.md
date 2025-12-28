# Backend UI Mock Mode

## Background
The admin UI uses MSW for local mocking. To avoid dual data paths, mock is only
enabled when the environment flag is explicitly set.

## Scope
- Backend admin UI (`backend-ui`)
- Mock entrypoint: `src/main.tsx`

## Rules
- Mock is enabled only when `VITE_MOCK=1`.
- When mock is on, API base must stay same-origin (e.g. `/api`) so MSW can intercept.
- Do not keep inline mock logic in features (e.g. login hardcoded credentials).
- Mock data lives under `backend-ui/src/mocks/fixtures`.
- MSW handlers should only reference fixtures.

## Example
```
VITE_MOCK=1 npm run dev
```
