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

## 数据权限

数据权限参考 MineAdmin 的思路：业务方法通过 `#[DataScope]` 声明数据范围，底层通过 AOP 在当前协程上下文中记录数据权限配置，后续查询构建器或 Repository 根据上下文追加查询条件。

示例：

```php
use TrueAdmin\Kernel\DataPermission\Attribute\DataScope;
use TrueAdmin\Kernel\DataPermission\ScopeType;

final class ProductQueryService
{
    #[DataScope(onlyTables: ['products'], scopeType: ScopeType::DEPARTMENT_CREATED_BY)]
    public function list(): array
    {
        // Repository 会读取 DataPermission Context 并追加查询约束。
        return $this->productRepository->listForExample();
    }
}
```

第一阶段先建立 Attribute、Aspect 和上下文机制。后续接入真实用户、部门、角色和数据权限表后，再把查询条件注入逻辑补完整。

## 操作日志

操作日志也采用声明式方式：业务方法使用 `#[OperationLog]` 声明模块、动作和备注，AOP 在方法执行成功后发布事件，监听器负责写日志。

示例：

```php
use TrueAdmin\Kernel\OperationLog\Attribute\OperationLog;

final class ProductQueryService
{
    #[OperationLog(module: 'product', action: 'list', remark: '查询商品列表')]
    public function list(): array
    {
        // Repository 会读取 DataPermission Context 并追加查询约束。
        return $this->productRepository->listForExample();
    }
}
```

这个设计让日志写入和业务方法解耦。后续可以把日志监听器从写文件升级为写 `admin_operation_logs` 表，业务代码不用变。

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
