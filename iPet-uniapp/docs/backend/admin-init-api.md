# 管理后台初始化 API 规范

## 规范背景
后台管理端需要通过初始化向导创建首个管理员，并持久化入口路径与访问地址。为避免前后端接口不一致，本规范统一初始化相关接口与返回结构。

## 适用对象
- 后台服务（iPet-BackEnd）初始化接口
- 后台管理端（backend-ui）初始化与系统设置

## 约束规则
- 初始化接口必须在未登录状态可访问
- 初始化仅允许执行一次（已存在管理员时返回冲突错误）
- 系统配置持久化应包含 `entryPath`、`accessUrl`、`port`
- 修改入口路径与访问配置必须为 `admin`
- 修改入口路径必须校验当前管理员密码
- 管理员设置更新密码时必须校验旧密码

## 接口定义

### 1) 检查管理员是否存在
- 方法：`GET /api/admin/exists`
- 返回：
```json
{
  "exists": true
}
```

### 2) 初始化系统
- 方法：`POST /api/admin/init`
- 请求：
```json
{
  "accessUrl": "http://localhost:5173",
  "port": 5173,
  "entryPath": "admin",
  "admin": {
    "username": "admin",
    "email": "admin@example.com",
    "password": "Admin123!"
  }
}
```
- 返回：
```json
{
  "admin": {
    "id": "xxx",
    "username": "admin",
    "displayName": "admin",
    "role": "admin"
  },
  "accessToken": "jwt",
  "message": "系统初始化成功"
}
```

### 3) 获取系统配置
- 方法：`GET /api/admin/settings/system-config`
- 返回：
```json
{
  "accessUrl": "http://localhost:5173",
  "port": 5173,
  "entryPath": "admin"
}
```

### 4) 修改入口路径
- 方法：`PUT /api/admin/settings/entry-path`
- 权限：`admin`
- 请求：
```json
{
  "newPath": "manager",
  "currentPassword": "Admin123!"
}
```
- 返回：
```json
{
  "newPath": "manager",
  "newLoginUrl": "http://localhost:5173/manager/login"
}
```

### 5) 修改访问配置
- 方法：`PUT /api/admin/settings/access-config`
- 权限：`admin`
- 请求：
```json
{
  "url": "https://example.com",
  "port": 443
}
```
- 返回：`{ "ok": true }`

### 6) 获取管理员设置
- 方法：`GET /api/admin/settings`
- 权限：登录管理员
- 返回：
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "port": 5173,
  "entryPath": "admin"
}
```

### 7) 更新管理员设置
- 方法：`PUT /api/admin/settings`
- 权限：登录管理员
- 请求：
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "currentPassword": "OldPassword123",
  "password": "NewPassword123",
  "port": 5173,
  "entryPath": "admin"
}
```
- 规则：
  - `password` 可选，未提交则不更新密码
  - 提交 `password` 时必须提交 `currentPassword`
- 返回：
```json
{
  "username": "admin",
  "email": "admin@example.com",
  "port": 5173,
  "entryPath": "admin"
}
```

### 8) 验证旧密码
- 方法：`POST /api/admin/settings/verify-password`
- 权限：登录管理员
- 请求：
```json
{
  "currentPassword": "OldPassword123"
}
```
- 返回：
```json
{
  "valid": true
}
```

## 示例
在初始化向导中，先调用 `/api/admin/exists` 判断是否初始化；若未初始化，再调用 `/api/admin/init` 完成初始化并返回首个管理员 Token。
