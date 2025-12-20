# 依赖补丁（postinstall）机制

## 规范背景

部分上游依赖（尤其是 alpha/rc 版本）可能存在构建期缺陷。为避免在等待上游发布期间阻塞开发/构建，本项目允许对依赖进行“可追溯、可回滚”的最小补丁处理。

## 适用对象

- 维护构建工具链的开发者
- CI/本地安装依赖的执行环境（`npm install` / `npm ci`）

## 约束规则

- 必须通过 `postinstall` 自动应用，避免“只在某台机器改过 node_modules”导致不可复现。
- 补丁必须幂等（重复执行不应破坏文件）。
- 补丁失败必须显式报错并中断安装（防止静默失败后继续产出不可信构建结果）。
- 每次新增/修改补丁必须同步更新 Changelog，并说明影响范围与原因。
- 补丁只允许修复构建期/开发期问题；不得将业务逻辑长期依赖于对 node_modules 的修改。

## 示例

- `iPet-uniapp/package.json` 的 `postinstall` 会运行 `scripts/patch-uni-sourcemap.mjs`，用于修复上游 `uni:sourcemap` 插件在部分输出类型下的崩溃问题。

