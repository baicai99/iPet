# 文章源文件目录规范

## 规范背景
文章内容存在“源文件/构建产物”并存的情况，容易误改生成物。为降低混淆并统一管理，建立清晰的源文件目录与同步规则。

## 适用对象
- 文章内容维护者
- 文章封面图维护者
- 负责构建与发布的工程成员

## 约束规则
- **源文件唯一入口**：
  - Markdown 源文件：`iPet-uniapp/src/articles/source/md/`
  - 封面图片源文件：`iPet-uniapp/src/articles/source/images/`
- **构建产物不可手改**：
  - `iPet-uniapp/public/static/articles/articles-manifest.json`
  - `iPet-uniapp/public/static/articles/md/*.md`
  - `iPet-uniapp/src/modules/articles/domain/generated/builtinManifest.ts`
- **同步机制**：
  - `scripts/articles/build.mjs` 会在构建时将 `src/articles/source/images/` 同步到 `src/static/images/articles/`，供运行时与构建使用。
  - 构建时会将封面输出为 JPG，保证真机兼容性。
- **封面路径约束**：
  - frontmatter 的 `cover` 字段必须保持 `/static/images/articles/xxx.jpg` 形式。

## 示例

### 新增文章
```bash
touch iPet-uniapp/src/articles/source/md/new_article.md
cp ./cover.jpg iPet-uniapp/src/articles/source/images/
npm run articles:build
```

### 修改文章内容
```bash
vim iPet-uniapp/src/articles/source/md/weight.md
npm run articles:build
```
