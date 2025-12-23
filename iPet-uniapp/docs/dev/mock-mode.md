# Mock 模式规范

## 规范背景

为保障开发效率和预览体验，项目仍保留一套 Mock 数据供本地调试使用；但随着 Web Preview 及 H5 预览的使用频率提高，默认走 Mock 导致无法验证真实接口、鉴权或缓存逻辑。本规范旨在将 Mock 逻辑约束为**可控开关 + 明确可追踪的行为**，确保默认上线/预览模式始终使用真实 API，只在显式声明的情况下才启用 Mock。

## 适用对象

- 项目：`iPet-uniapp`
- 范围：运行阶段的 Mock 开关逻辑、API 请求层、Vite 模拟服务与 Mock 代码的入口点
- 相关模块：
  - `src/utils/config.ts`（开关解析 + 启动日志）
  - `src/utils/common/request.ts`（Mock 决策 + 拦截）
  - `vite.config.js`（`vite-plugin-mock` 插件启停）
  - `mock/` 目录及相应 `mockRegistry.ts`（具体 mock 实现）

## 约束规则

1. **唯一开关（`VITE_MOCK`）**：Mock 仅在环境变量 `VITE_MOCK` 明确设置为真值（`true`、`1`、`on` 等）时才启用；未配置或配置为任何其他值均视为关闭。该变量既影响运行时的请求拦截，也控制 `vite-plugin-mock` 的加载，保证 Mock 与真实 API 的行为完全一致。
2. **平台无差异**：任何环境（Web Preview / H5 / 微信开发者工具 / 真机 / 生产）都使用同一个开关来决定数据源，不再依赖 `#ifdef H5`、`envVersion`、`mode` 等额外分支。
3. **数据源决策**：`VITE_MOCK=true` 明确切换到模拟模式，任何请求都会被拦截到 Mock handlers；默认（未设置或为假值）下则完全打真实 API。要恢复真实数据源，只需确保 `VITE_MOCK` 未启用。
4. **开启可追踪**：启动时会打印 `[APP_CONFIG] 🧭 当前数据源: Mock/Real (VITE_MOCK=...)`，作为唯一数据源判断依据。确认日志中的标记即说明当前是否在 Mock 模式。
5. **模拟覆盖要求**：Mock 模式下缺少匹配 handler 就会抛出 `MockFallthroughError`（不再回退到后端），日志也会列出可用路由，确保开发者发现缺失之后补全；如需访问真实后端，请将 `VITE_MOCK` 设置为假值再重启。
6. **生产保障**：发布/生产构建不得设置 `VITE_MOCK`，Mock 相关代码因此不会被默认打包进主包，避免误用与体积膨胀。

## 示例

* `npm run dev:h5`（默认没有 `VITE_MOCK`）：Web Preview 在开发机器中发起真实网络请求，控制台会输出 `[APP_CONFIG] 🧭 当前数据源: Real (VITE_MOCK=unset)`。
* `VITE_MOCK=true npm run dev:h5`：本地开发用 Mock，`vite-plugin-mock` 启动，所有请求都由 mock handlers 返回，可在控制台看到 `Mock` 数据源标记。
* `VITE_MOCK=true npm run dev:mp-weixin`：微信开发者工具/真机预览也会走同一个开关，确保多平台行为一致。
* 生产构建（`npm run build:mp-weixin`、`npm run build:h5` 等）**不要**设置 `VITE_MOCK`；Mock 代码路径会被 tree-shaking 剔除。

在调试时，若不确定 Mock 是否启用，请先确认控制台日志 `[APP_CONFIG] 🧭 当前数据源`，再观察 Network 面板是否与真实 API 对齐。
