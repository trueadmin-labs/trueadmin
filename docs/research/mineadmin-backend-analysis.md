# MineAdmin 后端设计分析

本文档用于帮助 TrueAdmin 在继续演进前，先理解 MineAdmin 的后端设计理念、优势、问题和可优化方向。

结论先行：MineAdmin 的核心不是 DDD，而是典型后台框架的“效率分层 + 注解驱动 + 权限数据权限 + 插件生态”。TrueAdmin 可以参考它，但不应该无脑照搬。更合适的方向是：吸收 MineAdmin 的成熟工程机制，再结合 TrueAdmin 的 AI 友好、模块上下文和长期插件化目标做优化。

## 一、MineAdmin 的项目结构

MineAdmin 后端主要目录：

```text
app/
  Command/
  Exception/
  Http/
    Admin/
      Controller/
      Middleware/
      Request/
      Subscriber/
      Vo/
    Api/
      Controller/
      Middleware/
      Request/
    Common/
      Controller/
      Event/
      Middleware/
      Request/
      Swagger/
    CurrentUser.php
  Library/
    DataPermission/
  Model/
    Permission/
    DataPermission/
    Enums/
  Repository/
    Permission/
    Logstash/
  Schema/
  Service/
    Permission/
    Logstash/

databases/
  migrations/
  seeders/

plugin/
  mine-admin/
    app-store/
```

这个结构体现的是“端入口分区 + 全局业务分层”。

## 二、设计理念拆解

### 1. 端入口优先

MineAdmin 把 HTTP 入口按调用端拆开：

```text
Http/Admin
Http/Api
Http/Common
```

这说明它首先关注的是后台管理端和 API 端的入口差异，而不是按业务模块做第一层隔离。

优点：

- 后台入口非常清晰。
- 中间件、请求、响应对象、监听器都能按端归属。
- 权限、菜单、操作日志天然围绕 Admin 端建设。

问题：

- 业务多了以后，Controller、Service、Repository、Model 分散在不同全局目录。
- Product、Order、Workflow 这类业务上下文不集中。
- AI 或新人要理解一个业务，需要跨多个全局目录跳转。

### 2. Service / Repository / Model 效率分层

MineAdmin 有通用 `IService` 和 `IRepository`。

`IService` 提供：

```text
count
page
getList
create
save
updateById
deleteById
findById
existsById
```

`IRepository` 提供：

```text
handleSearch
handleItems
handlePage
list
count
page
create
updateById
saveById
deleteById
forceDeleteById
findById
findByFilter
perQuery
getQuery
existsById
```

这是非常典型的后台 CRUD 高效率设计。

优点：

- 普通 CRUD 代码量少。
- Repository 的 `handleSearch()` 很适合快速扩展搜索条件。
- Service 大量复用 Repository 能力，生成器容易生成。
- 对后台管理系统非常实用。

问题：

- Service 容易变成 Repository 的薄代理。
- 复杂业务如果继续套通用 CRUD，边界会变模糊。
- 基类能力太多时，调用链对新人不透明。
- 一旦所有业务都继承统一基类，后续改基类影响面很大。

### 3. Attribute + AOP 数据权限

MineAdmin 的数据权限核心是：

```text
#[DataScope]
DataScopeAspect
DataPermission Context
Factory
Rule
```

使用方式是在 Service 方法上加：

```php
#[DataScope(...)]
public function page(array $params, int $page = 1, int $pageSize = 10): array
{
    return parent::page($params, $page, $pageSize);
}
```

AOP 捕获 `#[DataScope]`，把数据权限配置写入协程上下文，再在查询执行时根据当前用户的数据权限策略追加查询条件。

优点：

- 数据权限对业务方法侵入低。
- Service 只声明数据权限范围，不手写权限 SQL。
- 通过 Context 可以让 Repository 查询感知当前数据权限。
- 很适合后台列表、导出、删除、更新等统一数据范围控制。

问题：

- AOP + 查询执行拦截比较隐式，调试成本高。
- 业务方法看不到最终 SQL 条件，容易误解。
- 对复杂查询、跨表查询、别名、聚合查询要求更高。
- 数据权限依赖 CurrentUser，脱离 HTTP 的定时任务/队列需要额外注入操作人。
- 如果 Context 没清理好，会有协程上下文污染风险。

### 4. CurrentUser 请求上下文

MineAdmin 使用 `CurrentUser` 从 JWT 中拿用户 ID，再缓存到 Hyperf Context：

```text
Context::get('current_user')
Context::set('current_user', $user)
```

优点：

