# API Reference

> **文档版本**: v1.0.0  
> **最后更新**: 2025-12-19  
> **维护者**: iPet 前端团队  
> **文档状态**: 📋 待后端确认

> [!IMPORTANT]
> **TODO: 迁移到 OpenAPI**  
> 本文档为临时方案，基于前端代码推断。计划在后续版本中迁移到 OpenAPI/Swagger 规范，以实现：
> - 自动化文档生成
> - Mock Server 自动生成
> - 类型安全的 API Client 生成
> - 接口变更检测

---

## 相关文档

- [接口契约层](file:///Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/docs/接口契约层.md) - 通用规范、错误码、鉴权机制
- [数据层](file:///Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/docs/数据层.md) - 数据模型、缓存策略

---

## 一、认证相关接口 (Auth)

### 1.1 用户注册

```http
POST /users/register
Content-Type: application/json
```

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | ✅ | 邮箱地址，需符合邮箱格式 |
| `password` | string | ✅ | 密码，最少 6 位 |

**请求示例**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**成功响应**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "accessToken": "eyJhbGc...",
    "expiresIn": 3600,
    "refreshToken": "eyJhbGc...",
    "refreshExpiresIn": 2592000,
    "user": {
      "id": 12345,
      "email": "user@example.com",
      "createdAt": "2025-12-19T03:00:00.000Z"
    }
  }
}
```

**错误响应**

| 错误码 | 说明 | 处理建议 |
|--------|------|---------|
| `409` | 用户已存在 | 提示用户登录或找回密码 |
| `400` | 参数格式错误 | 检查邮箱格式和密码长度 |

---

### 1.2 用户登录

```http
POST /auth/login
Content-Type: application/json
```

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | ✅ | 邮箱地址 |
| `password` | string | ✅ | 密码 |

**请求示例**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**成功响应**

```json
{
  "accessToken": "mock-access-token-1734567890",
  "expiresIn": 3600,
  "refreshToken": "mock-refresh-token-1734567890",
  "refreshExpiresIn": 86400,
  "user": {
    "id": 12345,
    "email": "user@example.com",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**错误响应**

| 业务码 | 说明 | 处理建议 |
|--------|------|---------|
| `20004` | 邮箱或密码错误 | 提示用户检查凭据 |
| `20006` | 账号已被禁用 | 引导用户联系客服 |

---

### 1.3 游客登录

```http
POST /auth/guest
Content-Type: application/json
```

**请求参数**

无需参数

**成功响应**

```json
{
  "accessToken": "mock-guest-access-token-1734567890",
  "expiresIn": 3600,
  "refreshToken": "mock-guest-refresh-token-1734567890",
  "profile": {
    "id": "10001",
    "isGuest": true
  }
}
```

> [!NOTE]
> 游客账号仅支持本地存储，数据同步功能受限。详见 [接口契约层 - 游客限制](file:///Users/zhengjiyuan/Desktop/iPet/iPet-uniapp/docs/接口契约层.md#23-权限校验)

---

### 1.4 游客账号升级

```http
POST /auth/upgrade
Authorization: Bearer <guestAccessToken>
Content-Type: application/json
```

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | ✅ | 新邮箱地址 |
| `password` | string | ✅ | 新密码 |

**请求示例**

```json
{
  "email": "upgraded@example.com",
  "password": "newpassword123"
}
```

**成功响应**

```json
{
  "accessToken": "mock-user-access-token-1734567890",
  "expiresIn": 3600,
  "refreshToken": "mock-user-refresh-token-1734567890",
  "profile": {
    "id": "10001",
    "isGuest": false
  }
}
```

---

### 1.5 刷新 Token

```http
POST /auth/refresh
Content-Type: application/json
```

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `refreshToken` | string | ✅ | 刷新令牌 |

**请求示例**

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**成功响应**

```json
{
  "accessToken": "new-access-token-1734567890",
  "expiresIn": 3600,
  "refreshToken": "new-refresh-token-1734567890",
  "refreshExpiresIn": 86400
}
```

**错误响应**

| 业务码 | 说明 | 处理建议 |
|--------|------|---------|
| `20003` | Refresh Token 失效 | 跳转登录页 |

---

### 1.6 退出登录

```http
POST /auth/logout
Authorization: Bearer <accessToken>
```

**成功响应**

```json
{
  "code": 200,
  "message": "Logged out successfully"
}
```

---

## 二、宠物管理接口 (Pets)

### 2.1 获取宠物列表

```http
GET /pets
Authorization: Bearer <accessToken>
```

**成功响应**

```json
[
  {
    "id": "pet_001",
    "name": "小白",
    "breed": "柴犬",
    "type": "dog",
    "gender": "male",
    "age": 3,
    "weight": 10.5,
    "avatar": "https://example.com/avatar.jpg",
    "birthday": "2022-01-15",
    "birthTimestamp": 1642204800000,
    "arrivalDate": "2022-03-01",
    "isSterilized": true,
    "personality": ["活泼", "粘人"],
    "updatedAt": 1734567890000
  }
]
```

---

### 2.2 创建宠物

```http
POST /pets
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 宠物名称，1-20 字符 |
| `type` | enum | ✅ | 宠物类型：`dog` \| `cat` \| `other` |
| `breed` | string | ❌ | 品种 |
| `gender` | enum | ❌ | 性别：`male` \| `female` |
| `birthday` | string | ❌ | 生日（ISO 格式 YYYY-MM-DD） |
| `weight` | number | ❌ | 体重（kg） |
| `avatar` | string | ❌ | 头像 URL |
| `arrivalDate` | string | ❌ | 到家日期 |
| `isSterilized` | boolean | ❌ | 是否绝育 |
| `personality` | string[] | ❌ | 性格标签 |
| `allergens` | string | ❌ | 过敏原 |
| `chipId` | string | ❌ | 芯片号 |

**请求示例**

```json
{
  "name": "小白",
  "type": "dog",
  "breed": "柴犬",
  "gender": "male",
  "birthday": "2022-01-15",
  "weight": 10.5
}
```

**成功响应**

```json
{
  "id": "abc123xyz",
  "name": "小白",
  "type": "dog",
  "breed": "柴犬",
  "gender": "male",
  "birthday": "2022-01-15",
  "weight": 10.5,
  "createdAt": "2025-12-19T03:00:00.000Z",
  "updatedAt": 1734567890000
}
```

**错误响应**

| 业务码 | 说明 | 处理建议 |
|--------|------|---------|
| `50001` | 宠物数量达到上限 | 提示删除或升级会员 |

---

### 2.3 更新宠物信息

```http
PATCH /pets/:id
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 宠物 ID |

**请求体**

与创建接口相同，仅传递需要更新的字段。

**成功响应**

返回更新后的完整宠物对象。

---

### 2.4 删除宠物

```http
DELETE /pets/:id
Authorization: Bearer <accessToken>
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 宠物 ID |

**成功响应**

```json
{
  "success": true
}
```

---

## 三、健康记录接口 (Health Records)

### 3.1 获取健康记录列表

```http
GET /health
Authorization: Bearer <accessToken>
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `petId` | string | ❌ | 宠物 ID，筛选特定宠物的记录 |
| `type` | string | ❌ | 指标类型（如 `weight`, `meal`, `water`） |
| `page` | number | ❌ | 页码，从 1 开始 |
| `limit` | number | ❌ | 每页条数，默认全部 |

**成功响应**

```json
[
  {
    "id": "health_pet001_1734567890000",
    "petId": "pet_001",
    "type": "weight",
    "value": 10.5,
    "unit": "kg",
    "date": "2025-12-19T03:00:00.000Z",
    "updatedAt": 1734567890000,
    "notes": "早餐后称重",
    "source": "manual",
    "status": "synced",
    "metadata": {
      "targetDate": "2025-12-19"
    }
  }
]
```

---

### 3.2 创建健康记录

```http
POST /health
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `petId` | string | ✅ | 宠物 ID |
| `type` | string | ✅ | 指标类型 |
| `value` | number | ✅ | 数值 |
| `unit` | string | ❌ | 单位（如 kg, ml, min） |
| `date` | string | ❌ | 记录日期（ISO 格式） |
| `notes` | string | ❌ | 备注 |
| `source` | string | ❌ | 数据来源：`manual` \| `schedule` \| `device` |
| `label` | string | ❌ | 显示标签（如排泄状态） |
| `emoji` | string | ❌ | 显示 emoji |
| `gridValue` | number | ❌ | 网格选择值 |
| `metadata` | object | ❌ | 扩展元数据 |

**指标类型枚举**

| 类型 | 说明 | 单位 | 典型范围 |
|------|------|------|---------|
| `weight` | 体重 | kg | 1-50 |
| `meal` | 饮食量 | g | 50-500 |
| `water` | 饮水量 | ml | 100-1000 |
| `walk_duration` | 遛狗时长 | min | 5-120 |
| `body_temp` | 体温 | ℃ | 37.5-40 |
| `stool` | 排便状态 | - | 1-100 |
| `vomiting` | 呕吐记录 | - | - |
| `bathing` | 洗澡 | - | - |
| `tooth_brushing` | 刷牙 | - | - |
| `deworming` | 驱虫 | - | - |
| `rabies_vaccine` | 疫苗接种 | - | - |
| `anxiety` | 焦虑评估 | - | - |
| `depression` | 情绪评估 | - | - |

**请求示例**

```json
{
  "petId": "pet_001",
  "type": "weight",
  "value": 10.5,
  "unit": "kg",
  "notes": "早餐后称重",
  "metadata": {
    "targetDate": "2025-12-19"
  }
}
```

**成功响应**

返回创建的完整健康记录对象。

---

### 3.3 更新健康记录

```http
PATCH /health/:id
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 记录 ID |

**请求体**

与创建接口相同，仅传递需要更新的字段。

---

### 3.4 删除健康记录

```http
DELETE /health/:id
Authorization: Bearer <accessToken>
```

**成功响应**

```json
{
  "success": true
}
```

---

### 3.5 获取健康摘要

```http
GET /health/summary
Authorization: Bearer <accessToken>
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `petId` | string | ❌ | 宠物 ID |

**成功响应**

```json
{
  "tasks": [
    {
      "id": "task_1",
      "type": "deworming",
      "title": "体内驱虫",
      "dueDate": "2025-12-22T00:00:00.000Z",
      "status": "pending"
    }
  ],
  "pinnedMetrics": [
    {
      "key": "weight",
      "latestRecord": { "id": "...", "value": 10.5, "... " },
      "history": [],
      "trend": "stable",
      "trendValue": "0.2"
    }
  ],
  "trends": [
    {
      "key": "weight",
      "records": []
    }
  ],
  "dailySummaries": {
    "2025-12-19": {
      "meal": "320.5",
      "water": "450.2",
      "weight": "10.5"
    }
  }
}
```

---

### 3.6 获取指标时序数据

```http
GET /health/series
Authorization: Bearer <accessToken>
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `petId` | string | ✅ | 宠物 ID |
| `metricKey` | string | ✅ | 指标类型 |
| `range` | string | ❌ | 时间范围：`day` \| `week` \| `month` \| `six_month` \| `year` |
| `bucket` | string | ❌ | 聚合粒度：`none` \| `day` \| `week` \| `month` |

**成功响应**

```json
{
  "series": [
    {
      "value": 10.2,
      "date": "2025-12-18T00:00:00.000Z",
      "timestamp": 1734480000000
    },
    {
      "value": 10.5,
      "date": "2025-12-19T00:00:00.000Z",
      "timestamp": 1734566400000
    }
  ],
  "stats": {
    "avg": 10.35,
    "min": 10.2,
    "max": 10.5,
    "count": 2
  },
  "meta": {
    "metricKey": "weight",
    "range": "week",
    "bucket": "day",
    "cutoffDate": "2025-12-12T00:00:00.000Z",
    "recordCount": 7,
    "aggregatedCount": 7
  }
}
```

---

### 3.7 切换指标置顶状态

```http
POST /health/metrics/pin
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `petId` | string | ✅ | 宠物 ID |
| `metricKey` | string | ✅ | 指标类型 |
| `isPinned` | boolean | ✅ | 是否置顶 |

---

## 四、用户资料接口 (User)

### 4.1 获取当前用户资料

```http
GET /users/me
Authorization: Bearer <accessToken>
```

**成功响应**

```json
{
  "id": "user_001",
  "displayName": "张三",
  "avatar": "https://example.com/avatar.jpg",
  "uid": "UID123456",
  "email": "user@example.com",
  "mbti": "INTJ",
  "bio": "猫奴一枚",
  "gender": "male",
  "theme": "light",
  "isVip": false,
  "tags": ["养猫", "新手"],
  "updatedAt": 1734567890000
}
```

---

### 4.2 更新用户资料

```http
PUT /users/profile
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `displayName` | string | ✅ | 显示名称，1-20 字符 |
| `avatar` | string | ❌ | 头像 URL |
| `bio` | string | ❌ | 个人简介 |
| `mbti` | string | ❌ | MBTI 类型 |
| `tags` | string[] | ❌ | 用户标签 |

**请求示例**

```json
{
  "displayName": "李四",
  "bio": "三只狗的铲屎官",
  "mbti": "ENFP"
}
```

---

### 4.3 获取 VIP 状态

```http
GET /users/vip-status
Authorization: Bearer <accessToken>
```

**成功响应**

```json
{
  "isVip": true,
  "level": "gold",
  "expireAt": "2026-12-19T00:00:00.000Z"
}
```

---

### 4.4 注销账户

```http
DELETE /users/account
Authorization: Bearer <accessToken>
```

**成功响应**

```json
{
  "code": 200,
  "message": "Account deleted successfully",
  "data": null
}
```

> [!CAUTION]
> 账户注销操作不可逆，所有用户数据将被永久删除。

---

## 五、数据同步接口 (Sync)

### 5.1 下载云端数据

```http
GET /sync
Authorization: Bearer <accessToken>
```

**成功响应**

```json
{
  "pets": [],
  "healthRecords": [],
  "calendarEvents": [],
  "accountInfo": null
}
```

> [!WARNING]
> 游客账号无法使用数据同步功能。

---

### 5.2 上传本地数据

```http
POST /sync
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `pets` | Pet[] | ❌ | 宠物数据 |
| `healthRecords` | HealthRecord[] | ❌ | 健康记录数据 |
| `lastSyncAt` | number | ❌ | 上次同步时间戳 |

**成功响应**

```json
{
  "success": true,
  "timestamp": 1734567890000
}
```

---

## 六、其他接口

### 6.1 发送验证码

```http
POST /verification/code
Content-Type: application/json
```

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | ✅ | 接收验证码的邮箱 |
| `type` | string | ❌ | 验证码类型：`register` \| `reset` |

---

### 6.2 生成健康报告

```http
POST /health/reports/generate
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**请求参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `petId` | string | ✅ | 宠物 ID |
| `startDate` | string | ✅ | 起始日期 |
| `endDate` | string | ✅ | 结束日期 |
| `format` | string | ❌ | 报告格式：`pdf` \| `html` |

---

### 6.3 获取趋势洞察

```http
GET /insights/trend
Authorization: Bearer <accessToken>
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `petId` | string | ✅ | 宠物 ID |
| `metricKey` | string | ✅ | 指标类型 |

---

### 6.4 通知接口

**标记通知已读**
```http
PUT /notifications/:id/read
Authorization: Bearer <accessToken>
```

**标记所有通知已读**
```http
PUT /notifications/read-all
Authorization: Bearer <accessToken>
```

**更新通知偏好**
```http
POST /notifications/preferences
Authorization: Bearer <accessToken>
Content-Type: application/json
```

---

## 七、类型定义参考

### 7.1 Pet

```typescript
interface Pet {
  id: string;
  updatedAt: number;
  deleted?: boolean;
  name: string;
  breed?: string | null;
  age?: number | null;
  weight?: number | null;
  gender?: 'male' | 'female' | null;
  avatar?: string | null;
  birthday?: string | null;
  birthTimestamp?: number | null;
  arrivalDate?: string | null;
  arrivalTimestamp?: number | null;
  ownerId?: string | null;
  type: 'dog' | 'cat' | 'other';
  isArchived?: boolean | null;
  isSterilized?: boolean | null;
  chipId?: string | null;
  toys?: string | null;
  personality?: string[] | null;
  allergens?: string | null;
  vaccineDate?: string | null;
}
```

### 7.2 HealthRecord

```typescript
interface HealthRecord {
  id: string;
  updatedAt: number;
  deleted?: boolean;
  petId: string;
  type: string;
  value: number;
  unit: string;
  date: string;
  notes?: string | null;
  source?: string | null;
  status?: 'pending' | 'synced' | 'failed' | null;
  label?: string | null;
  emoji?: string | null;
  gridValue?: number | null;
  metadata?: Record<string, any>;
}
```

### 7.3 AccountInfo

```typescript
interface AccountInfo {
  id: string;
  displayName: string;
  avatar: string;
  uid: string;
  mbti?: string | null;
  bio?: string | null;
  gender?: 'male' | 'female' | null;
  theme?: 'light' | 'dark' | null;
  isVip?: boolean | null;
  vipLevel?: string | null;
  membership?: {
    level: string;
    expireAt: string;
  };
  updatedAt: number;
  deleted?: boolean;
  tags?: string[];
}
```

---

## 八、变更记录

| 版本 | 日期 | 变更内容 | 负责人 |
|------|------|---------|--------|
| v1.0.0 | 2025-12-19 | 初始版本，基于前端代码推断的 API Reference | 前端团队 |

---

## 九、待办事项

- [ ] **后端确认**：本文档基于前端代码推断，需后端团队确认接口定义
- [ ] **OpenAPI 迁移**：生成 `openapi.yaml` 规范文件
- [ ] **字段校验规则**：补充邮箱格式、密码强度、名称长度等校验规则
- [ ] **错误场景详述**：补充每个接口的详细错误场景和示例
- [ ] **接口测试用例**：为每个接口添加 Postman/Bruno 测试用例
