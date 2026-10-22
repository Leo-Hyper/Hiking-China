# 管理员用户管理 API

所有接口均需要管理员 JWT：

```http
Authorization: Bearer <token>
```

并且账号角色必须为 `admin`。

## 列表、搜索与分页

```http
GET /api/admin/users?q=leo&role=user&status=active&page=1&pageSize=20
```

返回：

```json
{
  "users": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

## 用户详情

```http
GET /api/admin/users/:id
```

返回用户资料以及帖子、评论、活动、粉丝和关注统计。

## 创建用户

```http
POST /api/admin/users
Content-Type: application/json

{
  "username": "new-user",
  "email": "new@example.com",
  "password": "至少8个字符",
  "role": "user",
  "email_verified": 1
}
```

## 更新资料

```http
PUT /api/admin/users/:id
Content-Type: application/json

{
  "username": "updated-user",
  "email": "updated@example.com",
  "avatar": "",
  "bio": "个人简介",
  "location": "成都",
  "hikinglevel": 2,
  "profile_public": 1,
  "role": "moderator",
  "account_status": "active",
  "email_verified": 1
}
```

不能修改 `password_hash`。身份、权限或验证状态变化会使旧登录状态失效。

## 强制下线

```http
POST /api/admin/users/:id/force-logout
```

递增 `auth_version`，现有 JWT 立即失效。

## 发送密码重置邮件

```http
POST /api/admin/users/:id/send-reset
```

不会直接设置或显示密码。

## 删除

软删除：

```http
DELETE /api/admin/users/:id
Content-Type: application/json

{ "mode": "soft" }
```

匿名化：

```http
DELETE /api/admin/users/:id
Content-Type: application/json

{ "mode": "anonymize" }
```

不能删除、停用或降级最后一个管理员，也不能停用或降级当前登录管理员。

## 审计

创建、资料更新、强制下线、软删除和匿名化都会写入 `audit_logs`。
