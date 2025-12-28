# 管理后台 API 文档

> **模块说明**: 本文档描述 iPet-Backend 的管理后台 API，用于后台管理系统调用。
> **认证方式**: 独立的管理员 JWT Token，与普通用户 Token 分离。
> **全局前缀**: `/api/admin`
> **文档版本**: v1.1.0 (2025-12-27)

---

## 统一响应格式（v0.0.20+）

所有 API 响应均采用以下格式：

**成功响应**：
```json
{
  "success": true,
  "data": { ... },
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1703680000000
}
```

**错误响应**：
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "用户不存在"
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1703680000000
}
```

**分页响应**：
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "requestId": "...",
  "timestamp": 1703680000000
}
```

---

## 一、管理员认证

### 1.1 管理员登录

**端点**: `POST /api/admin/login`

**认证**: 无需认证  
**限流**: 3次失败后锁定30分钟

**请求**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400,
    "admin": {
      "id": "clx1234567890",
      "username": "admin",
      "displayName": "系统管理员",
      "role": "super_admin"
    }
  },
  "requestId": "...",
  "timestamp": 1703680000000
}
```

**JWT Payload**:
```typescript
{
  adminId: string;     // 管理员ID
  username: string;    // 用户名
  role: string;        // 角色 (admin, super_admin)
  isAdmin: true;       // 管理员标识
}
```

---

## 二、用户管理 API

### 2.1 获取用户列表

**端点**: `GET /api/admin/users`

**认证**: 需要管理员 Token

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `search` | string | 搜索关键词（邮箱、昵称、姓名） |
| `isGuest` | boolean | 筛选游客/正式用户 |
| `isBanned` | boolean | 筛选封禁状态 |
| `page` | number | 页码，从1开始 |
| `limit` | number | 每页数量，默认20，最大100 |

**响应**:
```json
{
  "items": [
    {
      "id": "clx123",
      "email": "user@example.com",
      "displayName": "用户昵称",
      "avatar": "http://...",
      "isGuest": false,
      "isBanned": false,
      "createdAt": "2024-12-20T00:00:00.000Z",
      "lastActiveAt": "2024-12-27T00:00:00.000Z",
      "petsCount": 2
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

### 2.2 获取用户详情

**端点**: `GET /api/admin/users/:id`

**响应**:
```json
{
  "id": "clx123",
  "email": "user@example.com",
  "displayName": "用户昵称",
  "isGuest": false,
  "isBanned": false,
  "healthRecordsCount": 150,
  "pets": [
    {
      "id": "pet_xyz",
      "name": "旺财",
      "type": "dog",
      "healthRecordsCount": 80
    }
  ]
}
```

---

### 2.3 封禁用户

**端点**: `PATCH /api/admin/users/:id/ban`

**请求**:
```json
{
  "reason": "违反社区规定"
}
```

**响应**:
```json
{
  "id": "clx123",
  "email": "user@example.com",
  "isBanned": true,
  "bannedAt": "2024-12-27T10:00:00.000Z",
  "bannedReason": "违反社区规定"
}
```

---

### 2.4 解封用户

**端点**: `PATCH /api/admin/users/:id/unban`

**响应**:
```json
{
  "id": "clx123",
  "email": "user@example.com",
  "isBanned": false
}
```

---

### 2.5 删除用户

**端点**: `DELETE /api/admin/users/:id`

**响应**:
```json
{
  "message": "用户已删除"
}
```

> ⚠️ 此操作会删除用户的所有关联数据（宠物、健康记录、头像文件等）

---

### 2.6 游客统计

**端点**: `GET /api/admin/users/guests/stats`

**响应**:
```json
{
  "total": 1000,
  "last7Days": 150,
  "last30Days": 400
}
```

---

## 三、文章管理 API

### 3.1 获取文章列表

**端点**: `GET /api/admin/articles`

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `category` | string | 文章分类 |
| `search` | string | 搜索标题/摘要 |
| `page` | number | 页码 |
| `limit` | number | 每页数量 |

**响应**:
```json
{
  "items": [
    {
      "id": "art_123",
      "title": "如何给狗狗测量体温",
      "summary": "...",
      "category": "education",
      "views": 1500,
      "likes": 200,
      "createdAt": "2024-12-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

### 3.2 创建文章

**端点**: `POST /api/admin/articles`

**请求**:
```json
{
  "title": "文章标题",
  "summary": "文章摘要",
  "content": "文章正文内容（Markdown/HTML）",
  "category": "education",
  "cover": "http://example.com/cover.jpg",
  "author": "管理员"
}
```

---

### 3.3 更新文章

**端点**: `PATCH /api/admin/articles/:id`

**请求**:
```json
{
  "title": "更新后的标题",
  "content": "更新后的内容"
}
```

---

### 3.4 删除文章

**端点**: `DELETE /api/admin/articles/:id`

**响应**:
```json
{
  "message": "文章已删除"
}
```

---

## 四、统计聚合 API

### 4.1 仪表盘统计

**端点**: `GET /api/admin/stats/dashboard`

**响应**:
```json
{
  "users": {
    "total": 10000,
    "guests": 3000,
    "registered": 7000,
    "active7d": 2000,
    "active30d": 5000,
    "newToday": 50
  },
  "pets": {
    "total": 8000,
    "distribution": [
      { "type": "dog", "count": 5000 },
      { "type": "cat", "count": 2500 },
      { "type": "other", "count": 500 }
    ]
  },
  "healthRecords": {
    "total": 150000,
    "today": 500
  },
  "articles": {
    "total": 100,
    "totalViews": 50000
  },
  "generatedAt": "2024-12-27T10:00:00.000Z"
}
```

---

### 4.2 用户增长趋势

**端点**: `GET /api/admin/stats/users/trend`

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| `days` | number | 天数，默认30，最大365 |

**响应**:
```json
[
  { "date": "2024-11-27", "count": 45 },
  { "date": "2024-11-28", "count": 52 },
  ...
]
```

---

### 4.3 健康记录趋势

**端点**: `GET /api/admin/stats/records/trend`

**查询参数**: 同上

---

## 五、系统监控 API

### 5.1 系统信息

**端点**: `GET /api/admin/system/info`

**响应**:
```json
{
  "status": "ok",
  "uptime": 86400,
  "version": "0.0.19",
  "system": {
    "platform": "darwin",
    "arch": "arm64",
    "nodeVersion": "v20.10.0",
    "hostname": "server-1",
    "uptime": 3600,
    "memoryUsage": {
      "total": 17179869184,
      "free": 8589934592,
      "used": 8589934592,
      "usedPercent": "50.00"
    },
    "cpuUsage": [1.5, 1.2, 1.0]
  }
}
```

---

### 5.2 存储统计

**端点**: `GET /api/admin/system/storage`

**响应**:
```json
{
  "uploadsDir": "./data/uploads",
  "totalFiles": 1500,
  "totalSize": 524288000,
  "totalSizeFormatted": "500 MB",
  "breakdown": {
    "jpg": { "count": 1000, "size": 350000000 },
    "png": { "count": 400, "size": 150000000 },
    "webp": { "count": 100, "size": 24288000 }
  }
}
```

---

## 六、错误响应

### 6.1 认证错误

```json
{
  "statusCode": 401,
  "message": "管理员账号不存在",
  "error": "Not Found"
}
```

```json
{
  "statusCode": 401,
  "message": "密码错误",
  "error": "Unauthorized"
}
```

### 6.2 权限错误

```json
{
  "statusCode": 401,
  "message": "Invalid admin token",
  "error": "Unauthorized"
}
```

---

## 七、数据模型

### 7.1 Admin 模型

```prisma
model Admin {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  displayName  String?
  role         String   @default("admin")
  isActive     Boolean  @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

### 7.2 User 封禁字段

```prisma
// 新增字段
isBanned     Boolean  @default(false)
bannedAt     DateTime?
bannedReason String?
```

---

## 八、部署说明

### 8.1 自动同步 Prisma/DB

启动后端时会自动检查 Prisma 客户端和数据库迁移状态：

```bash
npm run start:dev  # 自动执行 prisma:sync
```

手动同步：
```bash
npm run prisma:sync
```

### 8.2 数据库迁移

```bash
cd iPet-BackEnd
npx prisma migrate dev --name add_admin_and_user_ban
```

### 8.3 创建初始管理员

```bash
# 开发环境
npx ts-node scripts/seed-admin.ts

# 生产环境（必须指定密码）
ADMIN_PASSWORD=your_secure_password npx ts-node scripts/seed-admin.ts
```

默认账号：`admin` / `admin123`

> ⚠️ **安全提示**: 请在生产环境中修改默认密码！

---

**最后更新**: 2025-12-27  
**文档版本**: v1.1.0