- 业务层不用层层传当前用户。
- 数据权限、权限中间件、菜单过滤都能读取当前用户。
- 符合 Hyperf/Swoole 协程请求上下文模型。

问题：

- 它主要表达“当前登录用户”，没有显式区分 principal 与 operator。
- 定时任务、队列任务、系统自动任务不天然有 CurrentUser。
- 代操作、指定操作人、系统操作的数据权限需要额外模型。
- 如果所有地方直接依赖 CurrentUser，会增加测试和异步任务复杂度。

### 5. PermissionMiddleware 权限校验

MineAdmin 通过注解收集权限点：

```text
PermissionMiddleware
AnnotationCollector
#[Permission]
CurrentUser->hasPermission()
```

优点：

- 权限点声明接近 Controller 方法。
- 中间件统一校验。
- 超级管理员绕过逻辑清晰。

问题：

- 权限点和菜单/按钮/接口关系需要统一生成和同步。
- 过度依赖注解时，权限变更需要扫描和缓存处理。
- 复杂数据权限仍然需要 DataScope 配合，不是 PermissionMiddleware 单独解决。

### 6. 操作日志中间件和 Subscriber

MineAdmin 操作日志大体是：

```text
OperationMiddleware 解析路由注解
RequestOperationEvent
UserOperationSubscriber
UserOperationLogService
```

登录日志也是 Event + Subscriber。

优点：

- Controller 不需要手写日志逻辑。
- 日志写入和业务请求解耦。
- Subscriber 可以异步协程处理副作用。

问题：

- 操作日志依赖路由/OpenAPI 注解的 summary。
- 普通查询是否记录日志需要策略，否则容易日志噪音过大。
- 日志记录的是 CurrentUser，未显式记录 principal/operator 差异。

### 7. Schema / Vo

MineAdmin 有 `Schema` 和 `Vo`：

```text
Schema/UserSchema.php
Http/Admin/Vo/PassportLoginVo.php
```

作用偏向结构化响应、接口文档、前端消费和代码生成。

优点：

- 有利于 OpenAPI 和前端类型生成。
- 避免 Model 直接暴露给前端。

问题：

- Schema、Vo、Resource 的边界需要明确，否则容易重复。
- 如果规范不清楚，AI 会不知道响应结构应该放哪里。

### 8. 插件生态

MineAdmin 有 `plugin/mine-admin/app-store`。

插件中包含：

```text
mine.json
ConfigProvider.php
Controller
Service
```

优点：

- 说明 MineAdmin 长期目标不是只有应用代码，还有应用市场。
- 插件可独立安装、卸载、升级。

问题：

- 主应用全局分层和插件内部结构需要一致，否则迁移成本高。
- 插件的迁移、菜单、权限、前端页面、OpenAPI、依赖关系需要完整生命周期规范。

## 三、MineAdmin 设计的核心优势

- 后台开发效率高。
- CRUD 基类实用。
- 数据权限设计成熟，有 Attribute + AOP 的统一入口。
- 权限、菜单、部门、岗位、日志这些后台基础能力完整。
- 使用迁移和种子数据安装，更适合长期维护。
- Event + Subscriber 解耦日志和副作用。
- 插件生态方向明确。

## 四、MineAdmin 设计可能存在的问题

### 1. 业务上下文分散

全局 `Service`、`Repository`、`Model` 目录在业务少时很清晰，但业务多时上下文会分散。

例如商品相关代码可能分布在：

```text
Http/Admin/Controller/ProductController.php
Http/Api/Controller/ProductController.php
Service/ProductService.php
Repository/ProductRepository.php
Model/Product.php
Schema/ProductSchema.php
```

这对 AI 生成和模块级维护不够友好。

### 2. AOP 隐式能力需要更强文档

数据权限靠 AOP 和 Context，很强大，但也更隐式。

TrueAdmin 如果采用，需要提供：

- 明确的注解使用规范。
- 调试方式。
- 查询别名和多表查询规则。
- 定时任务注入 operator 的规范。
- 测试示例。

### 3. CurrentUser 不足以覆盖企业操作语义

企业后台里，“登录人”和“操作人”可能不同。

需要区分：

```text
principal  实际登录主体
operator   本次业务操作人
source     http / crontab / queue / system
reason     代操作或系统操作原因
```

数据权限通常看 operator，审计日志需要同时记录 principal 和 operator。

### 4. CRUD 基类容易变重

基类能提升效率，但也容易承载过多能力。

TrueAdmin 需要控制基类边界：

- 第一版只做 page/list/create/update/delete/find。
- 数据权限、导入导出、树结构、回收站、状态机不要一次性塞入基类。
- 复杂业务允许绕开 CRUD 基类。

