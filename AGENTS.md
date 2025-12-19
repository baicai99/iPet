# Repository Guidelines

## Project Structure & Module Organization
- `iPet-BackEnd/`: NestJS API (source in `src-backend/`, Prisma in `prisma/`).
- `iPet-uniapp/`: UniApp (Vue 3) client (source in `src/`, build/scripts in `scripts/`, docs in `docs/`).
- `shared/`: shared TypeScript types/validation (imported as `@shared/...`).
- `iPetData/`: local runtime data (uploads/sync/backups); not committed.

## Build, Test, and Development Commands
Backend (from `iPet-BackEnd/`):

```bash
npm install
cp .env.example .env
npm run prisma:generate && npm run prisma:push
npm run start:dev
```

- `npm run lint` / `npm run format`: run ESLint (with `--fix`) and Prettier.
- `npm run build` + `npm run start:prod`: compile to `dist/` and run the production entrypoint.
- `npm run pack`: create `deploy.zip` (also bundles `shared/`).

Client (from `iPet-uniapp/`):
- `npm install`
- `npm run dev:h5` or `npm run dev:mp-weixin`: run locally for target platform.
- `npm run build:h5` (or other `build:*`): produce a release build.
- `npm run type-check`: run `vue-tsc` (required before PRs).

## Coding Style & Naming Conventions
- TypeScript throughout. Prefer small, module-scoped files and explicit DTO/types.
- Use 2-space indentation and let formatters handle layout (avoid manual alignment).
- Backend formatting/linting: Prettier (`iPet-BackEnd/.prettierrc`) + ESLint (`iPet-BackEnd/eslint.config.mjs`). Don’t edit generated `dist/`.
- Nest naming: `*.module.ts`, `*.controller.ts`, `*.service.ts`, DTOs in `dto/*.dto.ts`.

## Testing Guidelines
- Backend: no unit/e2e suite wired yet; use `iPet-BackEnd/verify_fix.sh` for quick API smoke checks.
- Client: utility tests live under `iPet-uniapp/src/**/__tests__` (Vitest config in `iPet-uniapp/vitest.config.ts`); run at minimum `npm run type-check`.

## Commit & Pull Request Guidelines
- Follow Conventional Commits seen in history: `feat:`, `fix:`, `refactor:`, `style:`, `test:`.
- PRs: include purpose, testing steps, and any config/migration notes. For UI changes, add screenshots/screen recordings.

## Security & Configuration Tips
- Never commit secrets (`.env`, JWT/DB/SMTP credentials). Update `.env.example` when introducing new required variables.
