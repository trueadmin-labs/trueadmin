# 后端注解驱动设计

TrueAdmin 后端会参考 MineAdmin 的 Hyperf 使用方式，多使用 PHP Attribute 和 Hyperf 注解能力来承载横切能力。

这里的目标不是为了“炫技”，而是让后台业务代码更接近真实开发习惯：业务方法保持清晰，权限、日志、监听、数据范围等通用能力通过声明式方式接入。

注解不是替代配置。TrueAdmin 的总体原则是：框架本身优先配置模式，业务开发优先注解模式。完整边界见 [配置模式与注解模式规范](configuration-vs-attribute.md)。

接口元数据注解体系见 [接口元数据体系设计](interface-metadata.md)。该体系用于统一描述路由、权限、菜单按钮、OpenAPI、日志和数据权限；第一版已启用注解路由注册，业务模块不再默认维护 `routes.php`。

## 适合使用注解的能力

推荐使用注解或 Attribute 的能力：

- 数据权限，例如 `#[DataScope]`。
- 操作日志，例如 `#[OperationLog]`。
- 事件监听，例如 `#[Listener]`。
- 中间件，例如 Hyperf 的 Middleware 注解或路由中间件。
- 定时任务，例如 Hyperf Crontab 注解能力。
- 权限点声明，例如未来的 `#[Permission]`。
- OpenAPI 文档生成，例如未来接入 Swagger/OpenAPI 注解。
- 接口元数据，例如 `#[AdminGet]`、`#[Permission]`、`#[MenuButton]`、`#[OpenApi]`。

不推荐用注解承载数据库、Redis、JWT、全局扫描路径、异常处理器等框架装配能力。这些能力应保持配置模式，便于开发者只修改配置就能覆盖框架默认行为。

不建议用注解承载复杂业务规则。复杂业务规则仍然应该写在 Service、Repository、Policy 或独立业务类里。

注解、Request、Service 的职责边界如下：

```text
Attribute  声明路由、权限、菜单、日志、OpenAPI、数据权限等横切元数据
Request    声明 HTTP 入参契约和输入归一化
Service    承载业务编排和跨入口业务不变量
```

不要为了减少文件数量，把 Request 输入校验写进注解，也不要把业务不变量只写进 Request。Controller、Command、Crontab、Queue、Listener 和插件都可能调用同一个 Service，因此真正的业务约束必须留在 Service、Policy 或独立业务类中。

## 数据权限

数据权限参考 MineAdmin 的思路：业务方法通过 `#[DataScope]` 声明数据范围，底层通过 AOP 在当前协程上下文中记录数据权限配置，后续查询构建器或 Repository 根据上下文追加查询条件。

多部门场景下，数据权限计算读取 operator 的可见部门集合。主部门只作为默认操作部门，不应被误用为唯一数据部门。

示例：

```php
use TrueAdmin\Kernel\DataPermission\Attribute\DataScope;
use TrueAdmin\Kernel\DataPermission\ScopeType;

final class AdminUserQueryService
{
    #[DataScope(resource: 'admin_user', action: 'list')]
    public function list(): array
    {
        // Repository 会读取 DataPermission Context 并追加查询约束。
        return $this->adminUserRepository->listForExample();
    }
}
```

第一阶段先建立 Attribute、Aspect 和上下文机制。接入真实用户、部门、角色和数据权限表时，应同时支持：当前操作部门、所属部门集合、所属部门树、角色自定义部门集合和本人创建数据。

## 操作日志

操作日志也采用声明式方式：业务方法使用 `#[OperationLog]` 声明模块、动作和备注，AOP 在方法执行成功后发布事件，监听器负责写日志。

`action` 使用点分层级命名，格式为 `{端}.{资源}.{动作}`，例如 `admin.user.create`、`admin.role.update`、`admin.menu.delete`。不要使用 `admin_user_create` 这类下划线拼接格式。

示例：

```php
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

final class AdminUserController
{
    #[OperationLog(module: 'system', action: 'admin.user.create', remark: '新增管理员用户')]
    public function create(): array
    {
        // 写操作成功后，AOP 会发布 OperationLogged 事件。
        return ApiResponse::success($this->users->create($this->request->all()));
    }
}
```

