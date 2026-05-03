# API 边界设计

TrueAdmin 虽然首先是后台管理系统，但后续可能同时服务 Web 管理端、用户端应用和外部开放平台。因此 API 必须从第一阶段就预留清晰边界。

## 分区原则

API 按调用方和安全模型分区，而不是只按业务模块分区。

推荐路径：

```text
/api/v1/admin   后台管理端 API
/api/v1/client  用户端 API
/api/v1/open    外部开放平台 API
```

## Admin API

`admin` 分区服务后台管理端。

特点：

- 面向管理员、运营人员和企业内部用户。
- 使用后台 JWT 登录态。
- 强依赖角色、菜单、按钮、接口权限和数据权限。
- 操作需要审计日志。
- 示例：`/api/v1/admin/auth/login`、`/api/v1/admin/system/users`。

## Client API

`client` 分区服务未来用户端应用。

特点：

- 面向普通用户、会员、员工或业务参与者。
- 可使用独立 JWT audience，例如 `client`。
- 权限模型通常不同于后台 RBAC。
- 更关注个人资源、业务流程、移动端体验和隐私边界。
- 示例：`/api/v1/client/profile`、`/api/v1/client/tasks`。

## Open API

`open` 分区服务第三方系统或外部开发者。

特点：

- 不复用后台管理员登录态。
- 应使用独立认证方式，例如 App Key + Secret、签名、OAuth2 或长期访问令牌。
- 必须具备限流、签名校验、时间戳、防重放和调用审计。
- 响应结构可以保持 TrueAdmin 统一格式，但错误码应预留开放平台区间。
- 示例：`/api/v1/open/openapi.json`、`/api/v1/open/webhooks`。

## 代码组织建议

后端 Controller 可按入口分区组织：

```text
backend/app/Module/System/Controller
backend/app/Module/Auth/Controller
packages/kernel/src/Http/Controller
```

业务模块仍然按领域组织：

```text
backend/app/Module/Auth
backend/app/Module/System
backend/app/Module/Organization
backend/app/Module/Workflow
```

Controller 负责入口协议和调用方差异，Module 负责领域能力。不要为了不同 API 入口复制业务规则。

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

## OpenAPI 建议

OpenAPI 文档应按分区维护：

```text
backend/docs/openapi/admin.openapi.json
backend/docs/openapi/client.openapi.json
backend/docs/openapi/open.openapi.json
```

当前第一阶段先提供单文件 `openapi.json`，后续接口增多后拆分。

## 最佳实践提醒

- 不要让外部开放 API 直接复用后台管理接口。
- 不要让用户端 API 暴露后台字段和权限概念。
- 不要让后台管理员 Token 调用开放平台接口。
- 需要审计的 API 从第一版就记录调用方、操作者、资源和结果。
- 版本号放在路径中，便于外部 API 长期兼容。
