# Backend UI ESLint Baseline (2025-12-29)

## Purpose
Capture the initial ESLint error state for traceable remediation.

## Command
```
npm --prefix backend-ui run lint
```

## Output
```
> backend-ui@0.0.0 lint
> eslint .

/Users/zhengjiyuan/Desktop/iPet/backend-ui/public/mockServiceWorker.js
  1:1  warning  Unused eslint-disable directive (no problems were reported)

/Users/zhengjiyuan/Desktop/iPet/backend-ui/src/api/contracts/articles.ts
  60:48  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Users/zhengjiyuan/Desktop/iPet/backend-ui/src/core/init/InitGuard.tsx
  26:23  error  React Hook "useInitState" is called conditionally. React Hooks must be called in the exact same order in every component render  react-hooks/rules-of-hooks
  27:22  error  React Hook "useLocation" is called conditionally. React Hooks must be called in the exact same order in every component render   react-hooks/rules-of-hooks
  29:5   error  React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render     react-hooks/rules-of-hooks

/Users/zhengjiyuan/Desktop/iPet/backend-ui/src/core/init/initStore.ts
  195:18  error  'error' is defined but never used  @typescript-eslint/no-unused-vars

/Users/zhengjiyuan/Desktop/iPet/backend-ui/src/features/init/components/EntryPathStep.tsx
  67:18  error  'error' is defined but never used  @typescript-eslint/no-unused-vars

/Users/zhengjiyuan/Desktop/iPet/backend-ui/src/features/init/pages/InitWizardPage.tsx
  221:18  error  'error' is defined but never used  @typescript-eslint/no-unused-vars

/Users/zhengjiyuan/Desktop/iPet/backend-ui/src/features/init/utils.ts
  12:14  error  'error' is defined but never used  @typescript-eslint/no-unused-vars

/Users/zhengjiyuan/Desktop/iPet/backend-ui/src/test/setup.ts
  34:6  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  42:6  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

/Users/zhengjiyuan/Desktop/iPet/backend-ui/src/test/utils.tsx
  27:10  error  Fast refresh only works when a file only exports components. Move your component(s) to a separate file  react-refresh/only-export-components
  50:1   error  This rule can't verify that `export *` only exports components                                          react-refresh/only-export-components

✖ 13 problems (12 errors, 1 warning)
  0 errors and 1 warning potentially fixable with the `--fix` option.
```
