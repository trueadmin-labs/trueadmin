# TrueAdmin 后端完整架构设计方案

本文档定义 TrueAdmin 后端的目标架构。它以 MineAdmin 的成熟后台设计为参考，同时针对 TrueAdmin 的 AI 友好、模块化、插件化和企业场景做优化。

## 1. 架构定位

TrueAdmin 后端不是重 DDD 框架，也不是简单 CRUD 项目模板。

它的定位是：

```text
Hyperf 企业后台脚手架
+ MineAdmin 风格高效率后台分层
+ 模块化上下文
+ 注解驱动横切能力
+ AI 友好生成规范
+ 插件化演进基础
```

核心目标：

- 普通后台 CRUD 足够快。
- 权限、菜单、数据权限、日志、文件、字典等基础能力完整。
- 业务代码按模块归档，AI 和人都容易定位上下文。
- 数据权限、权限点、日志、监听器尽量声明式接入。
- 未来可以演进到插件和应用市场。

配置模式和注解模式的边界：框架本身优先配置模式，业务开发优先注解模式，模块资产优先模块清单。完整规范见 [配置模式与注解模式规范](configuration-vs-attribute.md)，接口元数据体系见 [接口元数据体系设计](interface-metadata.md)。

## 2. 参考 MineAdmin 的内容

TrueAdmin 参考 MineAdmin 的这些设计：

- `Http/Admin`、`Http/Client`、`Http/Common` 的入口分区。
- `Controller -> Service -> Repository -> Model` 的效率分层。
- `IService`、`IRepository` 类型的 CRUD 基类思路。
- `#[DataScope] + AOP + Context` 的数据权限思路。
- `CurrentUser + Context` 的请求级用户上下文思路。
- `PermissionMiddleware + #[Permission]` 的权限点声明思路。
- `OperationMiddleware + Event + Listener` 的操作日志思路。
- `Schema`、`Vo` 支撑响应结构、OpenAPI 和前端消费。
- `plugin` 应用市场方向。

TrueAdmin 不直接照搬 MineAdmin 的地方：

- 不采用纯全局 `Service/Repository/Model` 作为最终主结构。
- 不只设计 CurrentUser，还要设计 principal/operator 分离的 ActorContext。
- 不让 AOP 数据权限成为黑盒，需要补调试、测试和任务上下文规范。
- 不让 CRUD 基类一开始过重。
- 插件生命周期需要包含 Web、Mobile、OpenAPI、llms.txt、菜单、权限、迁移、种子数据。

详细分析见 [MineAdmin 后端设计分析](../research/mineadmin-backend-analysis.md)。

## 3. 总体目录结构

TrueAdmin 后端采用：

```text
backend/
  app/
    Foundation/
    Infrastructure/
    Module/
      Auth/
      System/
      User/
      Product/
      Order/
      Workflow/
      Message/
  config/
  docs/
    openapi/
  plugin/

packages/
  kernel/
```

核心原则：

- `packages/kernel` 只放真正通用、稳定、可复用的框架基础能力。
- `backend/app/Foundation` 放项目级可改基础行为，承接 kernel 的默认实现和项目定制。
- `backend/app/Infrastructure` 放项目级技术适配，例如缓存、锁、存储、队列、短信、邮件、支付。
- `backend/app/Module` 是业务和系统能力主目录。
- 每个模块内部采用 MineAdmin 分层。
- `plugin` 是未来应用市场和外部模块目录。

`Foundation` 和 `Infrastructure` 的详细边界见 [后端层级边界规范](layer-boundaries.md)。

## 4. 模块内部标准结构

一个完整模块建议结构：

```text
Module/Xxx/
  Http/
    Admin/
      Controller/
      Middleware/
      Request/
      Vo/
    Client/
      Controller/
      Middleware/
      Request/
      Vo/
    Open/
      Controller/
      Middleware/
      Request/
      Vo/
    Common/
      Event/
      Middleware/
      Request/
  Service/
  Repository/
  Model/
  Library/
    Attribute/
    Aspects/
    DataPermission/
    OperationLog/
  Schema/
  Command/
  Database/
    Migrations/
    Seeders/
  routes.php
  module.php
  permissions.php
  menus.php
  openapi.json
  llms.txt
```

