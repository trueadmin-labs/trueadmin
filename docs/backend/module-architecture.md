# 后端模块目录规范

TrueAdmin 后端采用 `kernel + app/Foundation + app/Infrastructure + app/Module` 的分层方式，其中业务模块采用 `app/Module + 模块内 MineAdmin 分层`。

`backend/app` 下只保留项目级可改基础层、技术适配层和业务模块层：`Foundation`、`Infrastructure`、`Module`。第一版不保留全局 `Command`、`Listener`、`Crontab` 默认落点。具体边界见 [后端层级边界规范](layer-boundaries.md)。

业务能力外层按模块组织，模块内部参考 MineAdmin 的 `Http/Admin`、`Http/Client`、`Service`、`Repository`、`Model`、`Library`、`Schema` 分层。

模块划分优先按业务域和能力域，不按调用端划分。一个模块可以同时提供后台端、用户端和开放平台端能力：后台入口放 `Http/Admin`，用户端入口放 `Http/Client`，开放平台入口放 `Http/Open`。

不要因为出现用户端接口就创建通用 `Module/User`。第一版内置的 `client_users` 是系统基础账号资源，归属 `Module/System`；用户端登录、刷新 Token、获取当前身份这类认证流程归属 `Module/Auth`；用户端会员、客户、订单、内容等业务能力，应按真实业务语义归属 `Module/Member`、`Module/Customer`、`Module/Order` 或其他更贴切的模块。

## 调用端边界

`Admin`、`Client`、`Open` 是入口边界，不是模块边界。

- `Http/Admin`：后台管理端入口，面向当前 `web` 管理端和未来 Admin 定位的 `uniapp`。这里可以依赖后台 JWT、RBAC、菜单权限、数据权限和操作日志。
- `Http/Client`：用户端入口，面向未来会员端、客户侧、小程序用户端等应用。这里不能复用 Admin 菜单权限假设。
- `Http/Open`：开放平台入口，面向第三方系统。这里不能复用 Admin / Client 登录态，应使用开放平台认证和签名策略。

端内独有代码只放在对应 `Http/<End>` 目录及其 Request、Middleware、Vo、Controller 中。端间复用的业务规则放在模块根级 `Service`、`Repository`、`Model`、`Event`、`Listener`、`Library` 或 `Schema` 中；如果某个 Service 只服务单一端且包含大量端内语义，可以放入 `Service/Admin`、`Service/Client` 或 `Service/Open` 子目录，但不要反向让通用 Service 读取 HTTP Request 或端内身份细节。

后端可进入 `trueadmin/kernel` 的内容必须是跨端稳定原语，例如 CRUD 查询值对象、Actor、Attribute、错误码、数据权限原语。依赖数据库表、菜单、权限资源、Controller 或业务流程的实现留在模板 `Foundation`、模块或插件内。完整包边界见 [TrueAdmin 包与端边界](../package-boundaries.md)。

## 目录基准

```text
backend/app/Module/
  Auth/
    Http/Admin/Controller/
    Http/Admin/Middleware/
    Http/Admin/Vo/
    Http/Client/Controller/V1/       # 未来用户端认证入口
    Http/Open/Controller/V1/         # 未来开放平台认证入口
    Service/
  System/
    Database/Migrations/
    Http/Admin/Controller/
    Http/Admin/Request/
    Library/DataPermission/
    Model/
    Repository/
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
Command
Crontab
Event
Listener
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

模块业务定时任务放在模块内 `Crontab/` 目录，优先使用 Hyperf 原生 `#[Crontab]` 注解注册。根级 `config/autoload/crontab.php` 只保留全局开关和框架级兜底配置，不集中登记各模块业务任务。定时任务类只做调度入口，复杂业务规则下沉到模块 Service。

第一阶段不需要每个模块都创建完整目录，只创建实际需要的部分。

## Request 与 Service 边界

模块内推荐按端放置 Request：

```text
Module/Xxx/Http/Admin/Request/CreateXxxRequest.php
Module/Xxx/Http/Admin/Request/UpdateXxxRequest.php
Module/Xxx/Http/Client/Request/V1/CreateXxxRequest.php
Module/Xxx/Http/Open/Request/V1/CreateXxxRequest.php
```

Request 只描述当前入口的输入契约，适合字段必填、类型、长度、格式、基础枚举和入参归一化。Service 描述模块业务能力，适合跨入口共享的业务规则和不变量。

示例边界：

```text
Request 校验：name 必填、status 只能是 enabled/disabled、pageSize 最大 100。
Service 校验：父部门不能是自己或子孙、主部门必须属于用户所属部门、角色授权必须引用存在的菜单和数据策略。
```

如果一个规则需要查数据库、读取当前 operator、判断部门树、菜单树或数据权限范围，默认属于 Service、Policy 或独立业务类，不属于 Request。

这能避免 Controller 变厚，也能避免 Service 混入大量 HTTP 输入细节。AI 新增模块时，应优先生成 Request，再让 Controller 传入 `$request->validated()` 给 Service。

## 事务边界

第一版采用显式事务，不使用事务注解和基类封装。需要事务时，在模块用例 Service 的公开写方法中直接调用 `Hyperf\DbConnection\Db::transaction()`。

规则：

