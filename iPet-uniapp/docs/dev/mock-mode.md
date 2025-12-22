# Mock 模式规范

## 规范背景

为满足微信小程序主包体积预算与线上稳定性要求，生产构建必须避免将 Mock 数据/逻辑打入产物；同时在本地开发与预览调试阶段需要启用 Mock，以保障“无后端/弱后端”条件下页面可用与联调效率。

## 适用对象

- 项目：`iPet-uniapp`
- 范围：运行与构建阶段的 Mock 开关规则（所有平台通用，`mp-weixin` 为重点）
- 相关模块：`src/utils/config.ts`、`src/utils/common/request.ts`、`src/utils/common/mockRegistry.ts`

## 约束规则

- **Mock 开关与接口环境解耦**：
  - 接口来源仅由环境变量控制（如 `VITE_API_BASE_URL`）。
  - 是否启用 Mock 由运行模式控制（`mp-weixin` 以 `envVersion` 为准；其它平台以 Vite `mode` 为准），不再通过 `.env` 写入 `VITE_USE_MOCK` 等开关变量。
- **微信小程序（`mp-weixin`）运行环境**：
  - `envVersion=release`：Mock 关闭（走真实接口）。
  - `envVersion=develop|trial`：Mock 开启（用于 HBuilderX 运行/预览、微信开发者工具预览/体验版）。
- **HBuilderX 预览/体验版特例**：
  - 由于 HBuilderX 生成的 `envVersion` 仍然是 `release`，可在 `.env.preview` 中设置 `VITE_FORCE_ENABLE_MOCK=true`，或在微信开发者工具中通过 “项目配置 > 更多设置 > 自定义编译参数” 注入该变量，确保 mock 在预览时仍然生效。
- **其它平台运行环境**：
  - `mode=production`：Mock 关闭；非 `production`：Mock 开启。

## 示例

- 本地开发（Mock ✅）：`npm run dev:mp-weixin`
- 本地开发（生产接口/无 Mock ❌）：`npm run dev:mp-weixin:prod`
- 预览构建（Mock ✅）：`npm run build:mp-weixin:preview`（或 `npm run build:mp-weixin:mock`）
- 生产构建（Mock ❌）：`npm run build:mp-weixin`
