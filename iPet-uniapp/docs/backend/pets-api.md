# Pet API 规范（创建）

## 规范背景
前端宠物建档场景会提交较完整的表单数据，但后端仅持久化与宠物实体相关的字段。
为避免参数校验导致的 400，本规范明确 `/pets` 创建接口允许的字段范围与忽略策略。

## 适用对象
- iPet-uniapp 前端调用 `/pets` 创建接口的场景
- iPet-BackEnd `/pets` POST 接口的参数校验与落库逻辑

## 约束规则
- 必填字段：`name`
- 可选且会持久化的字段：
  - `id`（可选，未提供时由服务端生成）
  - `type`, `breed`, `age`, `weight`, `gender`, `avatar`
  - `birthday`, `arrivalDate`
  - `personality`, `isSterilized`, `chipId`, `toys`, `allergens`, `vaccineDate`, `description`
- 可选但仅用于兼容的字段（服务端忽略，不持久化）：
  - `height`, `birthTimestamp`, `status`, `createdAt`, `updatedAt`

## 示例
```json
{
  "id": "pet-1735620000000",
  "name": "奶糖",
  "type": "cat",
  "breed": "英短",
  "gender": "female",
  "weight": 3.8,
  "birthday": "2024-05-20",
  "personality": ["粘人", "胆小"],
  "isSterilized": false,
  "chipId": "CN-0001",
  "vaccineDate": "2025-01-10",
  "description": "喜欢晒太阳"
}
```
