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

### 5.1.1 Request 与 Service 校验边界

TrueAdmin 按“输入契约”和“业务不变量”拆分校验职责。这条规则对 AI 生成代码尤其重要：看到 Request 就知道这里是 HTTP 入参契约，看到 Service 就知道这里是业务规则。

Request 层负责不依赖业务上下文的输入校验和归一化，例如：

- 字段是否必填。
- 字段类型，例如整数、字符串、数组、布尔值。
- 长度、格式、基础枚举，例如 `status in enabled,disabled`。
- HTTP 入参命名归一，例如 `parent_id` 转 `parentId`。
- 空字符串转 `null`、分页参数默认值等纯输入处理。

Service 层负责必须在所有入口都成立的业务不变量，例如：

- `primaryDeptId` 必须属于 `deptIds`。
- 父角色、父部门、菜单、角色、部门是否真实存在。
- 角色不能移动到自己或子孙节点。
- 子角色权限不能超过父角色权限范围。
- 部门不能删除有子部门或已绑定用户的部门。
- 当前操作者是否允许创建、授权或删除目标资源。

不要把业务不变量只放在 Request 层。Service 可能被 Controller、Command、Crontab、Listener、Queue、插件或测试直接调用；如果业务规则只存在于 HTTP Request，非 HTTP 入口就会绕过约束。

推荐调用形态：

```php
public function create(CreateAdminUserRequest $request): array
{
    return ApiResponse::success($this->users->create($request->validated()));
}
```

Service 不应该长期保留 `requiredString()`、`status()` 这类纯输入校验辅助方法；它应该保留 `assertPrimaryDepartmentInDepartments()`、`assertWithinParentMenuScope()` 这类业务语义方法。开发早期可以先在 Service 内收敛校验，稳定后应迁移到 Request 层，让 Controller、Request、Service 三者更容易被 AI 和人同时理解。

### 5.2 Service 层

Service 负责业务编排。

普通 CRUD Service 可以继承 `backend/app/Foundation` 提供的轻量 `AbstractService`。

复杂业务 Service 可以绕开 CRUD 基类，自行编排多个 Repository、事件、策略和外部服务。

`AbstractService` 不承载隐式 CRUD 流程，第一版只提供高频、低业务含义的辅助能力，例如：

- `assertUnique()`：统一重复校验的错误结构。
- `assertExistingIds()`：统一批量 ID 存在性校验。
- `notFound()`：统一资源不存在异常。

业务创建、更新、删除流程仍应在具体 Service 中显式表达。这样既减少重复，也避免 FastAdmin 式控制器黑箱和 MineAdmin 式薄代理 Service 过度扩散。

### 5.2.1 事务边界

第一版事务边界采用显式写法：直接在用例 Service 的公开写入口调用 `Db::transaction()`。暂不提供 `#[Transactional]` 注解，也不在 `AbstractService` 中封装事务方法，避免事务范围被 AOP 或基类隐藏，方便 AI 和开发者阅读调用链。

事务归属规则：

- Controller、Command、Consumer、Crontab 默认不启动事务，只负责入口编排和调用用例 Service。
- Repository 禁止启动事务，只负责查询和持久化动作。
- `XxxManagementService`、`XxxUseCase` 这类用例 Service 的公开写方法可以作为事务边界。
- Service 内部私有方法不单独开启事务。
- Service 调 Service 时，默认由最外层用例 Service 控制事务，内层 Service 不重复开启事务。
- 只读 `list`、`detail`、`tree` 不开启事务。
- 单表简单写入可以不开事务；涉及多表写入、授权关系、状态流转、跨 Repository 编排时必须显式开启事务。

推荐写法：

```php
use Hyperf\DbConnection\Db;

public function create(array $payload): array
{
    return Db::transaction(function () use ($payload): array {
        $user = $this->users->create($this->payloadForCreate($payload));
        $this->users->syncRoles((int) $user->getAttribute('id'), $payload['roleIds']);
        $this->users->syncDepartments((int) $user->getAttribute('id'), $payload['deptIds']);

        return $this->detail((int) $user->getAttribute('id'));
    });
}
```

不推荐写法：

```php
public function create(array $payload): array
{
    return Db::transaction(function () use ($payload): array {
        // roleService、deptService 内部如果也开启事务，边界会变得难以判断。
        $this->roleService->assign($payload);
        $this->deptService->assign($payload);

        return $this->detail($payload['id']);
    });
}
```