第一阶段不要求每个模块都创建完整目录。只创建实际需要的部分。

当前示例模块：

```text
Module/Auth
Module/System
Module/User
Module/Product
```

## 5. 分层职责

### 5.1 Http 层

`Http/Admin` 面向后台管理端。

`Http/Client` 面向用户端应用入口。

`Http/Open` 面向第三方开放平台，第一阶段预留，复杂后再创建。

`Http/Common` 放模块内通用 HTTP 能力、事件、中间件。

Controller 只负责：

- 接收请求。
- 调用 Request 校验。
- 调用 Service。
- 返回统一响应或 Vo/Resource。
- 声明权限点、OpenAPI、操作日志等注解。

Controller 不直接写复杂业务规则。

### 5.2 Service 层

Service 负责业务编排。

普通 CRUD Service 可以继承 `backend/app/Foundation` 提供的轻量 `AbstractService`。

复杂业务 Service 可以绕开 CRUD 基类，自行编排多个 Repository、事件、策略和外部服务。

### 5.3 Repository 层

Repository 负责数据访问。

普通 Repository 可以继承 `backend/app/Foundation` 提供的轻量 `AbstractRepository`。

搜索条件优先通过 `handleSearch()` 扩展。

Repository 不应该处理 HTTP 语义。

### 5.4 Model 层

Model 表达数据库表模型。

Model 不直接暴露给前端。

响应结构通过 Vo、Resource 或 Schema 输出。

### 5.5 Library 层

Library 放模块内横切能力，例如：

- Attribute。
- AOP Aspect。
- 数据权限策略。
- 操作日志能力。
- 模块工具类。
- 领域辅助能力。

系统级通用 Library 放 `Module/System/Library`。

业务模块私有 Library 放对应模块内。

### 5.6 Schema / Vo / Request

`Request` 负责入参校验。

`Vo` 或 `Resource` 负责接口出参结构。

`Schema` 负责结构化元数据、OpenAPI、代码生成器和前端类型生成。

边界：

```text
Request     入参
Vo/Resource 出参
Schema      元数据和生成器
DTO         内部跨层数据
Model       数据库模型
```

## 6. Kernel 边界

`packages/kernel` 是 TrueAdmin 第一版就要建设的 Composer 核心包。

它只放跨模块基础设施，不放后台业务能力。

第一版可以进入 kernel 的能力：

```text
错误码原语
业务异常基类
基础 Controller 抽象
基础 Model 抽象
框架级监听器
Actor / ActorContext 原语
通用工具原语
```

不放进 kernel 的能力：

```text
菜单权限
角色权限
部门岗位
数据权限具体规则
操作日志入库
登录日志
字典配置
文件管理
业务生成器
```

判断标准：

- 所有模块都会依赖的基础设施，可以进 kernel。
- 依赖后台业务表、菜单、角色、部门、岗位的数据，不进 kernel。
- 当前不稳定或强业务绑定的能力，先留在模块内。

这样可以避免所有业务模块依赖 `Module/System` 获取基类，也能保持 `Module/System` 是系统业务模块，而不是隐形框架层。

## 7. API 分区与版本

路径规划：

```text
/api/v1/admin   后台管理端 API
/api/v1/client  用户端 API
/api/v1/open    外部开放平台 API
```

代码映射：

```text
/api/v1/admin/products
-> Module/Product/Http/Admin/Controller/ProductController.php

/api/v1/client/products
-> Module/Product/Http/Client/Controller/V1/ProductController.php

/api/v1/open/products
-> Module/Product/Http/Open/Controller/V1/ProductController.php
```

版本主要隔离对外入口契约，不复制整个模块。Admin 后台端默认不拆 `V1`、`V2` 代码目录；Client 和 Open 因为可能面向用户端 App、第三方系统或长期兼容场景，才在 Controller/Request/Vo 层按版本组织。

Client 或 Open 新增 `v2` 时优先新增：

