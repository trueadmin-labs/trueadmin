# 后端模块目录规范

TrueAdmin 后端采用 `kernel + app/Foundation + app/Infrastructure + app/Module` 的分层方式，其中业务模块采用 `app/Module + 模块内 MineAdmin 分层`。

`backend/app` 下只保留项目级可改基础层、技术适配层和业务模块层：`Foundation`、`Infrastructure`、`Module`。第一版不保留全局 `Command`、`Listener`、`Crontab` 默认落点。具体边界见 [后端层级边界规范](layer-boundaries.md)。

业务能力外层按模块组织，模块内部参考 MineAdmin 的 `Http/Admin`、`Http/Client`、`Service`、`Repository`、`Model`、`Library`、`Schema` 分层。

## 目录基准

```text
backend/app/Module/
  Auth/
    Http/Admin/Controller/
    Http/Admin/Middleware/
    Http/Admin/Vo/
    Service/
  System/
    Library/DataPermission/
    Model/
    Repository/
    Service/
  Product/
    Http/Admin/Controller/
    Http/Admin/Vo/
    Http/Client/Controller/V1/
    Service/
    Repository/
    Model/
    Library/
  User/
    Http/Client/Controller/V1/
    Service/
```

模块内部可以按需包含：

```text
Http/Admin/Controller
Http/Admin/Middleware
Http/Admin/Request
Http/Admin/Vo
Http/Client/Controller
Http/Client/Middleware
Http/Client/Request
Http/Common/Event
Library
Model
Repository
Schema
Service
Database/Migrations
Database/Seeders
module.php
```

模块业务接口默认通过 Controller 上的 Attribute 声明路由、权限、日志和 OpenAPI 元数据，不再要求每个模块维护 `routes.php`。配置模式与注解模式边界见 [配置模式与注解模式规范](configuration-vs-attribute.md)。

第一阶段不需要每个模块都创建完整目录，只创建实际需要的部分。

## 为什么这样设计

纯 MineAdmin 全局分层适合单项目后台，但 TrueAdmin 是脚手架和未来开源框架，需要更清晰的模块上下文。

`app/Module + 模块内 MineAdmin 分层` 的好处：

- 保留 MineAdmin 成熟开发体验。
- 每个业务模块上下文集中，适合 AI 生成和维护。
- 商品、订单、审批、消息等能力可以独立演进。
- 后续更容易迁移到 `plugin` 或应用市场。
- 代码生成器可以按模块生成后端、OpenAPI、菜单、权限、Web 页面和移动端页面。

## 当前示例结构

```text
backend/app/Module/Auth/Http/Admin/Controller/PassportController.php
backend/app/Module/Auth/Http/Admin/Middleware/AdminAuthMiddleware.php
backend/app/Module/Auth/Http/Admin/Vo/AuthUser.php
backend/app/Module/Auth/Service/PassportService.php
backend/app/Module/Auth/Service/JwtService.php

backend/app/Module/Product/Http/Admin/Controller/ProductController.php
backend/app/Module/Product/Http/Admin/Vo/ProductVo.php
backend/app/Module/Product/Http/Client/Controller/V1/ProductController.php
backend/app/Module/Product/Http/Client/Vo/V1/ProductResource.php
backend/app/Module/Product/Service/ProductQueryService.php
backend/app/Module/Product/Service/ClientProductQueryService.php
backend/app/Module/Product/Repository/ProductRepository.php
backend/app/Module/Product/Model/Product.php

backend/app/Module/User/Http/Client/Controller/V1/ProfileController.php
backend/app/Module/User/Service/ProfileService.php

packages/kernel/src/DataPermission/Attribute/DataScope.php
packages/kernel/src/DataPermission/Aspects/DataScopeAspect.php
packages/kernel/src/OperationLog/Attribute/OperationLog.php
backend/app/Module/System/Listener/Logstash/WriteOperationLogListener.php
```

## API 与代码映射

