# Backend UI 运行时配置规范

## 规范背景
后台管理端需要在不重新构建的情况下切换 API 地址与 Mock 开关。当前实现支持运行时配置文件与构建时环境变量两套来源，需明确优先级与最小部署变量。

## 适用对象
- 后台管理端（backend-ui）部署与运维
- 负责生产环境变量注入的发布流程

## 约束规则
1. **最终生效来源优先级**
   - **优先**：运行时 `/config.json`（部署注入）
   - **降级**：构建时环境变量（`VITE_API_BASE_URL`、`VITE_MOCK`）
   - **兜底**：代码内默认值

2. **运行时配置格式**
   - 必填字段：`apiBaseUrl`、`mockEnabled`
   - 建议字段：`environment`（`development`/`staging`/`production`）

3. **生产环境约束**
   - `mockEnabled` 必须为 `false`
   - `VITE_MOCK` 必须为 `false` 或未设置
   - `VITE_SKIP_INIT` 必须为 `false` 或未设置

4. **开发环境覆盖规则**
   - 开发环境下若显式设置 `VITE_MOCK`（`true`/`false`），将覆盖 `config.json` 的 `mockEnabled`，避免本地配置错配

5. **文件管理**
   - `public/config.json` 被 gitignore，**必须在部署时注入**
   - 若未注入，将回退到构建时环境变量

## 示例
### 运行时配置（推荐）
```json
{
  "apiBaseUrl": "https://api.example.com/api",
  "mockEnabled": false,
  "environment": "production"
}
```

### 构建时最小变量（无需运行时文件时）
```
VITE_API_BASE_URL=https://api.example.com/api
VITE_MOCK=false
VITE_SKIP_INIT=false
```