```text
Http/Client/Controller/V2
Http/Client/Request/V2
Http/Client/Vo/V2
```

Service、Repository、Model 默认复用。

## 8. 身份与 ActorContext

TrueAdmin 不只设计 CurrentUser，而是设计 ActorContext。

核心概念：

```text
principal  实际登录主体
operator   本次业务操作人
source     http / crontab / queue / system
reason     代操作或系统操作原因
```

普通 HTTP 请求：

```text
principal = 当前登录管理员
operator = 当前登录管理员
source = http
```

代操作：

```text
principal = 实际登录管理员
operator = 被代操作管理员
source = http
reason = 管理员代操作
```

定时任务：

```text
principal = system / scheduler
operator = system 或指定管理员
source = crontab
```

规则：

- 鉴权看 principal。
- 数据权限看 operator。
- `created_by`、`updated_by` 默认写 operator。
- 操作日志同时记录 principal 和 operator。
- 队列、定时任务、Listener 不允许隐式假设存在 HTTP 用户。

推荐目录：

```text
packages/kernel/src/Context/Actor.php
packages/kernel/src/Context/ActorContext.php
```

推荐能力：

```text
ActorContext::setPrincipal($actor)
ActorContext::setOperator($actor)
ActorContext::principal()
ActorContext::operator()
ActorContext::runAsSystem(fn () => ...)
ActorContext::runAsAdmin($admin, fn () => ...)
```

## 9. 权限模型

后台权限包含：

```text
管理员
角色
菜单
按钮权限
接口权限
数据权限
部门
岗位
组织树
```

建议注解：

```php
#[Permission('product:list')]
#[Permission('product:create')]
#[Permission('product:update')]
#[Permission('product:delete')]
```

权限注解应能同步生成：

```text
菜单
按钮权限
接口权限
OpenAPI security
前端权限标识
AI 模块说明
```

超级管理员可以绕过权限点校验，但仍应保留操作日志。

## 10. 数据权限设计

参考 MineAdmin：

```text
#[DataScope]
DataScopeAspect
DataPermission Context
Rule / Factory
```

TrueAdmin 增强点：

- 数据权限基于 ActorContext 的 operator。
- 支持 HTTP、队列、定时任务显式注入 operator。
- 支持查询别名和多表查询规范。
- 支持测试断言数据权限是否生效。
- 支持调试最终数据范围。

推荐使用位置：

```php
#[DataScope(onlyTables: ['products'])]
public function page(array $params): array
{
    return $this->repository->page($params);
}
```

不建议把所有 Repository 默认都强行套数据权限。数据权限应该由业务查询入口声明。

## 11. 操作日志与审计

操作日志应升级为审计日志。

日志字段建议：

```text
principal_id
principal_type
operator_id
operator_type
source
reason
module
action
method
path
ip
user_agent
request_id
trace_id
before_data
after_data
result
error_message
created_at
```

记录策略：

- 普通 list/detail 默认不记录操作日志。
- create/update/delete/export/status/approval 必须记录。
- 权限变更、角色变更、用户禁用、数据导出必须重点记录。
- 日志写入通过 Event + Listener 解耦。

推荐目录：

```text
Module/System/Event/RequestOperationEvent.php
Module/System/Listener/Logstash/WriteOperationLogListener.php
```

业务模块也可以有自己的 Listener。

## 12. CRUD 基类设计

参考 MineAdmin 的 `IService`、`IRepository`，但 TrueAdmin 第一版保持轻量。

推荐目录：

```text
backend/app/Foundation/Crud/AbstractCrudController.php
backend/app/Foundation/Service/AbstractService.php
backend/app/Foundation/Repository/AbstractRepository.php
backend/app/Foundation/Database/Model.php
backend/app/Foundation/Pagination/PageResult.php
```

第一版能力：

```text
page
list
findById
create
updateById
deleteById
existsById
handleSearch
handleItems
```

暂不放入第一版基类：

```text
导入导出
树结构
回收站
复杂状态机
复杂数据权限
审计差异对比
批量审批
```

复杂业务允许不继承 CRUD 基类。

