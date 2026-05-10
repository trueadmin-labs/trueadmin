# API 边界设计

TrueAdmin 同时预留后台管理端、用户端和开放平台 API。

身份和权限的详细分域规则见 [身份与权限边界规范](identity-and-permissions.md)。

API 版本和多端代码复用规则见 [后端模块目录规范](../backend/module-architecture.md) 和 [API 版本与复用边界规范](versioning-and-reuse.md)。

## 分区原则

```text
/api/admin   后台管理端 API
/api/v1/client  用户端 API
/api/v1/open    外部开放平台 API
```

## Admin API

`admin` 分区服务后台管理端。

代码放在对应模块内：

```text
Module/Auth/Http/Admin/Controller/PassportController.php
Module/Order/Http/Admin/Controller/OrderController.php
```

特点：

- 使用后台 JWT 登录态。
- 使用后台身份体系。
- 强依赖角色、菜单、按钮、接口权限和数据权限。
- 写操作需要审计日志。

## Client API

`client` 分区服务未来用户端应用。

代码放在对应业务模块内。认证入口归属 `Auth`，业务入口归属真实业务模块：

```text
Module/Auth/Http/Client/Controller/V1/PassportController.php
Module/Order/Http/Client/Controller/V1/OrderController.php
```

示例路径：

```text
POST /api/v1/client/auth/login
GET /api/v1/client/auth/me
GET /api/v1/client/orders
```

第一版内置 `client_users` 作为用户端基础认证主体，归属 `Module/System`，后台账号管理接口位于 `/api/admin/organization/client-users`。Client 登录、刷新 Token、获取当前身份等认证流程归属 `Module/Auth/Http/Client`。项目需要会员、客户、订单等业务能力时，再按业务语义新增 `Member`、`Customer`、`Order` 或其他更贴切的模块。不要为了一个用户端接口创建泛化的 `Module/User`。

## Open API

`open` 分区服务第三方系统或外部开发者。

第一阶段先保留路径和 OpenAPI 文档入口。后续如果开放平台复杂化，可以在模块内增加：

```text
Module/Xxx/Http/Open
Module/Xxx/Service/Open
```

## 鉴权建议

- Admin API 使用后台 JWT 和 RBAC 权限点。
- Client API 使用用户 JWT 和用户侧权限策略。
- Open API 使用开放平台认证和签名机制。

JWT 应使用 `aud` 区分调用方：

```text
admin
client
open
```
