# 配置模式与注解模式规范

TrueAdmin 同时支持配置模式和注解模式，但两者职责不同。

核心原则：

```text
框架本身优先配置模式。
业务开发优先注解模式。
模块资产优先模块清单。
复杂逻辑必须落到代码类中。
```

这样做的目的不是制造两套体系，而是让框架可控、业务高效、模块自包含。

## 为什么框架优先配置模式

框架级能力通常影响应用启动、运行环境、全局装配和部署行为。它们需要显式、稳定、可审查，也需要开发者可以只改配置就完成替换。

适合配置模式的能力：

- 数据库、Redis、JWT、日志、异常处理。
- 全局扫描路径。
- 全局命令注册。
- 全局中间件组合。
- 模块扫描器、路由注册器、迁移路径注册器。
- 可被项目覆盖的 Foundation 默认行为。

示例：

```text
config/autoload/databases.php
config/autoload/redis.php
config/autoload/jwt.php
config/autoload/exceptions.php
config/autoload/commands.php
config/routes.php
```

框架配置应尽量保持少而清晰。不要把业务规则、业务权限、业务菜单塞进全局配置。

## 为什么业务优先注解模式

业务能力通常和某个类、某个接口、某个方法强绑定。注解能让声明离代码更近，AI 和开发者打开方法时就知道这个接口有什么横切能力。

适合注解模式的能力：

- 权限点，例如 `#[Permission('product:list')]`。
- 操作日志，例如 `#[OperationLog]`。
- 数据权限，例如 `#[DataScope]`。
- 事件监听，例如 `#[Listener]`。
- 定时任务，例如 `#[Crontab]`。
- OpenAPI 接口摘要和参数声明。
- 业务路由快捷声明。

注解只做声明，不写复杂业务规则。复杂规则仍然进入 Service、Repository、Policy、Action 或独立业务类。

## 模块清单负责什么

有些内容不是框架装配，也不适合散落在方法注解里，它们属于模块资产。

适合模块清单的能力：

- 菜单。
- 权限分组。
- 模块基本信息。
- 生成器元数据。
- OpenAPI 聚合文件。
- llms.txt 和 AI 开发提示。

推荐位置：

```text
Module/Xxx/module.php
Module/Xxx/menus.php
Module/Xxx/permissions.php
Module/Xxx/openapi.json
Module/Xxx/llms.txt
```

模块清单应该可以被扫描和导入，但不应该承载复杂业务判断。

## 路由双模式

路由支持配置模式和注解模式，但业务模块默认使用注解模式。

配置模式用于框架入口和极少数非常规路由兜底。业务模块不再默认维护 `routes.php`，避免每个模块都多一个配置文件概念。

推荐结构：

```text
backend/config/routes.php
backend/app/Module/Product/Http/Admin/Controller/ProductController.php
backend/app/Module/Product/Http/Client/Controller/V1/ProductController.php
```

`config/routes.php` 只保留框架入口、OpenAPI 入口和注解路由注册器：

```php
Router::addRoute(['GET', 'POST', 'HEAD'], '/', HealthController::class . '@index');
$attributeRouteRegistrar->register();
```

业务模块在 Controller 上声明路由：

```php
#[AdminController(path: '/api/admin/products', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
final class ProductController extends AdminController
{
    #[AdminGet('', name: 'product.list')]
    #[Permission('product:list', title: '商品列表', group: '商品管理')]
    public function list(): array
    {
    }
}
```

只需要后台登录态、不需要角色权限码的接口只挂认证中间件，不写 `#[Permission]`：

```php
#[AdminController(path: '/api/admin/profile', middleware: [AdminAuthMiddleware::class])]
final class ProfileController extends AdminController
{
    #[AdminGet('')]
    public function detail(): array
    {
    }
}
```

`#[Permission(public: true)]` 不再支持。公开接口应放到 Open 入口；后台 Admin 入口的登录态接口以认证中间件作为边界。

`#[Permission]` 只是接口权限元数据，不会自己参与 HTTP 执行链。需要权限校验的后台路由必须让最终路由 middleware 同时包含 `AdminAuthMiddleware` 和 `PermissionMiddleware`，并且认证中间件在权限中间件之前。通常做法是在整个权限型 Controller 上声明：

```php
#[AdminController(path: '/api/admin/products', middleware: [AdminAuthMiddleware::class, PermissionMiddleware::class])]
```

如果某个 Controller 只有登录态接口，不挂 `PermissionMiddleware`，方法也不写 `#[Permission]`。

Client/Open 同理使用对应端的 Controller 和方法注解：

```php
#[ClientController(path: '/api/v1/client/products')]
final class ProductController extends ClientController
{
    #[ClientGet('')]
    public function list(): array
    {
    }
}
```

路由冲突处理规则：

- 全局 `config/routes.php` 中的显式框架路由优先保留。
- 业务模块默认不写 `routes.php`，避免注解路由与配置路由重复。
- 注解路由必须可导出为路由清单，便于调试和 AI 理解。
- 同一路径和方法重复注册时，启动期应给出明确错误。

第一版已落地注解路由注册。

可使用以下命令查看当前扫描到的注解路由：

```bash
php bin/hyperf.php trueadmin:routes
```

## 推荐矩阵

| 能力 | 推荐模式 | 说明 |
| --- | --- | --- |
| 数据库、Redis、JWT | 配置 | 环境和部署相关 |
| 异常处理、日志、扫描路径 | 配置 | 框架装配相关 |
| 路由 | 注解 + 全局配置兜底 | 业务模块默认注解，框架入口和非常规路由留在全局配置 |
| 全局命令注册 | 配置 | 框架启动期明确注册 |
| 业务命令 | 注解或模块清单 | 归属模块，不放全局目录 |
| 监听器 | 注解 | 使用 Hyperf `#[Listener]`，类放对应职责目录 |
| 定时任务 | 注解 | 业务任务归模块内 `Crontab/`，根 crontab 配置只保留全局开关和框架级兜底 |
| 权限点 | 注解 | 方法声明权限，MetadataScanner 聚合后用于同步和检查 |
| 菜单 | 模块清单 | 菜单是模块资产，不建议散落在方法上 |
| 数据权限 | 注解 | 与查询入口强绑定 |
| 操作日志 | 注解 | 与具体操作强绑定 |
| OpenAPI | 注解 + Schema/Vo | 贴近接口，同时保留结构化输出 |

## AI 开发规则

AI 新增框架基础能力时，应优先问：能不能通过配置替换？如果可以，优先配置模式。

AI 新增业务接口时，应优先问：是否需要权限、日志、数据权限、OpenAPI？如果需要，优先使用注解声明。

AI 新增模块资产时，应优先问：这是菜单、权限分组、模块信息还是生成器元数据？如果是，优先写入模块清单。

不要把业务能力写进全局配置，也不要为了使用注解而隐藏框架启动装配。
