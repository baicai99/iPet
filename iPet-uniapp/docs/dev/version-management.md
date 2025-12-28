# 版本管理规范

## 规范背景
前端、关于页面、发布包与后端存在多个版本号来源，若手动维护会导致不一致与追溯困难。本规范统一版本来源与同步方式，确保版本号可追溯、可校验、可修正。

## 适用对象
- 前端（iPet-uniapp）
- 后端（iPet-BackEnd）
- 版本展示与发布配置维护者

## 约束规则
- **单一真源**：以 `iPet-uniapp/package.json` 的 `version` 为唯一版本号来源。
- **同步原则**：通过脚本将版本号同步到：
  - `iPet-BackEnd/package.json`
  - `iPet-uniapp/src/manifest.json` 的 `versionName`
- **自动执行**：所有 `dev:*` 与 `build:*` 脚本会自动执行 `sync:version`，无需手动运行。
- **关于页展示**：关于页版本号与“我的”页关于入口的版本号必须读取 `iPet-uniapp/package.json`，禁止手写字符串。
- **版本号记录**：仍遵循 `CHANGELOG` 同日版本锁定规则（见 `AGENTS.md`）。
- **versionCode 说明**：`manifest.json` 的 `versionCode` 仅在发版需要时更新，可用脚本参数显式指定。

## 示例

### 1) 同步版本号（不改 versionCode）
```bash
npm run sync:version -- --version 0.0.18
```

### 2) 同步版本号并更新 versionCode
```bash
npm run sync:version -- --version 0.0.18 --version-code 1800
```

## 生效背景
自 `0.0.18` 起引入版本同步脚本与展示规范，避免前后端版本漂移与手工漏改。
