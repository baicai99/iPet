# 文章源文件目录规范

## 规范背景
文章内容已由后端服务统一托管，iPet-uniapp 不再打包本地文章与封面。为保留可追溯的素材来源，文章 Markdown 与封面图仅作为上传源文件保存在仓库根目录。

## 适用对象
- 文章内容维护者
- 文章封面图维护者
- 负责构建与发布的工程成员

## 约束规则
- **源文件唯一入口**：
  - Markdown 源文件：`articles-source/md/`
  - 封面图片源文件：`articles-source/images/`
- **前端不再产出文章构建物**：
  - `public/static/articles/*` 与 `builtinManifest` 不再作为运行时数据源
- **上传规则**：
  - 封面 URL 由后端生成，前端仅使用后端返回的地址

## 示例

### 新增文章
```bash
touch articles-source/md/new_article.md
cp ./cover.jpg articles-source/images/
```

### 修改文章内容
```bash
vim articles-source/md/weight.md
```