```text
/api/v1/admin/auth/login
-> Module/Auth/Http/Admin/Controller/PassportController.php

/api/v1/admin/products
-> Module/Product/Http/Admin/Controller/ProductController.php

/api/v1/client/profile
-> Module/User/Http/Client/Controller/V1/ProfileController.php

/api/v1/client/products
-> Module/Product/Http/Client/Controller/V1/ProductController.php
```

## 模块职责

`Auth` 承载后台认证、JWT、管理员登录态。

`System` 承载系统级通用能力，例如数据权限、配置、字典、基础日志、全局设置。

`Product` 是业务模块示例，展示 Admin 和 Client 两类入口如何在同一模块内共存。

`User` 当前承载用户端个人中心示例，后续可扩展为会员/用户体系。

## 统一事件目录规则

TrueAdmin 不使用 `Subscriber` 目录。

统一规则：

```text
Service  发布 Event
Event    描述发生了什么
Listener 响应 Event，处理日志、通知、统计、清缓存等副作用
```

业务事件放在模块根级 `Event`，事件监听器放在模块根级 `Listener`。不要把业务监听器放到 `Http/Admin` 下面。

推荐：

```text
Module/Product/Event/ProductPublished.php
Module/Product/Listener/NotifyProductPublishedListener.php
Module/System/Event/OperationLogged.php
Module/System/Listener/Logstash/WriteOperationLogListener.php
```

## 注解驱动横切能力

稳定的注解契约、AOP 原语和上下文能力放在 `packages/kernel`：

```text
packages/kernel/src/Http/Attribute/Permission.php
packages/kernel/src/Http/Attribute/OpenApi.php
packages/kernel/src/DataPermission/Attribute/DataScope.php
packages/kernel/src/DataPermission/Aspects/DataScopeAspect.php
packages/kernel/src/OperationLog/Attribute/OperationLog.php
packages/kernel/src/OperationLog/Event/OperationLogged.php
```

依赖后台权限表、部门表、日志表的具体实现留在 `Module/System`：

```text
Module/System/Listener/Logstash/WriteOperationLogListener.php
Module/System/Service/PermissionService.php
Module/System/Repository/AdminMenuRepository.php
```

业务模块自己的事件、监听器或私有横切能力放在模块内。不要因为要使用数据权限或操作日志注解，就让业务模块依赖 `Module/System`。

## Kernel 依赖规则

模块不要为了基类依赖 System。

通用基类采用两层：kernel 放稳定原语，Foundation 放项目可改默认实现。业务模块默认依赖 Foundation：

```text
backend/app/Foundation/Crud/AbstractCrudController.php
backend/app/Foundation/Service/AbstractService.php
backend/app/Foundation/Repository/AbstractRepository.php
backend/app/Foundation/Database/Model.php
packages/kernel/src/Context/Actor.php
packages/kernel/src/Context/ActorContext.php
```

`Module/System` 只做系统业务能力，例如菜单、权限、部门、岗位、字典、配置、系统日志。

## 插件化迁移

当业务模块成熟后，可以从：

```text
backend/app/Module/Product
```

迁移为：

```text
backend/plugin/trueadmin/product
```

模块内部结构保持一致，迁移成本会比较低。

插件不是简单复制模块目录。插件必须提供 `composer.json`，并通过 `type=trueadmin-plugin` 与 `extra.trueadmin` 描述 TrueAdmin 资产和生命周期。完整规范见 [插件系统规范](plugin-system.md)。

## AI 新增模块检查清单

新增模块前先确认：

- 模块名称是什么，例如 `Order`、`Workflow`、`Message`。
- 是否需要 Admin API、Client API 或 Open API。
- Controller 放在模块内哪个 `Http` 目录。
- Service、Repository、Model 是否需要新增。
- 是否需要 Request、Vo、Schema。
- 是否需要 `DataScope`、操作日志或 Listener。
- 是否需要迁移、种子数据、OpenAPI、菜单和权限点。
