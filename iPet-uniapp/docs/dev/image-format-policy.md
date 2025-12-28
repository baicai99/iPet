# 图片格式规范（文章封面 & 头像）

## 规范背景
微信小程序真机对 WebP 的支持存在差异，导致包内 WebP 封面无法稳定展示。为降低兼容风险，统一改为 JPG 输出，并限制头像上传格式。

## 适用对象
- 文章内容与封面维护者
- 头像上传链路维护者
- 构建与发布维护者

## 约束规则
- **文章封面输出**：
  - frontmatter 的 `cover` 必须为 `/static/images/articles/*.jpg`。
  - 构建脚本会将 `src/articles/source/images/` 中的封面图片同步并输出为 JPG 到 `src/static/images/articles/`。
- **头像上传**：
  - 头像上传仅接受 JPG/JPEG。
  - 客户端需在上传前确保输出为 JPG，后端会拒绝非 JPG 的头像文件。

## 示例

### 文章封面
```md
cover: "/static/images/articles/weight-management.jpg"
```

### 头像上传
```text
允许: image/jpeg (.jpg/.jpeg)
拒绝: image/webp, image/png
```
