---
title: 前后端类型与校验归属规范
status: active
---

# 前后端类型与校验归属规范

## 规范背景

为降低跨仓共享导致的耦合与漂移风险，前后端不再通过根目录 `shared/` 共享类型或校验规则，改为在各自项目内落档维护并通过文档交叉校验保持一致。

## 适用对象

- iPet-uniapp 前端开发与维护人员
- iPet-BackEnd 后端开发与维护人员
- 文档维护与规范制定人员

## 约束规则

1. **禁止跨项目引用**：前端与后端不得直接引用根目录 `shared/` 目录内容。
2. **本地落档维护**：
   - 前端类型与校验规则放在 `iPet-uniapp/src/types` 与 `iPet-uniapp/src/validation`。
   - 后端类型与校验规则放在 `iPet-BackEnd/src-backend/types` 与 `iPet-BackEnd/src-backend/validation`。
3. **同步与校验**：涉及接口字段或校验规则的变更必须同步更新前后端本地类型与文档。
4. **纠错优先**：发现 Docs 与实际行为不一致时，优先修正文档并记录 Changelog。

## 示例

```typescript
// 前端：引用本地类型
import type { HealthRecord } from '@/types/health'

// 后端：引用本地校验规则
import { PASSWORD_REGEX } from '../validation/rules'
```

## 生效背景

本规范由“前后端不再使用 shared 文件夹共享内容”的变更触发，自 2025-12-31 起生效。