## 13. 事件、监听器、队列、定时任务

TrueAdmin 不使用 Subscriber 目录，统一使用 Event / Listener。

事件原则：

- 业务操作只发布事件。
- 副作用由 Listener 处理。
- Listener 不应假设一定存在 HTTP 用户。
- 需要数据权限时必须显式注入 ActorContext。

事件和监听器位置：

```text
Module/Xxx/Event
Module/Xxx/Listener
```

定时任务原则：

```text
ActorContext::runAsSystem(...)
ActorContext::runAsAdmin($admin, ...)
```

禁止在定时任务里直接调用依赖 operator 的 Service，却不注入操作人。

## 14. 数据库迁移与种子数据

数据库迁移采用“迁移归模块，执行归框架”。

数据库驱动采用 PostgreSQL 优先、MySQL 兼容。默认 `DB_DRIVER=pgsql`，PostgreSQL 支持来自 Hyperf 官方扩展包 `hyperf/database-pgsql`；MySQL 走 Hyperf 原生 MySQL connector。业务模块迁移必须优先使用 Hyperf Schema Builder 的跨库安全写法，确需数据库专属能力时在模块文档中显式说明驱动要求。

底层仍使用 Hyperf 默认 migration 方案和 `migrations` 执行记录表。TrueAdmin 在应用启动时把模块和插件迁移目录注册到 Hyperf Migrator，不另造迁移系统。

目录规则：

```text
backend/app/Module/System/Database/Migrations
backend/app/Module/System/Database/Seeders

backend/app/Module/Product/Database/Migrations
backend/app/Module/Product/Database/Seeders

backend/plugin/*/*/Database/Migrations
backend/plugin/*/*/Database/Seeders
```

执行命令：

```bash
php bin/hyperf.php migrate
php bin/hyperf.php migrate:status
php bin/hyperf.php migrate:rollback
php bin/hyperf.php trueadmin:migration-paths
```

规则：

- `migrate`、`migrate:status`、`migrate:rollback` 使用 Hyperf 原生命令。
- TrueAdmin 通过 `RegisterMigrationPathsListener` 把 `app/Module/*/Database/Migrations` 和 `plugin/*/*/Database/Migrations` 注册到 Hyperf Migrator。
- `trueadmin:migration-paths` 只用于查看扫描结果，不负责执行迁移。
- 模块自己的表放模块内迁移。
- 系统业务表放 `Module/System`。
- 第一版不保留 `backend/database/migrations` 根级迁移目录；框架自身不创建业务表。
- 插件迁移跟随插件目录。

命名建议：

```text
admin_users
admin_roles
admin_menus
admin_operation_logs
client_users
products
workflow_definitions
message_notifications
```

后台用户和用户端用户默认分表。

第一版已提供 System、User、Product 的模块迁移示例。

## 15. OpenAPI 与契约中心

OpenAPI 不只是文档，而是契约中心。

作用：

- 后端接口说明。
- Web 类型生成。
- Mobile 类型生成。
- Mock 数据。
- 接口测试。
- 权限点映射。
- AI 生成上下文。

模块可以维护自己的 OpenAPI 片段：

```text
Module/Product/openapi.json
```

最终聚合到：

```text
backend/docs/openapi/openapi.json
```

## 16. 代码生成器设计

TrueAdmin 的生成器应以模块为单位生成完整闭环。

生成范围：

```text
Controller
Request
Vo/Resource
Service
Repository
Model
migration
seeder
menu
permission
OpenAPI
web 页面
mobile 页面
测试用例
llms.txt 模块说明
```

生成器输入可以来自：

```text
数据库表
Schema 元数据
OpenAPI
自然语言需求
AI 模块 Prompt
```

## 17. 插件化设计

成熟模块可以从：

```text
backend/app/Module/Product
```

迁移为：

```text
backend/plugin/trueadmin/product
```

插件结构建议：

```text
plugin/trueadmin/product/
  composer.json
  routes.php
  src/
  Database/Migrations/
  Database/Seeders/
  docs/
  resources/
    menus.php
    permissions.php
    openapi.json
    metadata.json
  web/
  mobile/
  llms.txt
```