如果一个能力既要被单独调用，又要被外层用例组合调用，优先拆成“公开用例方法 + 私有实际执行方法”：公开方法负责事务，私有方法只做业务步骤。跨模块复杂编排时，应新增更高层用例 Service，例如 `OrderCheckoutService`，由它统一控制事务，而不是让多个模块 Service 各自开启事务。

事件和事务要分清楚：强一致副作用应在事务内显式完成；操作日志、登录日志、通知、搜索索引等旁路副作用不要阻塞主事务。未来如果需要可靠异步副作用，优先考虑 Outbox，而不是在 Listener 中硬依赖主流程。

### 5.2.2 try/catch 使用边界

`try/catch` 不是默认模板。第一版默认让异常向上抛出，由全局异常处理器转换为统一响应；只有明确允许降级的旁路副作用才可以捕获异常并继续主流程。

规则：

- 会影响业务一致性的错误不能被吞掉，例如创建订单失败、扣库存失败、角色授权失败、部门关系写入失败。
- 如果捕获的是关键业务异常，必须重新抛出原异常或转换为 `BusinessException` 后抛出，不能只写日志后继续。
- 操作日志、登录日志、通知投递、埋点、搜索索引同步等旁路副作用可以 `try/catch`，但必须写 warning 日志，不能静默。
- `catch (Throwable $exception)` 只能用于边界层或旁路 Listener；业务 Service 中应优先捕获明确异常类型。
- 不要用 `try/catch` 包住大段业务流程来“防止报错”。如果主流程失败，应该失败得清楚。

推荐写法：

```php
try {
    $this->logs->create($payload);
} catch (Throwable $exception) {
    $this->logger->warning('operation.log.persist_failed', [
        'message' => $exception->getMessage(),
        'action' => $payload['action'] ?? '',
    ]);
}
```

不推荐写法：

```php
try {
    $order = $this->orders->create($payload);
    $this->stocks->decrease($order);
} catch (Throwable $exception) {
    // 错误被吞掉后，调用方会误以为订单创建成功。
    $this->logger->error($exception->getMessage());
}
```

如果确实需要在关键流程中补充上下文日志，必须重新抛出：

```php
try {
    return $this->createOrder($payload);
} catch (Throwable $exception) {
    $this->logger->error('order.create_failed', ['message' => $exception->getMessage()]);
    throw $exception;
}
```

### 5.3 Repository 层

Repository 负责数据访问。

普通 Repository 可以继承 `backend/app/Foundation` 提供的轻量 `AbstractRepository`。

`AbstractRepository` 是标准 CRUD 的底层工具层，不负责业务判断。第一版提供：

- `query()`、`findModelById()`、`existsModelById()`。
- `createModel()`、`updateModel()`、`deleteModel()`。
- `existingModelIds()`。
- `syncPivot()`、`pivotIds()`。
- `pageQuery()`、`listQuery()`、`handleSearch()`。

后台管理列表统一使用 `AdminQueryRequest -> AdminQuery -> AbstractRepository::handleSearch()` 这一条链路，避免每个列表接口各自解析分页、关键字、筛选和排序。

标准查询参数：

```text
page=1
pageSize=20
keyword=admin
filter={"status":"enabled"}
op={"status":"="}
sort=created_at
order=desc
```

分页响应统一输出 `pageSize`，请求参数和 JSON 字段都使用 camelCase，数据库字段仍使用 snake_case。`filter`、`op`、`sort` 只允许命中 Repository 声明的白名单字段，禁止把前端参数直接映射成任意 SQL 字段。

搜索条件优先通过 `handleSearch()` 扩展。简单场景只需要配置 `$keywordFields`、`$filterable`、`$sortable`、`$defaultSort`；复杂场景可以在具体 Repository 覆盖 `handleSearch()`，但仍应保留字段白名单和业务语义清晰的查询封装。

Repository 不应该处理 HTTP 语义。

树结构统一使用 `backend/app/Foundation/Tree/TreeHelper.php` 处理 `level`、`path`、祖先判断和数组树构建。部门、菜单、角色这类树形资源可以复用该 helper，但树结构不进入所有 CRUD 的默认流程。

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
/api/admin   后台管理端 API
/api/v1/client  用户端 API
/api/v1/open    外部开放平台 API
```

代码映射示例：

```text
/api/admin/orders
-> Module/Order/Http/Admin/Controller/OrderController.php

