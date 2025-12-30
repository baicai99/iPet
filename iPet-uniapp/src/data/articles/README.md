# 文章系统维护指南

> ⚠️ 2025-12-30 起，iPet-uniapp 不再使用本地文章数据与封面，统一从后端服务 `/api/articles` 获取。文章 Markdown 与封面图仅作为上传素材保存在仓库根目录 `articles-source/`。

**版本**: 3.0  
**最后更新**: 2025-12-30

---

## 📖 系统架构概览

### 核心设计原则

- **后端唯一事实源**：文章列表与详情完全由后端服务提供
- **前端不打包文章**：文章与封面不再随客户端构建产出
- **源文件仅用于上传**：Markdown 与封面图仅作为素材备份

### 数据流

```
articles-source/md + articles-source/images
  ↓
手动上传到后端（后台管理/接口）
  ↓
App 运行时从 /api/articles 获取
```

---

## ✏️ 如何新增文章

### Step 1: 准备 Markdown 源文件

在项目根目录 `articles-source/md/` 下创建 `.md` 文件，文件名建议使用文章ID（snake_case）。

**示例**: `new_article.md`

```markdown
---
id: new_article
title: 文章标题（5-50字）
summary: 文章摘要（10-100字）
cover: https://your-backend-domain/uploads/articles/filename.jpg
category: education
author: iPet 健康团队
tags:
  - tag1
  - tag2
  - tag3
updateTime: 2025-12-30
---

# 文章标题

正文内容（Markdown 格式）...
```

### Step 2: 准备封面图

- 放置到 `articles-source/images/` 目录
- 推荐尺寸: 1200x630px
- 格式: JPG（优先）/ PNG / WebP
- 文件大小: < 100KB

### Step 3: 上传到后端

- 使用后台管理或 API 上传封面与文章内容
- 由后端生成可访问的 cover URL 与文章内容

---

## ✅ 常见问题

### Q: App 文章列表为空？
1. 确认后端 `/api/articles` 已有数据
2. 确认 `API_BASE_URL` 指向后端
3. 确认后端返回的 `cover` 可访问

### Q: 封面图无法显示？
1. 确认 `cover` 为完整 URL 或以 `/uploads` 开头
2. 确认后端静态资源可访问