插件不再单独设计 `plugin.json` 或 `trueadmin.plugin.json`。`composer.json` 是唯一包清单：`type=trueadmin-plugin` 表示 TrueAdmin 插件，`extra.trueadmin` 描述路由、迁移、菜单、权限、OpenAPI、Web、Mobile、llms 和生命周期。完整规范见 [插件系统规范](plugin-system.md)。

插件可变行为必须优先设计为配置项。插件默认配置写在 `extra.trueadmin.config.defaults`，宿主项目覆盖配置写在 `config/autoload/plugins.php`，插件代码通过 `PluginConfigRepository` 获取合并后的配置。这样开发者可以调整插件能力而不修改插件源码，后续升级插件时保留项目配置即可。

插件生命周期：

```text
install
uninstall
upgrade
migrate
seed
publish assets
sync menu
sync permissions
```

第一版插件主要面向开发者，不做后台运行时动态插件管理。启用和禁用通过 `composer.json`、`extra.trueadmin.enabled` 和 `config/autoload/plugins.php` 控制，变更后走正常发布流程。

## 18. Web 管理端架构

Web 管理端技术栈：

```text
React + Vite + TypeScript + Ant Design
```

建议目录：

```text
web/src/app
web/src/pages
web/src/features
web/src/shared
web/src/services
web/src/stores
```

未来模块页面可以从模块或插件注册。

Web 端必须支持：

- 动态菜单。
- 动态路由。
- 按钮权限。
- OpenAPI 类型生成。
- 标准 CRUD 页面生成。

## 19. 移动端架构

移动端技术栈：

```text
uni-app + Vue 3 + TypeScript + Wot UI
```

移动端定位：轻量管理端。

第一阶段关注：

```text
登录
消息
待办
审批
个人中心
```

模块未来可以提供 mobile 页面片段。

## 20. AI 友好规范

每个模块应逐步具备：

```text
README.md
llms.txt
openapi.json
permissions.php
menus.php
tests
任务模板
模块 Prompt
```

AI 新增模块前必须读取：

```text
docs/backend/architecture.md
docs/research/mineadmin-backend-analysis.md
docs/backend/module-architecture.md
docs/backend/annotation-driven.md
```

AI 修改架构前必须更新项目记忆。

## 21. 演进路线

### 阶段一：后端基础架构稳定

- 固化 `app/Module + MineAdmin 内部分层`。
- 在 `packages/kernel` 实现 ActorContext。
- 在 `packages/kernel` 实现轻量 CRUD 基类。
- 接入 Hyperf migration。
- 建设 admin 用户、角色、菜单、权限、部门、岗位表。

### 阶段二：后台基础能力闭环

- 数据库登录。
- 菜单和权限接口。
- 数据权限规则。
- 操作日志入库。
- 文件上传。
- 字典管理。
- CRUD 生成器最小版。

### 阶段三：Web 管理端闭环

- 登录页。
- 布局和菜单。
- 权限按钮。
- 标准 CRUD 页面。
- OpenAPI 类型生成。

### 阶段四：企业增强模块

- 消息中心。
- 待办中心。
- 流程审批。
- 移动端轻量管理。

### 阶段五：插件化与应用市场

- 模块安装/卸载。
- 模块迁移和种子数据。
- 菜单权限同步。
- Web/Mobile 页面注册。
- AI 模块生成包。

## 22. 决策总结

最终基线：

```text
app/Module + 模块内 MineAdmin 分层
```

关键增强：

```text
ActorContext
轻量 CRUD 基类
Attribute + AOP 数据权限
Event + Listener 日志和副作用
模块级 OpenAPI
模块级 AI 说明
插件生命周期
```

核心原则：

- 先稳定架构，再扩功能。
- 先低门槛，再高天花板。
- 普通 CRUD 快速生成。
- 复杂业务允许跳出 CRUD 基类。
- 数据权限和操作日志要企业级可审计。
- 所有架构决策必须沉淀到文档，而不是只存在聊天里。