/api/v1/client/orders
-> Module/Order/Http/Client/Controller/V1/OrderController.php

/api/v1/open/orders
-> Module/Order/Http/Open/Controller/V1/OrderController.php
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
operation_dept_id 本次操作部门
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
- 写入默认使用 operator 的当前操作部门。
- `created_by`、`updated_by` 默认写 operator。
- 操作日志同时记录 principal 和 operator。
- 操作日志应记录本次 operation_dept_id，便于审计还原当时以哪个部门身份操作。
- 队列、定时任务、Listener 不允许隐式假设存在 HTTP 用户。

后台管理员第一版支持多部门。用户拥有一个主部门和多个所属部门：

```text
admin_users.primary_dept_id
admin_departments.id
admin_departments.parent_id
admin_departments.level
admin_departments.path
admin_user_departments.user_id
admin_user_departments.dept_id
admin_user_departments.is_primary
```

`admin_departments` 按树形部门设计，后台提供 `/api/admin/system/departments` 作为标准管理入口。部门树是用户所属部门、主部门、后续数据权限范围和组织审计的基础资源，不应该只通过数据库手工维护。

主部门用于默认操作部门，不代表用户只能查看主部门数据。一次请求的操作部门优先级：

```text
显式指定 operation_dept_id
-> operator.claims.operationDeptId
-> operator.claims.primaryDeptId
-> null
```

如果允许前端切换当前操作部门，只能在用户所属部门集合内切换；切换结果进入 Token claims、服务端 Session 或请求上下文，具体实现可按项目部署形态选择。定时任务和队列必须显式传入 operator 及 operation_dept_id，不能默认取某个 HTTP 用户。

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
角色层级
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

### 角色层级

角色第一版建议支持层级，但角色层级只表达授权边界和管理边界，不建议默认表达权限继承。

推荐字段：

```text
admin_roles.parent_id
admin_roles.level
admin_roles.path
admin_roles.sort
```

核心规则：

- 父角色可以创建、编辑、授权子角色。
- 子角色的菜单、按钮、接口权限必须是父角色权限集合的子集。
- 子角色的数据权限范围不能超过父角色的数据权限范围。
- 普通管理员只能分配自己可管理角色树内的角色。
- 禁止移动角色到自己的子孙节点下，避免环形层级。
- `super-admin` 是根级特殊角色，不受父级约束，但仍记录操作日志。
- 角色层级不自动继承权限。父角色拥有 `A/B/C`，子角色不会自动拥有 `A/B/C`，必须显式授权，且只能授权其中子集。

为什么不默认继承：后台角色经常用于岗位职责拆分，“上级能管理下级”不等于“下级拥有上级全部权限”。默认继承容易导致权限扩散；子集约束更安全，也更符合企业后台授权习惯。

授权时应校验三类边界：

```text
当前 principal 可管理的角色范围
目标父角色已拥有的权限范围
目标角色即将保存的权限范围
```

当角色绑定数据权限时，数据范围也要做子集校验。例如父角色只能查看华东大区，子角色不能被授予全国范围；父角色只能查看部门 A/B，子角色只能在 A/B 内选择。

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
- 数据权限支持多部门，计算时使用 operator 的可见部门集合，而不是只使用主部门。
- 当前操作部门只决定写入归属和审计上下文，不应该收窄用户本来拥有的可见部门集合。
- 支持 HTTP、队列、定时任务显式注入 operator。
- 支持查询别名和多表查询规范。
- 支持测试断言数据权限是否生效。
- 支持调试最终数据范围。

后台数据权限建议内置这些范围：

```text
all                         全部数据
self                        本人创建
current_department          当前操作部门
current_department_tree     当前操作部门及子部门
assigned_departments        用户所属部门集合
assigned_departments_tree   用户所属部门集合及子部门
department_created_by       所属部门集合 + 本人创建
custom_departments          角色指定部门集合
```

当用户属于多个部门时，`assigned_departments` 和 `assigned_departments_tree` 才是主要数据权限入口。`primary_dept_id` 只是默认操作部门，不应该被误用为唯一数据部门。

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

`action` 使用点分层级命名，格式为 `{端}.{资源}.{动作}`。

示例：

```text
admin.user.create
admin.user.update
admin.user.delete
admin.role.create
admin.role.update
admin.role.authorize
admin.menu.create
admin.menu.update
admin.menu.delete
```

