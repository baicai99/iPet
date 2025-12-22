# 依赖按需引入规范（降低 vendor.js / 主包体积）

## 规范背景

微信小程序构建产物会将三方依赖集中打入 `common/vendor.js` 以及 `node-modules/**` 等目录；如果采用全量/副作用式引入（例如 `import 'library'`、`import * as X from 'library'` 或 `app.use(整库插件)`），很容易导致整库被编译进主包，从而推高主包体积并拖慢首屏加载。

## 适用对象

- 项目：`iPet-uniapp`
- 平台：微信小程序（`mp-weixin`）
- 范围：运行时代码（`src/**`）与构建配置（如 `vite.config.js`、`src/pages.json`）

## 约束规则

### 1) 通用：禁止整库副作用式引入

- 禁止：`import 'library'`（除非该库明确要求全局副作用且无法替代，例如全局样式入口）。
- 优先：`import { foo } from 'library'`，确保 bundler 能基于 ESM 做 tree-shaking。
- 禁止：`import * as Lib from 'library'` 作为默认写法（会显著降低 tree-shaking 机会）；仅在确有必要（例如需要枚举全部导出）时使用并说明原因。

### 2) Pinia：使用具名引入 + 返回 `app`

- 使用：`import { createPinia } from 'pinia'`
- 避免：`import * as Pinia from 'pinia'` + `return { app, Pinia }`（会把 Pinia 命名空间整体绑定进 bundle）

### 3) Vue：保持具名引入

- 使用：`import { createSSRApp, ref, computed } from 'vue'`
- 避免：`import Vue from 'vue'`、`import * as Vue from 'vue'`

### 4) uview-plus：启用 UniApp 组件级按需引入（easycom）

- 约束：禁止在入口里引入整库并全量注册（例如 `import uviewPlus from 'uview-plus'` + `app.use(uviewPlus)`）。
- 正确方式：依赖 UniApp `easycom` 在 `src/pages.json` 配置组件映射；组件仅在模板中被使用时才会被编译进产物。
- 样式约束：
  - `src/uni.scss` 仅引入变量类内容（例如 `uview-plus/theme.scss`），避免把大量样式混入每个页面导致包体膨胀。
  - 全局样式入口（如 `App.vue`）允许引入 `uview-plus/index.scss`（作为 UI 基础样式），但不要再额外引入整库 JS。

## 示例

### Pinia（推荐写法）

```ts
import { createPinia } from 'pinia'
const pinia = createPinia()
app.use(pinia)
```

### uview-plus（组件级按需）

- 在 `src/pages.json` 配置 `easycom.custom`（本项目已配置 `u-*/up-*` 映射）
- 页面中直接使用组件标签（无需 `import`）：`<u-button />`、`<u-icon />` 等

## 校验方式

- 构建：`npm run build:mp-weixin`
- 主包体积校验：`npm run check:size:mp-weixin`
- 关注：`dist/build/mp-weixin/common/vendor.js` 与 `dist/build/mp-weixin/node-modules/**` 是否出现“未使用也被打入”的依赖目录/文件

