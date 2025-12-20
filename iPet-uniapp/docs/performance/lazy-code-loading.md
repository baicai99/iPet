# 组件按需注入（微信小程序）

## 规范背景

微信小程序启动过程中，除代码包下载外，“代码注入”也是主要耗时环节。开启「按需注入」可让小程序仅注入当前访问页面所需的页面代码与自定义组件，从而降低启动耗时与运行时内存占用。

## 适用对象

- 平台：微信小程序（`mp-weixin`）
- 范围：`iPet-uniapp` 构建产物 `dist/build/mp-weixin`

## 约束规则

- **必须开启按需注入**：`src/manifest.json` 中为 `mp-weixin` 配置 `lazyCodeLoading: "requiredComponents"`（基础库 `2.11.1+` 才有优化效果，建议调试/发布使用 `2.20.1+`）。
- **避免无效依赖声明**：开启后，`app.json` 的全局 `usingComponents` 与各页面 JSON 中声明的组件都会被视为依赖参与注入；应及时移除未使用组件声明，避免削弱优化收益。
- **限制说明**：插件包与扩展库目前不支持按需注入；如需“插件按需加载”，优先考虑放入分包并配合分包异步化。
- **变更后必须回归**：启用后未访问页面/未声明组件不会被加载执行，需检查页面渲染与交互是否正常。

## 示例

- 配置位置：`src/manifest.json`

```json
{
  "mp-weixin": {
    "lazyCodeLoading": "requiredComponents"
  }
}
```

- 构建校验：确认 `dist/build/mp-weixin/app.json` 含 `lazyCodeLoading` 字段。