不使用 `admin_user_create`、`admin_role_update`、`admin_menu_delete` 这类下划线拼接格式。点分格式更适合日志检索、审计聚合、权限/接口动作对齐和后续 OpenTelemetry/BI 维度分析。

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

底层仍使用 Hyperf 默认 migration、seeder 方案和 `migrations` 执行记录表。TrueAdmin 在应用启动时把模块和插件迁移目录注册到 Hyperf Migrator，把模块和插件 Seeder 目录注册到 Hyperf Seed，不另造迁移或填充系统。

目录规则：

```text
backend/app/Module/System/Database/Migrations
backend/app/Module/System/Database/Seeders

backend/plugin/*/*/Database/Migrations
backend/plugin/*/*/Database/Seeders
```

执行命令：

```bash
php bin/hyperf.php migrate:fresh --seed
php bin/hyperf.php migrate
php bin/hyperf.php migrate:status
php bin/hyperf.php migrate:rollback
php bin/hyperf.php db:seed --force
php bin/hyperf.php migrate --seed
php bin/hyperf.php trueadmin:migration-paths
```

规则：

- 开发环境首次初始化优先使用 `migrate:fresh --seed`。
- 正常初始化或升级使用 `migrate --seed`。
- `migrate`、`migrate:status`、`migrate:rollback`、`migrate:refresh --seed`、`db:seed` 仍使用 Hyperf 原生命令。
- TrueAdmin 通过 `RegisterMigrationPathsListener` 把 `app/Module/*/Database/Migrations` 和 `plugin/*/*/Database/Migrations` 注册到 Hyperf Migrator。
- TrueAdmin 通过 `RegisterSeederPathsListener` 把 `app/Module/*/Database/Seeders` 和 `plugin/*/*/Database/Seeders` 注册到 Hyperf Seed，并通过 `NamespacedSeed` 支持命名空间 Seeder。
- `trueadmin:migration-paths` 只用于查看扫描结果，不负责执行迁移或填充。
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
member_profiles
products
workflow_definitions
message_notifications
```

第一版只保留已经形成完整闭环的系统表。`admin_operation_logs` 已由 `#[OperationLog]`、AOP、事件和 `Module/System` Listener 写入；`admin_login_logs` 已由后台登录事件和 `Module/System` Listener 写入。`system_dicts`、`system_configs`、`client_login_logs`、`client_operation_logs` 暂不预留，等对应能力进入产品闭环时再按模块补齐。

后台用户和用户端用户默认分表。第一版内置 `client_users` 作为用户端基础认证主体，归属 `Module/System`；项目需要会员、客户等业务资料时再按业务语义新增 `Member`、`Customer` 或其他模块，通过 `client_user_id` 关联基础账号。用户端认证入口归属 `Module/Auth/Http/Client`，不要新增泛化 `Module/User`。

第一版已提供 System 的模块迁移示例。业务模块迁移按相同规范放入对应模块目录。

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
Module/Order/openapi.json
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
backend/app/Module/Order
```

迁移为：

```text
plugins/true-admin/product
```

插件结构建议：

```text
plugins/true-admin/product/
  plugin.json
  backend/php/
    composer.json
    Http/Admin/Controller/
    Service/
    Repository/
    Model/
    Request/
    Vo/
    Event/
    Listener/
    Library/
    Database/Migrations/
    Database/Seeders/
    resources/
      menus.php
      permissions.php
      openapi.json
      metadata.json
  docs/
  web/
  mobile/
  llms.txt