这个设计让日志写入和业务方法解耦。当前 `Module/System` 已通过 Listener 写入 `admin_operation_logs` 表，记录的是后台侧操作审计；例如管理员维护 `client_users` 时产生的 `client.user.*` 动作仍然属于后台操作审计。后台登录日志由 `Module/Auth` 发布登录事件、`Module/System` 监听写入 `admin_login_logs`。第一版不预留 `client_operation_logs`、`client_login_logs` 空表，等用户端真实写操作审计或登录审计形成事件、监听器、查询接口和后台页面闭环时再加入。后续也可以扩展为写消息队列、审计仓库或日志平台，业务代码不用变。

## 监听器

监听器优先使用 Hyperf 的 `#[Listener]` 注解自动注册。

示例：

```php
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;

#[Listener]
final class WriteOperationLogListener implements ListenerInterface
{
    public function listen(): array
    {
        return [OperationLogged::class];
    }

    public function process(object $event): void
    {
        // 写日志、发通知、统计等副作用。
    }
}
```

业务代码只发布事件，不直接调用监听器。

监听器是否捕获异常取决于事件副作用类型，不要默认 `try/catch`：

- 强一致监听器不捕获异常，或捕获后必须重新抛出，让主流程中断。例如库存扣减、授权关系同步、必须成功的数据修正。
- 旁路监听器可以捕获异常并降级，例如操作日志、登录日志、通知投递、埋点、搜索索引同步。
- 旁路监听器捕获异常后必须写 warning 日志，不能静默失败。
- 如果一个监听器失败会影响业务正确性，就不应该使用“捕获后继续”的写法。

当前 `WriteOperationLogListener`、`WriteAdminLoginLogListener` 属于旁路监听器，允许捕获异常并记录 warning；未来订单、库存、权限同步等关键业务监听器默认应让异常抛出。

## 放置规则

框架级、可复用的注解契约和 AOP 原语放在 `packages/kernel`：

```text
packages/kernel/src/Http/Attribute/Permission.php
packages/kernel/src/Http/Attribute/OpenApi.php
packages/kernel/src/DataPermission/Attribute/DataScope.php
packages/kernel/src/DataPermission/Aspects/DataScopeAspect.php
packages/kernel/src/OperationLog/Attribute/OperationLog.php
packages/kernel/src/OperationLog/Aspects/OperationLogAspect.php
packages/kernel/src/OperationLog/Event/OperationLogged.php
```

依赖后台数据库表的具体实现留在 `Module/System`：

```text
backend/app/Module/System/Listener/Logstash/WriteOperationLogListener.php
backend/app/Module/System/Service/PermissionService.php
backend/app/Module/System/Repository/AdminMenuRepository.php
```

业务模块自己的注解、事件和监听器放在模块内：

```text
backend/app/Module/Order/Http/Common/Event/OrderCreated.php
backend/app/Module/Order/Listener/IncreaseProductSalesListener.php
backend/app/Module/Workflow/Library/Attribute/WorkflowAction.php
```

如果一个能力是稳定契约或通用 AOP 原语，优先放进 `packages/kernel`。如果它依赖具体业务表、菜单权限规则或项目落库策略，留在模块内。

## 与 MineAdmin 的关系

MineAdmin 的启发主要有两点：

- 数据权限可以通过 Attribute + AOP 以声明式方式接入。
- 日志、登录记录、操作记录等副作用可以通过 Event + `#[Listener]` 解耦。

TrueAdmin 会沿用这种 Hyperf 原生风格，但会让目录更适合模块化和 AI 生成代码。

## AI 开发提醒

AI 新增后台接口时应优先判断：

- 是否需要 `#[DataScope]`。
- 是否需要 `#[OperationLog]`。
- 是否需要权限点注解。
- 是否应该发布事件，而不是在 Service 里直接做副作用。
- 监听器是框架级能力还是模块级能力。
- 注解能力是否已经存在，避免重复造一个相似 Attribute。
