# API 版本与复用边界规范

TrueAdmin 需要同时支持后台管理端、用户端和开放平台，也需要为未来 `v1`、`v2` API 演进预留空间。

核心原则：Controller、Request、Resource 按端和版本隔离；Domain、Model、Repository 复用；Service 按职责分层复用。

## 推荐模块结构

```text
backend/app/Module/Xxx/
  Controller/
    Admin/
      V1/
      V2/
    Client/
      V1/
    Open/
      V1/

  Request/
    Admin/
      V1/
    Client/
      V1/
    Open/
      V1/

  Resource/
    Admin/
      V1/
    Client/
      V1/
    Open/
      V1/

  Service/
    Admin/
    Client/
    Open/

  Domain/
    Model/
    Repository/
    Service/
    Policy/
    DTO/
    ValueObject/

  Event/
  Listener/
  Crontab/
```

第一阶段可以不一次性创建所有目录，但新增模块时应按这个边界判断代码归属。

## API 路径与 Controller

API 版本放在路径中：

```text
/api/v1/admin/users
/api/v2/admin/users
/api/v1/client/profile
/api/v1/open/users
```

Controller 按端和版本组织：

```text
backend/app/Module/System/Controller/Admin/V1/UserController.php
backend/app/Module/System/Controller/Admin/V2/UserController.php
backend/app/Module/Client/Controller/Client/V1/ProfileController.php
backend/app/Module/Open/Controller/Open/V1/AppController.php
```

不要复制整个模块来做版本隔离。

不推荐：

```text
backend/app/Module/V1/System
backend/app/Module/V2/System
```

## Model 是否复用

Model 默认复用，不按端和版本复制。

推荐：

```text
backend/app/Module/Auth/Domain/Model/AdminUser.php
backend/app/Module/Client/Domain/Model/ClientUser.php
```

不推荐：

```text
backend/app/Module/System/Controller/Admin/V1/Model/User.php
backend/app/Module/System/Controller/Admin/V2/Model/User.php
```

模型代表领域数据结构，不代表某个 API 版本。

## Service 是否复用

Service 分两类：

- Domain Service：复用业务规则。
- Application Service：按端区分编排流程。

领域规则应放在：

```text
Domain/Service
```

端差异编排应放在：

```text
Service/Admin
Service/Client
Service/Open
```

示例：

```text
Domain/Service/PasswordPolicyService.php
Service/Admin/AdminUserQueryService.php
Service/Client/ClientProfileService.php
Service/Open/OpenUserQueryService.php
```

后台查询用户详情可能需要角色、部门、岗位和权限；用户端查询个人资料只需要昵称、头像、手机号；开放 API 还需要签名、scope 和脱敏。它们不应该强行共用同一个应用 Service。

## Repository 是否复用

Repository 默认复用。

Repository 代表数据访问能力，不应因为端或版本不同而复制。

推荐：

```text
Domain/Repository/AdminUserRepository.php
Domain/Repository/ClientUserRepository.php
```

只有当不同端使用完全不同的数据源时，才考虑拆分 Repository 实现。

## Request 与 Resource

Request 和 Resource 应按端和版本隔离。

原因是 API 契约是对外承诺，版本变化通常体现在入参、出参、字段名称、字段可见性和兼容策略上。

推荐：

```text
Request/Admin/V1/CreateUserRequest.php
Resource/Admin/V1/UserResource.php
Resource/Admin/V2/UserResource.php
Resource/Client/V1/ProfileResource.php
```

## Policy

Policy 不建议后台和用户端混用。

后台 Policy 通常处理：

- RBAC。
- 数据权限。
- 部门岗位。
- 操作权限点。

用户端 Policy 通常处理：

- 是否本人资源。
- 是否满足业务状态。
- 是否具备轻量 scope。
- 是否存在业务关系。

推荐：

```text
Domain/Policy/Admin/UserPolicy.php
Domain/Policy/Client/ProfilePolicy.php
```

## 复用边界总结

默认复用：

- Domain Model。
- Domain Repository。
- Domain Service。
- ValueObject。
- 领域事件。

默认隔离：

- Controller。
- Request。
- Resource。
- Application Service。
- Policy。
- API 路由。

## AI 开发提醒

AI 新增接口前必须先判断：

- 调用端：`admin`、`client`、`open`。
- API 版本：`v1`、`v2`。
- 是否只是入参/出参变化。
- 是否需要新增领域能力。
- 是否可以复用已有 Domain Model、Repository、Domain Service。

不要为了新增 `v2` 复制整个模块。优先新增对应版本的 Controller、Request、Resource，并复用领域层。

