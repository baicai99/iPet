# 文章系统维护指南

> ⚠️ 2025-12-14 起，文章内容的唯一事实源位于 `src/articles/source/md/`，封面图片源位于 `src/articles/source/images/`，脚本迁移至 `scripts/articles/*.mjs`，产物为 `public/static/articles/articles-manifest.json` 与 `public/static/articles/md/{id}.md`。本页保留旧版背景，具体操作请以新版 Markdown + Manifest 链路为准。

**版本**: 2.0  
**最后更新**: 2025-12-14

---

## 📖 系统架构概览

### 核心设计原则

- **单一事实源**: Markdown frontmatter 是文章元数据的唯一来源
- **双来源策略**: 本地打包（基础内容） + 远程CDN（热点内容）
- **自动化构建**: 所有产物自动生成，禁止手动编辑
- **Schema 强校验**: 构建时强制校验，杜绝运行时错误

### 数据流

```
Markdown 源文件 (frontmatter + content)
  ↓
scripts/articles/build.mjs 解析 + 校验
  ↓
生成产物:
  ├── public/static/articles/articles-manifest.json
  ├── public/static/articles/md/{id}.md
  └── src/modules/articles/domain/generated/builtinManifest.ts
```

---

## ✏️ 如何新增文章

### Step 1: 创建 Markdown 文件

在 `src/articles/source/md/` 目录下创建 `.md` 文件，文件名建议使用文章ID（snake_case）。

**示例**: `new_article.md`

```markdown
---
id: new_article
title: 文章标题（5-50字）
summary: 文章摘要（10-100字）
cover: /static/images/articles/filename.jpg
category: education
author: iPet 健康团队
tags:
  - tag1
  - tag2
  - tag3
updateTime: 2025-12-14
metricKey: related_metric  # 可选，关联健康指标
source: local  # local 或 remote
---

# 文章标题

正文内容（Markdown 格式）...
```

### Step 2: 准备封面图

- 放置到 `src/articles/source/images/` 目录（构建时会同步到 `src/static/images/articles/` 供运行时使用）
- 推荐尺寸: 1200x630px
- 格式: PNG / JPG / WebP
- 文件大小:  < 100KB（使用 `npm run optimize:images` 压缩）

### Step 3: 构建并验证

```bash
# 构建文章
npm run articles:build

# 运行测试
npm run articles:test
```

### Step 4: 提交代码

```bash
git add src/articles/source/md/new_article.md
git add src/articles/source/images/cover.png
git add public/static/articles/articles-manifest.json
git add public/static/articles/md/new_article.md
git add src/modules/articles/domain/generated/builtinManifest.ts
git commit -m "docs: add new article about ..."
```

---

## 🔄 如何修改现有文章

### 修改元数据

直接编辑 `.md` 文件的 frontmatter 部分：

```markdown
---
updateTime: 2025-12-15  # 更新日期
summary: 新的摘要内容...
---
```

### 修改正文

编辑 frontmatter 下方的 Markdown 内容。

### 重新构建

```bash
npm run articles:build
npm run articles:test
```

---

## 🧪 测试指南

### 自动化测试

```bash
npm run articles:test
```

**测试覆盖**:
- ✅ Frontmatter 完整性（必填字段检查）
- ✅ Schema 校验（格式正确性）
- ✅ 构建产物验证（JSON/TS 文件）
- ✅ 数据一致性（MD vs JSON）
- ✅ 关键字段格式（日期、路径、标签等）

### 手动验证

1. **本地预览**:
   ```bash
   npm run dev:h5
   ```
   访问文章列表和详情页

2. **检查生成文件**:
   - `public/static/articles/articles-manifest.json`
   - `public/static/articles/md/{id}.md`
   - `src/modules/articles/domain/generated/builtinManifest.ts`

---

## 📝 Frontmatter 字段说明

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| `id` | string | ✅ | 唯一标识（小写+下划线） | `dog_weight` |
| `title` | string | ✅ | 文章标题（5-50字） | `狗狗体重管理指南` |
| `summary` | string | ✅ | 摘要（10-100字） | `了解如何科学管理...` |
| `cover` | string | ✅ | 封面图路径 | `/static/images/articles/cover.jpg` |
| `category` | enum | ✅ | 分类：`education`/`news`/`debunk` | `education` |
| `author` | string | ✅ | 作者名称 | `iPet 健康团队` |
| `tags` | array | ✅ | 标签数组（至少1个） | `[weight, health]` |
| `updateTime` | string | ✅ | 更新日期（YYYY-MM-DD） | `2025-12-14` |
| `source` | enum | ✅ | 来源：`builtin`/`remote`（兼容写 `local`） | `builtin` |
| `metricKey` | string | ❌ | 关联健康指标 | `weight` |
| `readingTime` | number | 🤖 | 阅读时长（自动计算） | `5` |

**图例**:
- ✅ 必填字段
- ❌ 可选字段
- 🤖 自动生成（勿手动填写）

---

## 🚀 构建脚本说明

### `scripts/articles/build.mjs`

**功能**:
- 解析所有 `.md` 文件的 frontmatter
- Schema 校验
- 分离本地/远程文章
- 自动计算阅读时长（200字/分钟）
- 生成 JSON 和 TS 文件

**运行**:
```bash
npm run articles:build
# 或
node scripts/scripts/articles/build.mjs
```

### `migrate-frontmatter.js`

**功能**: 批量为旧文章添加 frontmatter（一次性工具）

**运行**:
```bash
node scripts/migrate-frontmatter.js
```

### `test-articles.js`

**功能**: 自动化测试套件

**运行**:
```bash
npm run articles:test
# 或
node scripts/test-articles.js
```

---

## 🛠️ 常见问题

### Q: 构建失败，提示 Schema 校验错误？

**A**: 检查 frontmatter 字段：
```bash
# 常见错误
- updateTime 格式错误（必须是 YYYY-MM-DD）
- cover 路径不正确（必须以 /static/images/articles/ 开头，且必须是 .jpg）
- tags 为空数组
- category 不是 education/news/debunk 之一
```

### Q: 文章内容没有显示？

**A**: 确认两点：
1. 运行了 `npm run articles:build`
2. `public/static/articles/articles-manifest.json` 与 `src/modules/articles/domain/generated/builtinManifest.ts` 均已更新

### Q: 如何删除文章？

**A**: 
1. 删除 `src/articles/source/md/文章.md`
2. 删除对应封面图
3. 运行 `npm run articles:build`
4. 提交变更

### Q: 本地/远程文章如何选择？

**A**:
- **local**: 基础常识性内容，很少更新（如体重管理、营养知识）
- **remote**: 时效性、季节性内容，需要频繁更新（如高温预警、疫情通知）

---

## 📦 npm 脚本速查

```json
{
  "articles:build": "构建所有文章",
  "articles:test": "运行自动化测试",
  "articles:report": "生成统计报告（未实现）"
}
```

---

## 🔗 相关文档

- [实施计划](./implementation_plan.md)
- [架构诊断报告](./article-architecture-diagnosis.md)
- [Schema 定义](../src/data/articles/article-schema.json)

---

## 📞 支持

遇到问题？
1. 查看本文档「常见问题」章节
2. 运行 `npm run articles:test` 查看具体错误
3. 联系技术团队

---

**维护者**: 前端团队  
**最后审核**: 2025-12-14
