# 包体大小规范（微信小程序）

## 规范背景

微信小程序对包体大小存在硬性限制；随着业务迭代，主包体积容易因依赖、图片与页面增长而失控，因此需要“可校验”的体积预算与 CI 阻断机制。

## 适用对象

- 平台：微信小程序（`mp-weixin`）
- 范围：`iPet-uniapp` 构建产物 `dist/build/mp-weixin`

## 约束规则

- **主包大小**：必须 `< 1.5MB`（不包含分包；不包含插件）
- **预警阈值**：`≥ 1.35MB`（90%）输出 warning，用于提前优化
- **校验口径**：
  - 以 `dist/build/mp-weixin/app.json` 的 `subPackages[].root` 为分包根目录；
  - 主包大小 = 构建产物中 **排除所有分包根目录** 后剩余文件的字节总和；
  - 插件不计入本仓构建产物口径（如后续引入需在校验脚本中显式排除对应目录）。
 - **资源归属建议**：仅在文章分包使用的封面图应放入分包目录，避免占用主包预算（本项目在 mp-weixin 构建后会将 `static/images/articles` 归并到 `pages/articles` 分包下）。

## 示例

- 本地检查：`npm run check:size:mp-weixin`
- CI 检查：GitHub Actions `Build & Size Check`
