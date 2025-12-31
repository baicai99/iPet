# Backend UI - iPet 管理后台

iPet 项目的管理后台界面，基于 React + TypeScript + Vite + Ant Design 构建。

## 📋 目录

- [快速开始](#-快速开始)
- [项目结构](#-项目结构)
- [开发指南](#-开发指南)
- [构建部署](#️-构建部署)
- [测试](#-测试)
- [规范约定](#-规范约定)

---

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 默认登录凭据

- 邮箱: `admin@example.com`
- 密码: `password`

> **Note**: 开发环境使用 MSW (Mock Service Worker) 提供 mock 数据

---

## 📁 项目结构

```
backend-ui/
├── src/
│   ├── api/              # API 层
│   │   ├── contracts/    # API 契约
│   │   ├── schemas/      # Zod 运行时校验
│   │   ├── interceptors.ts
│   │   └── queryKeys.ts
│   ├── core/             # 核心模块
│   │   ├── auth/         # 认证
│   │   ├── config/       # 配置
│   │   ├── charts/       # ECharts 配置
│   │   └── errors/       # 错误处理
│   ├── features/         # 功能模块
│   │   ├── articles/     # 文章管理
│   │   ├── auth/         # 登录页面
│   │   ├── dashboard/    # 仪表盘
│   │   └── users/        # 用户管理
│   ├── shared/           # 共享资源
│   │   ├── components/   # 通用组件
│   │   ├── hooks/        # 通用 hooks
│   │   └── utils/        # 工具函数
│   ├── router/           # 路由配置
│   ├── test/             # 测试工具
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── mockServiceWorker.js  # MSW worker
├── docs/                 # 文档
│   ├── directory-structure.md  # 目录结构规范
│   └── components.md           # 组件文档
├── scripts/              # 脚本工具
│   ├── create-feature.js       # Feature 生成器
│   └── generate-build-meta.js  # 构建元信息
├── vitest.config.ts      # Vitest 配置
```

详见 [目录结构规范](./docs/directory-structure.md)

---

## 💻 开发指南

### 环境配置

项目使用**环境变量**进行配置，统一使用 `.env` 作为配置入口。

#### 配置文件

| 文件 | 用途 | 何时使用 |
|------|------|---------|
| `.env` | 通用环境配置 | `npm run dev` / `npm run build` |

> `.env` 默认在 `.gitignore` 中，如需提交请手动跟踪

#### 开发环境

**快速开始**：
```bash
# 启动开发服务器（自动使用 .env）
npm run dev
```

**配置说明**：

`.env` 文件内容：
```bash
# 通用环境配置
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MOCK=true
VITE_SKIP_INIT=true
```

**配置项说明**：
- `VITE_API_BASE_URL` - API 基础地址
- `VITE_MOCK` - 是否启用 MSW Mock（`true`/`false`）
- `VITE_SKIP_INIT` - 是否跳过初始化向导

**切换本地/线上 API**：
```bash
# 修改 .env
cat > .env << EOF
VITE_API_BASE_URL=https://api.zhengjiyuan.top/api
VITE_MOCK=false
VITE_SKIP_INIT=true
EOF

# 重启 dev 服务器
npm run dev
```

#### 生产环境

**构建**：
```bash
# 使用 .env 配置进行构建
npm run build
```

**配置说明**：

`.env` 文件内容：
```bash
# 通用环境配置（npm run dev / build 使用）
VITE_API_BASE_URL=https://api.zhengjiyuan.top/api
VITE_MOCK=false
VITE_SKIP_INIT=false
```

**切换 API 地址**：
```bash
# 修改 .env
echo "VITE_API_BASE_URL=https://test-api.example.com" > .env
echo "VITE_MOCK=false" >> .env

# 重新构建
npm run build
```

> **重要**：生产环境必须设置 `VITE_MOCK=false`

#### Preview 模式

```bash
npm run preview
```

预览服务器使用构建时的配置（来自 `.env`）。

### Mock 数据

开发环境使用 MSW (Mock Service Worker)：

**启用 Mock**：
```bash
# .env
VITE_MOCK=true
```

**禁用 Mock**（测试真实后端）：
```bash
# .env
VITE_MOCK=false
VITE_API_BASE_URL=https://api.zhengjiyuan.top/api
```


### 新建 Feature

使用脚手架快速创建：

```bash
npm run create-feature pets
```

自动生成标准目录结构：
```
src/features/pets/
├── pages/
│   └── PetsListPage.tsx
├── components/
├── hooks/
└── index.ts
```

### 代码规范

- **Lint**: `npm run lint`
- **Type Check**: `npm run typecheck`
- **Format**: 使用 ESLint + TypeScript

---

## 🏗️ 构建部署

### 构建

```bash
# 类型检查 + 构建
npm run build
```

构建产物位于 `dist/` 目录，包含：
- 静态资源
- `build-meta.json` - 构建元信息（commit、版本、时间）

### 预览

```bash
npm run preview
```

### 生产部署

1. **构建**:
   ```bash
   npm run build
   ```

2. **部署到静态服务器**:
   - 上传 `dist/` 目录
   - 配置 `config.json`（可选，运行时覆盖构建变量）

3. **Runtime Config 示例**:
   ```json
   // public/config.json
   {
     "apiBaseUrl": "https://api.example.com",
     "mockEnabled": false,
     "environment": "production"
   }
   ```

### 构建追溯

每次构建会生成 `dist/build-meta.json`：

```json
{
  "version": "0.0.0",
  "buildTime": "2025-12-29T04:00:00.000Z",
  "git": {
    "commit": "abc1234",
    "branch": "main",
    "author": "Developer"
  }
}
```

线上访问 `/build-meta.json` 可查看当前部署的构建信息。

---

## 🧪 测试

### 单元测试

```bash
# 运行测试
npm run test:unit

# UI 模式
npm run test:ui

# 覆盖率
npm run test:coverage
```

---

## 📖 规范约定

### 命名规范

- **组件**: PascalCase `UserCard.tsx`
- **Hooks**: camelCase `useUserData.ts`
- **工具函数**: camelCase `formatDate.ts`
- **常量**: UPPER_SNAKE_CASE `API_BASE_URL`

### 导入顺序

```typescript
// 1. React
import React from 'react';

// 2. 第三方库
import { useQuery } from '@tanstack/react-query';
import { Button } from 'antd';

// 3. 项目内部 (@/)
import { DataTable } from '@/shared/components';
import { useAuth } from '@/core/auth';

// 4. 相对路径
import { UserCard } from './UserCard';
import type { User } from './types';
```

### Commit 规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```bash
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具链
perf: 性能优化
```

### Features vs Shared

**放在 Features 的**:
- 业务组件（如 `UserCard`）
- Feature 特定 hooks（如 `useUserData`）
- 业务逻辑

**放在 Shared 的**:
- 通用 UI 组件（如 `DataTable`）
- 通用 hooks（如 `useDebouncedValue`）
- 工具函数（如 `formatDate`）

详见 [目录结构规范](./docs/directory-structure.md)

---

## 🔧 故障排查

### 构建失败

```bash
# 清理依赖
rm -rf node_modules package-lock.json
npm install

# 清理缓存
npm run build -- --force
```

### Mock 不生效

1. 检查 `public/mockServiceWorker.js` 是否存在
2. 确认 `.env` 中 `VITE_MOCK=true`
3. 查看浏览器 Console 确认 MSW 启动

### API 报错

1. 查看 `/build-meta.json` 确认构建版本
2. 查看 Chrome DevTools → Network 确认请求
3. 查看错误日志中的 `requestId` 进行追踪

### TypeScript 错误

```bash
# 重新生成类型
npm run typecheck
```

---

## 📝 文档链接

- [目录结构规范](./docs/directory-structure.md)
- [组件使用文档](./docs/components.md)
- [API 文档](./docs/api.md)
- [CHANGELOG](./CHANGELOG.md)

---

## 🎯 性能优化

项目已实施多项性能优化：

- ✅ **Dashboard 并行请求** - useQueries 并行加载
- ✅ **搜索防抖** - 减少 API 请求
- ✅ **ECharts优化** - memo 化、稳定 option 引用
- ✅ **DataTable 虚拟滚动** - 智能阈值、自适应高度
- ✅ **API 响应校验** - Zod 运行时类型检查

---

## 📄 License

MIT

---

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

**预计新人上手时间**: 30 分钟 ✅
