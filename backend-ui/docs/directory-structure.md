# 项目目录结构规范

## Features 模块结构

每个 feature 遵循以下标准结构：

```
src/features/{feature-name}/
├── pages/              # 页面组件
│   ├── {Feature}ListPage.tsx
│   ├── {Feature}DetailPage.tsx
│   └── {Feature}EditPage.tsx
├── components/         # 功能内部组件
│   ├── {Feature}Form.tsx
│   ├── {Feature}Card.tsx
│   └── {Feature}Filter.tsx
├── hooks/              # 功能特定 hooks
│   ├── use{Feature}Data.ts
│   └── use{Feature}Actions.ts
├── types/              # 类型定义（可选）
│   └── index.ts
└── index.ts            # 统一导出
```

### 命名规范

- **Pages**: `{Feature}ListPage.tsx`, `{Feature}DetailPage.tsx`, `{Feature}EditPage.tsx`
- **Components**: `{Feature}{ComponentType}.tsx`
- **Hooks**: `use{Feature}{Action}.ts`
- **Types**: `index.ts`（在 types 目录下）

### 示例：Articles Feature

```
src/features/articles/
├── pages/
│   ├── ArticleListPage.tsx      # 文章列表页
│   ├── ArticleDetailPage.tsx    # 文章详情页
│   └── ArticleEditPage.tsx      # 文章编辑页
├── components/
│   ├── ArticleForm.tsx          # 文章表单
│   ├── ArticleCard.tsx          # 文章卡片
│   └── ArticleFilter.tsx        # 筛选器
├── hooks/
│   └── useArticleActions.ts     # 文章操作逻辑
└── index.ts
```

**index.ts 导出示例**:
```typescript
/**
 * Articles Feature
 */

// Pages
export { default as ArticleListPage } from './pages/ArticleListPage';
export { default as ArticleDetailPage } from './pages/ArticleDetailPage';

// Components (按需导出)
export { ArticleCard } from './components/ArticleCard';

// Hooks (按需导出)
export { useArticleActions } from './hooks/useArticleActions';
```

---

## Shared 边界定义

### ✅ 应该放在 shared 的

#### 1. 通用 UI 组件（无业务假设）

```typescript
// ✅ Good - 纯 UI 组件
shared/components/
├── DataTable/         # 通用数据表格
├── FilterBar/         # 通用筛选栏
├── StatCard/          # 通用统计卡片
├── ConfirmDialog/     # 通用确认对话框
├── Loading/           # 加载状态
├── ErrorState/        # 错误状态
└── EmptyState/        # 空状态
```

**特征**:
- 可在任何 feature 中使用
- 不包含特定业务逻辑
- Props 通用化，不绑定特定数据模型

**示例**:
```typescript
// ✅ Good - 通用组件
interface DataTableProps<T> {
  columns: ColumnType<T>[];
  dataSource: T[];
  loading?: boolean;
}

// ❌ Bad - 包含业务逻辑
interface UserTableProps {
  users: User[];
  onBanUser: (id: string) => void;  // 特定业务操作
}
```

---

#### 2. 通用 Hooks

```typescript
// ✅ Good - 通用逻辑
shared/hooks/
├── useDebouncedValue.ts    # 防抖
├── useContainerHeight.ts   # 容器高度计算
├── usePagination.ts        # 分页逻辑（通用）
└── useLocalStorage.ts      # localStorage 封装
```

**特征**:
- 无业务域依赖
- 可复用于多个 feature
- 不依赖特定 API 或数据模型

**示例**:
```typescript
// ✅ Good - 通用 hook
export function useDebouncedValue<T>(value: T, delay: number): T {
  // 纯逻辑，无业务依赖
}

// ❌ Bad - feature 特定
export function useUserData(userId: string) {
  // 依赖 User API，应该放在 features/users/hooks/
}
```

---

#### 3. 工具函数

```typescript
// ✅ Good - 纯函数
shared/utils/
├── format.ts      # 格式化（日期、数字等）
├── validation.ts  # 验证逻辑
├── date.ts        # 日期处理
└── string.ts      # 字符串工具
```

**特征**:
- 纯函数，无副作用
- 无业务规则绑定

---

### ❌ 不应该放在 shared 的

#### 1. 包含业务逻辑的组件

```typescript
// ❌ Bad - 业务组件
shared/components/UserCard.tsx

// ✅ Good - 放在对应 feature
features/users/components/UserCard.tsx
```

**判断标准**:
- 是否只在单个 feature 使用？→ 放 feature
- 是否包含特定业务规则？→ 放 feature
- 是否依赖特定数据模型？→ 放 feature

---

#### 2. Feature 特定的 Hooks

```typescript
// ❌ Bad
shared/hooks/useUserData.ts
shared/hooks/useArticleActions.ts

// ✅ Good
features/users/hooks/useUserData.ts
features/articles/hooks/useArticleActions.ts
```

---

#### 3. 业务工具函数

```typescript
// ❌ Bad - 包含业务规则
shared/utils/calculateUserLevel.ts

// ✅ Good
features/users/utils/calculateLevel.ts
```

---

## 检查清单

### 新建 Feature 时

- [ ] 是否创建了 `pages/` 目录？
- [ ] 是否创建了 `components/` 目录？
- [ ] 是否创建了 `hooks/` 目录（如需要）？
- [ ] 是否创建了 `index.ts` 导出文件？
- [ ] 组件命名是否符合规范？
- [ ] 已在路由中注册页面？

### 添加 Shared 组件时

- [ ] 该组件是否真的通用？
- [ ] 是否不包含业务假设？
- [ ] Props 是否足够抽象？
- [ ] 是否有至少 2 个 feature 会使用？

---

## 迁移指南

### 从旧结构迁移

**Before**:
```
src/components/
├── UserList.tsx       # 应该是 page
├── UserCard.tsx       # 业务组件
└── Button.tsx         # 通用组件
```

**After**:
```
src/features/users/
├── pages/
│   └── UserListPage.tsx
└── components/
    └── UserCard.tsx

src/shared/components/
└── Button/            # 仅保留真正通用的
```

---

## 常见问题

### Q: 如何判断组件是否应该放 shared？

**A**: 问 3 个问题：
1. 是否有 >=2 个 feature 会用？
2. 是否与特定业务无关？
3. Props 是否足够抽象？

全部 Yes → shared  
任一 No → feature

---

### Q: 同时用于多个 feature 的业务组件怎么办？

**A**: 考虑：
1. **抽取通用部分到 shared**，业务部分留在 feature
2. **创建复合组件**，shared 提供基础，feature 提供业务层

**示例**:
```typescript
// shared/components/Card/
export function Card({ title, content, actions }) {
  // 通用卡片 UI
}

// features/users/components/UserCard.tsx
export function UserCard({ user }) {
  return (
    <Card
      title={user.name}
      content={<UserInfo user={user} />}
      actions={<UserActions user={user} />}
    />
  );
}
```

---

### Q: 类型定义放哪里？

**A**: 
- **API 类型** → `src/api/types.ts`
- **Feature 特定** → `src/features/{name}/types/`
- **Shared 组件 Props** → 与组件同文件

---

## 参考链接

- [React 项目结构最佳实践](https://react.dev/learn/thinking-in-react)
- [Feature-Sliced Design](https://feature-sliced.design/)
