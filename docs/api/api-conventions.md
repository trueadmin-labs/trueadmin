# API 规范

## 风格

TrueAdmin 使用 RESTful API，并通过 OpenAPI/Swagger 描述接口契约。

推荐前缀：

```text
/api/v1
```

TrueAdmin 按调用方进一步划分 API 边界：

```text
/api/v1/admin
/api/v1/client
/api/v1/open
```

详细说明见 [API 边界设计](api-boundaries.md)。

## 认证

认证方式使用 JWT Token。

请求头：

```http
Authorization: Bearer <token>
```

## 响应结构

成功响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

失败响应：

```json
{
  "code": 400001,
  "message": "参数校验失败",
  "data": {
    "errors": []
  }
}
```

分页响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

## HTTP 方法

- `GET`：查询列表或详情。
- `POST`：创建资源或执行明确动作。
- `PUT`：整体更新资源。
- `PATCH`：局部更新资源。
- `DELETE`：删除资源。

## 命名约定

- 路径使用小写短横线。
- JSON 字段使用 camelCase。
- 数据库字段使用 snake_case。
- 权限标识使用模块加动作，例如 `system:user:create`。

## 常用接口示例

```text
POST   /api/v1/admin/auth/login
POST   /api/v1/admin/auth/logout
GET    /api/v1/admin/auth/me
GET    /api/v1/admin/system/users
POST   /api/v1/admin/system/users
GET    /api/v1/admin/system/users/{id}
PUT    /api/v1/admin/system/users/{id}
DELETE /api/v1/admin/system/users/{id}
```

## 错误码区间

- `0`：成功。
- `400xxx`：请求错误或参数错误。
- `401xxx`：认证失败。
- `403xxx`：权限不足。
- `404xxx`：资源不存在。
- `409xxx`：资源冲突。
- `500xxx`：服务端错误。

## OpenAPI 要求

新增接口必须包含：

- 路径。
- 方法。
- 摘要。
- 权限点。
- 请求参数。
- 响应结构。
- 错误响应。
- 至少一个示例。

AI 生成后端或前端代码时，应优先参考 OpenAPI 契约，而不是仅根据页面描述猜测字段。