```

插件根目录 `plugin.json` 是包级插件清单，描述插件身份、插件依赖、兼容性和生命周期。Composer 只作为 PHP 后端 runtime 的依赖工具，PHP 插件在 `backend/php/composer.json` 中声明 autoload 和 PHP 包依赖。插件后端目录与 `backend/app/Module/*` 保持同构，不额外包 `src/`；安装器把插件包内的 runtime 目录复制到各端运行时目录，并写入宿主项目插件注册表。根目录 `plugins/` 不参与宿主代码扫描。完整规范见 [插件系统规范](plugin-system.md)。

插件可变行为必须优先设计为配置项。插件安装后的默认配置写在宿主项目 `config/autoload/plugins.php` 的 `installed.<plugin>.defaults`，项目覆盖配置写在 `config.<plugin>`，插件代码通过 `PluginConfigRepository` 获取合并后的配置。这样开发者可以调整插件能力而不修改插件源码，后续升级插件时保留项目配置即可。

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

第一版插件主要面向开发者，不做后台运行时动态插件管理。启用和禁用通过宿主项目 `config/autoload/plugins.php` 控制，变更后走正常发布流程。

## 18. Web 管理端架构

Web 管理端采用自研模块化前端底座，复用 Ant Design 6 和 ProComponents 3 的成熟后台组件能力。Ant Design Pro v6 作为布局、主题和交互体验参考，不作为工程底座；MineAdmin 作为模块化、插件化、菜单权限、CRUD 工作流和后台工作区体验参考。

后端与前端的边界如下：

- 后端负责菜单、权限、按钮、接口元数据的注册和运行时配置。
- 前端 manifest 负责 `path -> component`、locales、图标和前端扩展能力。
- 后端 menu-tree 下发 `path`、`i18n`、fallback `title` 和 icon key，前端根据 path 匹配页面组件。
- 权限点由后端注册和校验，前端只消费 `/api/admin/auth/me` 返回的 permissions 控制按钮显示。
- 错误 message 由后端按 `Accept-Language` 返回，前端默认展示 message 并保留按 code 特殊处理能力。
Web 管理端的完整架构、目录、配置、模块、插件、CRUD、布局、WorkspaceViewport、国际化、Mock、测试和第一版落地范围见 [前端架构](../frontend/index.md)。

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

## 21. 流式进度事件

TrueAdmin 默认提供请求绑定型流式响应能力，用于长耗时请求、批量操作、复杂流程和未来 AI 流式输出。第一版只做框架底层简单支持，不做后台任务、任务中心、断线续看或 WebSocket。

核心设计是“普通执行方法 + 进度事件 + 注解声明可流式”：Service 方法本身仍然是普通 PHP 方法，不返回 SSE，不感知 HTTP 连接。需要暴露内部进度时，执行方法通过 `App\Foundation\Stream\StreamProgress` 抛出进度事件；Controller 方法通过 `#[Streamable]` 声明支持流式响应。普通请求仍返回原 JSON；客户端请求头包含 `Accept: text/event-stream`、`X-Stream-Response: 1` 或参数 `_stream=1` 时，框架 AOP 自动把 Controller 方法包裹成 SSE。

示例：

```php
use App\Foundation\Stream\StreamProgress;

final class DemoService
{
    public function execute(): array
    {
        StreamProgress::progress('开始处理', module: 'demo', stage: 'start');
        // normal business logic
        StreamProgress::progress('处理完成', module: 'demo', stage: 'finish', percent: 100);

        return ['ok' => true];
    }
}
```

Controller 方法保持普通写法，只增加 `#[Streamable]`：

```php
use TrueAdmin\Kernel\Http\Attribute\Streamable;

#[Streamable]
public function run(): array
{
    return ApiResponse::success($this->demoService->execute());
}
```

流式响应协议采用 OpenAI 风格 SSE data 块：

```text
data: {"type":"progress","message":"开始处理","module":"demo"}

data: {"type":"result","message":"success","response":{"code":"SUCCESS","message":"success","data":{"ok":true}}}

data: {"type":"completed","message":"处理完成"}

data: [DONE]
```

异常时先发送结构化 `error` 块，`error.response` 使用普通接口相同的 `ApiResponse::fail()` 结构，再发送 `[DONE]`。前端主动断开或网络中断时，本次请求停止处理；框架不负责后台继续执行。复杂的后台任务、任务日志、断线续看和补偿机制后续由插件扩展。

编码规范：执行步骤较多、耗时较长、需要日志或调试可观测性的业务方法，应优先使用 `StreamProgress::progress()` 暴露内部状态。这个事件不只服务 SSE，也会分发到 Hyperf 事件系统，后续日志、调试面板或插件可以监听同一个 `StreamProgressEvent`。没有流式监听器时，进度事件应退化为无副作用调用，监听器异常也不应改变原业务方法结果。

运行规范：`#[Streamable]` 依赖 Hyperf AOP 代理文件。`composer dump-autoload` 会通过脚本清理 `runtime/container`，因此不要在 Hyperf 服务运行中执行该命令。修改注解、Aspect、插件扫描路径或执行 `composer dump-autoload` 后，必须重启 Hyperf，避免运行中的 worker 引用已被删除的代理文件而出现偶发 `KERNEL.SERVER.INTERNAL_ERROR`。

## 22. 演进路线

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

## 23. 决策总结

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
