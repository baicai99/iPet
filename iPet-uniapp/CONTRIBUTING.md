# 贡献指南 (Contributing Guide)

欢迎来到 **iPet-uniapp** 项目！🎉

我们非常感谢您对宠物健康管理应用的关注和贡献。iPet 致力于通过技术改善毛孩子的生活质量。在您开始编写代码之前，请花几分钟仔细阅读以下指南，这将帮助我们共同维护一个高质量、高可维护性的代码库。

## 目录 (Table of Contents)

1.  [🛠 技术栈 (Tech Stack)](https://www.google.com/search?q=%23-%E6%8A%80%E6%9C%AF%E6%A0%88-tech-stack)
2.  [🚀 快速开始 (Getting Started)](https://www.google.com/search?q=%23-%E5%BF%AB%E9%80%9F%E5%BC%80%E5%A7%8B-getting-started)
3.  [📂 项目结构 (Project Structure)](https://www.google.com/search?q=%23-%E9%A1%B9%E7%9B%AE%E7%BB%93%E6%9E%84-project-structure)
4.  [💻 开发规范 (Development Guidelines)](https://www.google.com/search?q=%23-%E5%BC%80%E5%8F%91%E8%A7%84%E8%8C%83-development-guidelines)
      * [代码风格与质量](https://www.google.com/search?q=%2341-%E4%BB%A3%E7%A0%81%E9%A3%8E%E6%A0%BC%E4%B8%8E%E8%B4%A8%E9%87%8F-code-quality)
      * [数据流规范 (Service & Store)](https://www.google.com/search?q=%2342-%E6%95%B0%E6%8D%AE%E6%B5%81%E8%A7%84%E8%8C%83-data-flow)
      * [🎨 UI/UX 设计规范 (核心)](https://www.google.com/search?q=%2343-uiux-%E8%AE%BE%E8%AE%A1%E8%A7%84%E8%8C%83-uiux-design-specifications)
5.  [🌊 工作流 (Workflow)](https://www.google.com/search?q=%23-%E5%B7%A5%E4%BD%9C%E6%B5%81-workflow)
6.  [🤝 提交 Pull Request](https://www.google.com/search?q=%23-%E6%8F%90%E4%BA%A4-pull-request-pr)
7.  [🐛 问题反馈](https://www.google.com/search?q=%23-%E9%97%AE%E9%A2%98%E5%8F%8D%E9%A6%88)

-----

## 🛠 技术栈 (Tech Stack)

本项目基于以下核心技术构建：

  * **框架**: [uni-app](https://uniapp.dcloud.net.cn/) (Vue 3 + Vite 版本)
  * **语言**: JavaScript / TypeScript (推荐新功能使用 TS)
  * **状态管理**: [Pinia](https://pinia.vuejs.org/) + `pinia-plugin-persistedstate`
  * **UI 组件库**: [uView Plus](https://www.google.com/search?q=https://uiadmin.net/uview-plus)
  * **CSS 预处理**: SCSS
  * **开发工具推荐**: HBuilderX (最佳兼容性) 或 VS Code (需配置插件)

-----

## 🚀 快速开始 (Getting Started)

### 1\. 环境准备

确保您的开发环境中已安装 Node.js (推荐 v16+)。

### 2\. 安装依赖

```bash
npm install
# 或者
yarn install
```

### 3\. 运行开发环境

  * **HBuilderX**: 打开项目 -\> 点击顶部菜单栏 "运行" -\> "运行到小程序模拟器" -\> "微信开发者工具"。
  * **VS Code**:
    ```bash
    npm run dev:mp-weixin
    ```

-----

## 📂 项目结构 (Project Structure)

为了保持代码整洁，请严格遵循以下目录结构：

```text
.
├── mock/                # Mock 数据与 Handlers (Vite Mock 插件)
├── src/
│   ├── components/      # 公共组件目录 (遵循零外边距原则)
│   │   ├── business/    # 业务组件 (按模块划分, 如 family, health)
│   │   ├── profile/     # 个人中心组件
│   │   └── widgets/     # 独立小部件 (如 Sparkline, Charts)
│   ├── config/          # 全局配置
│   │   ├── constants.js # 常量 (VIP等级, 宠物枚举等)
│   │   ├── theme.js     # 业务主题色配置
│   │   └── menu.js      # 菜单配置
│   ├── data/            # 静态数据源
│   │   ├── metricMetadata.js # 指标元数据定义
│   │   └── categoryConfig.js # 分类配置
│   ├── pages/           # 页面视图 (按业务模块分包)
│   ├── services/        # ✨ 业务逻辑服务层 (解耦 Store 和 API/Mock)
│   ├── static/          # 静态资源 (图片、Tab图标)
│   ├── stores/          # Pinia 状态仓库
│   ├── uni_modules/     # 插件市场模块 (如 uView Plus)
│   ├── utils/           # 工具函数 (request.ts, formatHelper.js)
│   └── uni.scss         # 全局样式变量与 Mixins
└── ../shared            # (Alias: @shared) 前后端共享类型定义与工具
```

-----

## 💻 开发规范 (Development Guidelines)

### 4.1 代码风格与质量 (Code Quality)

  * **Vue 语法**: 统一使用 Vue 3 `<script setup>` 语法糖。
  * **样式隔离**: 组件样式必须使用 `<style lang="scss" scoped>`。
  * **国际化**: 避免在组件中硬编码中文文案，建议使用 `src/locale/zh-Hans.js` 中的常量（如 `STRINGS.MY.LOGOUT`）。

### 4.2 数据流规范 (Data Flow)

为了保证逻辑清晰，禁止在组件内部直接请求后端接口或直接引用 Mock 文件。

  * **推荐流程**: `Component` -\> `Store (Action)` -\> `Service` -\> `Mock Data / API`
  * **Service 层**: 请在 `src/services/` 下封装数据获取逻辑（参考 `healthSummaryService.js`）。这允许我们在未来从 Mock 数据无缝切换到真实 API，而无需修改组件代码。
  * **Mock 数据**: 新增接口请在 `mock/` 目录下添加对应的 handler (遵循 vite-plugin-mock 规范)。

-----

### 4.3 🎨 UI/UX 设计规范 (UI/UX Design Specifications)

本项目遵循 **Apple Human Interface Guidelines (HIG)** 风格，追求精致、统一、层级分明的视觉体验。请务必复用 `src/uni.scss` 中定义的变量和 Mixin。

#### 1\. 字体与排版 (Typography)

以 iPhone 14 Pro (393pt) 为基准，**严禁随意创造字号**。请严格复用以下 Mixin：

| 样式名称 | 用途 (Usage) | rpx | Mixin (在 uni.scss 中) |
| :--- | :--- | :--- | :--- |
| **Large Title** | 页面大标题/核心数字 | **56rpx** | `@include text-large-title;` |
| **Title 2** | 区块标题 | **36rpx** | `@include text-title-2;` |
| **Headline** | 卡片标题/重要信息 | **28rpx** | `@include text-headline;` |
| **Body** | 正文内容 | **28rpx** | `@include text-body;` |
| **Subhead** | 副标题/次要信息 | **24rpx** | `@include text-subhead;` |
| **Caption 1** | 辅助说明/标签 | **20rpx** | `@include text-caption-1;` |

#### 2\. 色彩系统 (Color System)

请使用 **语义化颜色变量**，禁止硬编码 Hex 值（如 `#007AFF`）。

  * **主色调**: `$uni-color-primary` (蓝色), `$uni-color-primary-orange` (橙色品牌色)
  * **文本色**: `$uni-text-color` (主要), `$uni-text-color-grey` (次要)
  * **背景色**: `$uni-bg-color-grey` (`#F2F2F6` 页面底色), `$uni-bg-color` (白色卡片)

#### 3\. 布局与结构 (Layout & Structure)

  * **📏 单位规范**: 全局强制使用 `rpx`。
  * **🧩 布局方法**: 优先使用 `src/uni.scss` 中的 Flexbox Mixins：
      * `@include flex-center;` (水平垂直居中)
      * `@include flex-between;` (两端对齐)
      * `@include flex-col;` (垂直排列)

#### 4\. 组件设计规范 (Component Design)

  * **📦 零外边距原则 (No Outer Margin)**:
      * **组件必须是“样式封闭”的**。公共组件（components 目录下）**严禁包含 `margin`**。

      * **布局权上移**: 组件之间的间距，必须由**父容器**通过 `gap` (推荐)、`padding` 或父级的布局属性来控制。

      * **Bad**:

        ```scss
        /* MyCard.vue */
        .card { margin-bottom: 24rpx; } /* ❌ 错误：限制了复用性 */
        ```

      * **Good**:

        ```scss
        /* ParentPage.vue */
        .card-list {
            display: flex;
            flex-direction: column;
            gap: 24rpx; /* ✅ 正确：由父级决定间距 */
        }
        ```

#### 5\. 视觉细节

  * **圆角**: 卡片统一使用 **24rpx - 32rpx**。
  * **阴影**: 使用 `@include card-shadow;`。

-----

## 🌊 工作流 (Workflow)

### 1\. 分支管理

  * `main`: 主分支，保持随时可发布状态。
  * `feature/xxx`: 新功能分支 (例如 `feature/vaccine-reminder`).
  * `fix/xxx`: Bug 修复分支.

### 2\. 提交规范 (Commit Convention)

请遵循 Conventional Commits 规范：

  * `feat`: 新增功能
  * `fix`: 修复 Bug
  * `docs`: 文档变更
  * `style`: 格式调整（不影响逻辑）
  * `refactor`: 代码重构
  * `chore`: 构建工具或依赖变动

**示例**: `feat: add trend analysis chart component`

-----

## 🤝 提交 Pull Request (PR)

1.  Fork 本仓库到您的 GitHub/Gitee 账户。
2.  创建特性分支 (`git checkout -b feature/AmazingFeature`)。
3.  提交改动。
4.  推送到远程分支。
5.  发起 Pull Request，请使用以下模板：

> **PR 模板**:
>
>   * **关联 Issue**: \#123
>   * **变更类型**: ✨ 新功能 / 🐛 修复
>   * **测试截图**: (UI 变更必须附带截图或 GIF)
>   * **自测清单**:
>       - [ ] 微信小程序模拟器测试通过
>       - [ ] 样式符合 UI 规范 (特别是 rpx 和 字体 Mixin)

-----

## 🐛 问题反馈

如果您发现了 Bug 或有新功能建议，请提交 Issue。请详细描述问题的复现步骤或功能的具体需求。

感谢您的贡献，让我们一起让毛孩子的生活更健康！🐶🐱