- Controller、Command、Consumer、Crontab 默认不开事务。
- Repository 禁止开事务。
- 用例 Service 负责多表写入、状态流转、授权关系和跨 Repository 编排的事务边界。
- Service 调 Service 时，外层用例 Service 控制事务，内层 Service 不重复开事务。
- 只读查询不使用事务。
- 操作日志、登录日志、通知等旁路副作用不要作为主事务成功的前置条件。

这种写法牺牲了一点“自动化”，但换来清晰的事务范围。AI 生成代码时，应优先让事务块包住完整业务用例，而不是在每个 Service 或 Repository 方法里随手开启事务。

## try/catch 边界

默认不要用 `try/catch` 包住业务主流程。明显需要中断业务的错误必须继续向上抛出；如果捕获后只记录日志却继续返回成功，会破坏调用方对业务结果的判断。

允许捕获并降级的场景主要是旁路副作用，例如操作日志、登录日志、通知、埋点、搜索索引同步。这类代码捕获异常后必须写 warning 日志。强一致业务步骤，例如授权关系写入、库存扣减、订单状态流转、部门树调整，不能吞异常；如需补充日志，捕获后必须重新抛出。

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

trueadmin-kernel/src/DataPermission/Attribute/DataScope.php
trueadmin-kernel/src/DataPermission/Aspects/DataScopeAspect.php
trueadmin-kernel/src/OperationLog/Attribute/OperationLog.php
backend/app/Module/System/Listener/Logstash/WriteOperationLogListener.php
```

## API 与代码映射

```text
/api/admin/auth/login
-> Module/Auth/Http/Admin/Controller/PassportController.php

/api/v1/client/auth/login
-> Module/Auth/Http/Client/Controller/V1/PassportController.php

/api/v1/client/orders
-> Module/Order/Http/Client/Controller/V1/OrderController.php
```

## 模块职责

`Auth` 承载认证能力，包括后台登录态、JWT，以及未来用户端和开放平台的认证入口。它不承载会员、客户、订单等业务资料管理。

`System` 是 TrueAdmin 第一版内置基础能力模块，承载管理员账号、用户端基础账号、角色、菜单、权限、部门、数据权限、配置、字典、基础日志、全局设置等系统自带资源。

第一版内置 `client_users`，但它只表示用户端基础认证主体，不承载会员等级、积分余额、客户画像、业务标签等扩展资料。项目需要会员或客户能力时，再按业务语义新增 `Member`、`Customer` 或其他更贴切的模块；该模块可以通过 `client_user_id` 关联基础账号，并维护自己的 Model、Repository、Service 和 `Http/Client` 业务接口。登录入口仍由 `Auth/Http/Client` 承担。

业务模块，例如 `Order`、`Workflow`、`Message`，后续按同一目录规范新增，不作为第一版内置模块。

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
Module/Order/Event/OrderPaid.php
Module/Order/Listener/NotifyOrderPaidListener.php
Module/System/Event/OperationLogged.php
Module/System/Listener/Logstash/WriteOperationLogListener.php
```

## 注解驱动横切能力

稳定的注解契约、AOP 原语和上下文能力放在 `trueadmin-kernel`：

```text
trueadmin-kernel/src/Http/Attribute/Permission.php
trueadmin-kernel/src/Http/Attribute/OpenApi.php
trueadmin-kernel/src/DataPermission/Attribute/DataScope.php
trueadmin-kernel/src/DataPermission/Aspects/DataScopeAspect.php
trueadmin-kernel/src/OperationLog/Attribute/OperationLog.php
trueadmin-kernel/src/OperationLog/Event/OperationLogged.php
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
backend/app/Foundation/Service/AbstractService.php
backend/app/Foundation/Repository/AbstractRepository.php
backend/app/Foundation/Database/Model.php
backend/app/Foundation/Tree/TreeHelper.php
trueadmin-kernel/src/Context/Actor.php
trueadmin-kernel/src/Context/ActorContext.php
```

`Module/System` 只做系统业务能力，例如菜单、权限、部门、岗位、字典、配置、系统日志。

## 插件化迁移

当业务模块成熟后，可以从：

```text
backend/app/Module/Order
```

迁移为：

```text
plugins/true-admin/order
```

模块内部结构保持一致，迁移成本会比较低。

插件不是简单复制模块目录。插件必须提供根目录 `plugin.json` 描述插件身份、插件依赖、兼容性和生命周期；PHP 后端如需 Composer 依赖，在 `backend/php/composer.json` 中声明。插件后端目录与模块目录保持同构，不额外包 `src/`；框架级插件 CLI 把 runtime 复制到各端运行时目录，并分发生成各端自己的插件配置文件。根目录 `plugins/` 不参与宿主代码扫描。完整规范见 [插件系统规范](plugin-system.md)。

## AI 新增模块检查清单

新增模块前先确认：

- 模块名称是什么，例如 `Order`、`Workflow`、`Message`。
- 是否需要 Admin API、Client API 或 Open API。
- Controller 放在模块内哪个 `Http` 目录。
- Service、Repository、Model 是否需要新增。
- 是否需要 Request、Vo、Schema。
- 是否需要 `DataScope`、操作日志或 Listener。
- 是否需要迁移、种子数据、OpenAPI、菜单和权限点。