### 5. API / Admin / Open 边界还可以更清晰

MineAdmin 有 `Http/Admin` 和 `Http/Api`。TrueAdmin 需要同时考虑：

```text
Admin 后台管理端
Client 用户端
Open 第三方开放平台
```

如果未来开放平台复杂，应明确是否新增 `Http/Open`。

## 五、TrueAdmin 的优化方向

### 0. 统一事件命名为 Event / Listener

MineAdmin 中存在 `Subscriber` 命名，但它本质上实现的是 Hyperf `ListenerInterface`。TrueAdmin 为了降低理解成本，统一使用 `Event / Listener` 命名，不再使用 `Subscriber` 目录。

规则：Service 发布 Event，Listener 响应 Event。业务事件和副作用监听都放模块根级 `Event`、`Listener`，不放 `Http/Admin/Subscriber`。


### 1. 采用“模块外壳 + MineAdmin 内部分层”

推荐 TrueAdmin 使用：

```text
app/Module/Product/
  Http/Admin/Controller/
  Http/Api/Controller/
  Service/
  Repository/
  Model/
  Library/
  Schema/
```

而不是纯全局：

```text
app/Service
app/Repository
app/Model
```

理由：

- 保留 MineAdmin 内部分层。
- 业务上下文集中。
- 更适合 AI 生成。
- 后续更容易迁移为 plugin。

### 2. 建设轻量 CRUD 基类

参考 MineAdmin 的 `IService`、`IRepository`，但第一版更克制。

建议第一版采用 kernel + Foundation 两层：kernel 放稳定原语，Foundation 放项目可改默认实现：

```text
backend/app/Foundation/Service/AbstractService.php
backend/app/Foundation/Repository/AbstractRepository.php
backend/app/Foundation/Crud/AbstractCrudController.php
backend/app/Foundation/Database/Model.php
```

这样避免所有模块为了继承基类而依赖 `Module/System`。

第一版只提供：

```text
page
list
findById
create
updateById
deleteById
existsById
handleSearch
```

复杂能力后续按需加。

### 3. 建设 ActorContext，而不是只有 CurrentUser

TrueAdmin 应该比 MineAdmin 更进一步，设计：

```text
principal 当前登录主体
operator 当前操作人
source    http / crontab / queue / system
reason    代操作原因
```

推荐第一版直接放在 kernel：

```text
packages/kernel/src/Context/Actor.php
packages/kernel/src/Context/ActorContext.php
```

HTTP 中间件默认：

```text
principal = admin
operator = admin
```

定时任务必须显式：

```text
ActorContext::runAsSystem(...)
ActorContext::runAsAdmin($admin, ...)
```

### 4. 保留 Attribute + AOP，但加强显式规范

可以参考 MineAdmin 的数据权限做法，但要补强：

- 哪些方法应该加 `DataScope`。
- 查询别名怎么处理。
- 多表查询怎么处理。
- 脱离 HTTP 的任务如何注入 operator。
- 如何在测试里断言数据权限。

### 5. 操作日志不要简单放 Service 查询方法

推荐：

- 普通 list/detail 不写操作日志。
- create/update/delete/export/status 这类写操作记录操作日志。
- 操作日志优先从 Controller 写操作入口或命令 Service 触发。
- 日志同时记录 principal 和 operator。

### 6. 插件生命周期要比 MineAdmin 更 AI 友好

未来模块升级为插件时，应包含：

```text
module.json
routes.php
src/
Database/Migrations
Database/Seeders
web/
mobile/
docs/
openapi.json
llms.txt
```

这样 AI 可以生成完整模块，而不是只生成 PHP 文件。

## 六、建议 TrueAdmin 下一步

不要继续大幅来回迁移目录。

下一步建议按顺序做：

1. 固化 `app/Module + MineAdmin 内部分层` 文档。
2. 实现 `ActorContext`，解决当前用户、操作人、定时任务操作身份问题。
3. 实现轻量 `AbstractRepository`、`AbstractService`、`AbstractCrudController`。
4. 用一个真实 CRUD 模块验证，例如 `Banner` 或 `Dictionary`。
5. 接入 Hyperf migration，建设后台基础表。
6. 再补完整数据权限规则和操作日志入库。

## 七、一句话结论

MineAdmin 的设计强在后台效率、权限数据权限、注解驱动和插件生态。它的问题在于业务上下文分散、AOP 隐式、CurrentUser 语义不够覆盖企业操作场景。TrueAdmin 应该采用“模块外壳 + MineAdmin 内部分层”，并在 ActorContext、AI 生成规范、插件生命周期上做增强。
