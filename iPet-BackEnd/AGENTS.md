# Repository Guidelines

## Project Structure & Module Organization
- `src-backend/` contains the NestJS application code, organized by feature modules (for example `auth/`, `users/`, `pets/`, `health/`, `health-schedule/`). Entry points live in `src-backend/main.ts` and `src-backend/app.module.ts`.
- `prisma/` holds the database schema and migrations (`schema.prisma`, `migrations/`, `seed.ts`).
- `dist/` is the compiled output from `nest build` (do not edit by hand).
- `scripts/` provides operational utilities (data seed/backfills, packaging).
- `docs/` stores operational documentation.

## Build, Test, and Development Commands
- `npm run start`: run the Nest app in standard mode.
- `npm run start:dev`: run in watch mode for local development.
- `npm run build`: compile the backend into `dist/`.
- `npm run start:prod`: run the compiled build from `dist/`.
- `npm run lint` / `npm run lint:check`: fix or check ESLint issues in `src-backend/`.
- `npm run format`: format TypeScript files under `src/` using Prettier.
- `npm run prisma:generate` / `npm run prisma:push`: generate Prisma client and push schema.

## Coding Style & Naming Conventions
- Language: TypeScript with NestJS modules and providers.
- Formatting and linting: use `npm run format` and `npm run lint` before pushing.
- Naming: folders and files are lowercase, use hyphens for multi-word modules (for example `health-schedule/`). Classes are `PascalCase`, functions/variables `camelCase`.

## Testing Guidelines
- No automated test scripts are currently defined in `package.json`.
- If you introduce tests, align with NestJS defaults (Jest) and add explicit `test`/`test:e2e` scripts.

## Commit & Pull Request Guidelines
- Commits follow Conventional Commits (for example `feat: ...`, `fix: ...`). Keep the scope clear and concise; Chinese summaries are already used in history and are acceptable.
- PRs should include a concise description, linked issue (if any), and notes on validation (manual steps or scripts). Call out Prisma schema or migration changes explicitly.

## Security & Configuration Tips
- Use `.env.example` as the baseline for local configuration; never commit real secrets.
- When changing Prisma schema, run `npm run prisma:generate` and `npm run prisma:push` (or migrations) and note it in the PR.

## Changelog Updates
- After each task, append an entry in `CHANGELOG.md`.
- Use one version per calendar day; only increment on a new date or milestone.
