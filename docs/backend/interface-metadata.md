# 接口元数据体系设计

TrueAdmin 的接口元数据体系用于统一描述后台、用户端和开放平台接口的路由、权限、菜单按钮、操作日志、数据权限和 OpenAPI 信息。

它不是一个万能 `OA` 注解，而是一组职责单一的 Attribute，加上后续的元数据扫描器、模块清单和数据库同步机制。

核心原则：

```text
Attribute 负责贴近代码的事实声明。
MetadataScanner 负责扫描和聚合。
模块清单负责安装、升级、生成器和 AI 理解，但不承载运行时路由和错误码注册。
数据库负责运行时真实状态。
```

第一版已经提供 kernel 级 Attribute，并启用注解路由注册。当前业务运行路由以 Controller Attribute 为准，全局 `config/routes.php` 只保留框架入口和少量兜底路由。

## 为什么不用单个 OA 注解

不推荐把路由、权限、菜单、日志、OpenAPI 全部塞进一个注解：

```php
#[OA(method: 'GET', path: '/products', permission: 'product:list', menu: '商品管理')]
```

这种写法短期快，长期会变成巨型注解。字段越加越多，边界越来越模糊，也不利于局部替换。

TrueAdmin 使用多注解组合：

```php
#[AdminGet('/products', name: 'product.list')]
#[Permission('product:list', title: '商品列表')]
#[MenuButton('product:list', title: '查询', parent: 'product')]
#[DataScope(onlyTables: ['products'])]
#[OperationLog(module: 'product', action: 'list', remark: '查询商品列表')]
#[OpenApi(summary: '商品列表', response: ProductVo::class)]
public function list(): array
{
}
```

## Attribute 分组

### 路由元数据

控制器分组：

```php
#[AdminController(path: '/api/admin/products', title: '商品管理', tags: ['商品'])]
#[ClientController(path: '/api/v1/client/products', title: '商品')]
#[OpenController(path: '/api/v1/open/products', title: '开放商品接口')]
```

方法路由：

```php
#[AdminGet('', name: 'product.list')]
#[AdminPost('', name: 'product.create')]
#[AdminPut('{id}', name: 'product.update')]
#[AdminDelete('{id}', name: 'product.delete')]

#[ClientGet('', name: 'client.product.list')]
#[ClientPost('', name: 'client.product.create')]

#[OpenGet('', name: 'open.product.list')]
#[OpenPost('', name: 'open.product.create')]
```

Admin、Client、Open 必须分开注解，不用单个 `Route` 通过参数区分。这样可以避免身份边界和 API 前缀混在一起。

当前这些路由注解会参与运行时路由注册。默认规则为：

```text
框架全局路由 > 业务注解路由
```

Controller 注解的 `path` 是完整控制器资源路径；方法注解的 `path` 默认是资源内相对路径。若方法注解的 `path` 以 `/` 开头，则视为完整路由路径，不再拼接 Controller `path`，用于极少数兼容旧接口或跨资源动作。

```php
#[AdminController(path: '/api/admin/products')]
final class ProductController extends AdminController
{
    #[AdminGet('')]
    public function list(): array
    {
    }

    #[AdminPut('{id}')]
    public function update(int $id): array
    {
    }

    #[AdminPost('/api/admin/products/{id}/publish')]
    public function publish(int $id): array
    {
    }
}
```

推荐控制器方法名和权限动作保持一致，例如 `product:list -> list()`、`product:create -> create()`、`product:update -> update()`、`product:delete -> delete()`。这样权限元数据、OpenAPI `operationId`、代码生成和 AI 续写都能对齐同一套动作语言。

### 权限元数据

```php
#[Permission('product:list', title: '商品列表', group: '商品管理')]
```

规则：

- `code` 必须全局唯一。
- 后台接口默认应声明权限，除非明确 `public: true`。
- 权限注解用于生成权限默认清单和接口权限元数据。
- 运行时角色授权以数据库为准。

权限注册和权限校验是两层概念：数据库只注册原子权限点，接口校验可以使用权限规则。

```php
#[Permission('system:user:update', title: '编辑用户')]
public function update(): array
{
}

#[Permission(anyOf: ['system:user:update', 'system:user:manage'], title: '重置密码')]
public function resetPassword(): array
{
}

#[Permission(allOf: ['system:role:update', 'system:role:authorize'], title: '保存并授权')]
public function saveAndAuthorize(): array
{
}
```

规则含义：

- `code`：单权限，等价于必须拥有这个原子权限点。
- `anyOf`：拥有任意一个原子权限点即可访问。
- `allOf`：必须同时拥有全部原子权限点才能访问。
- `code`、`anyOf`、`allOf` 三者只能使用一个；复杂业务授权交给 Policy 或 Service。
- 同一个类或方法只允许声明一个 `#[Permission]`，不要通过重复注解表达多权限。
- `anyOf/allOf` 本身不会注册成数据库权限点，也不会生成 `A OR B` 这种组合权限。
- `anyOf/allOf` 引用的每个权限码必须已经被菜单、按钮或单权限 `#[Permission('code')]` 定义为原子权限点，否则元数据扫描直接报错。

元数据输出会同时提供两类数据：

```text
permissions      原子权限点清单，用于注册和角色授权。
permissionRules  接口权限规则，用于运行时校验、OpenAPI 和 AI 理解。
```

### 菜单按钮元数据

```php
#[MenuButton('product:create', title: '新增', parent: 'product', permission: 'product:create')]
```

菜单树不建议完全靠接口注解生成。菜单目录和菜单页面仍优先使用 `menus.php` 或后台数据库维护。

`MenuButton` 只适合描述接口附近的按钮权限默认资产，例如查询、新增、编辑、删除、导出。

### OpenAPI 元数据

```php
#[OpenApi(
    summary: '商品列表',
    description: '分页查询商品数据',
    request: ProductQueryRequest::class,
    response: ProductVo::class,
    tags: ['商品管理'],
    security: ['admin'],
    errorCodes: ['KERNEL.AUTH.UNAUTHORIZED', 'KERNEL.REQUEST.VALIDATION_FAILED'],
)]
```

OpenAPI 注解不直接负责路由注册，只负责接口文档元数据。

### 治理类元数据

已有 kernel 能力继续沿用：

```php
#[DataScope(onlyTables: ['products'])]
#[OperationLog(module: 'product', action: 'create', remark: '新增商品')]
```

数据权限第一版主要用于 Admin。Client 端通常使用业务授权策略，不套后台数据权限模型。

`DataScope`、`OperationLog` 的 Attribute、Context、Event 和 AOP 原语位于 `packages/kernel`。真正依赖后台表结构的权限策略、日志落库和后台配置仍然位于 `Module/System`。

## 模块清单和数据库关系

模块清单不是运行时真相。

```text
module.php / menus.php / permissions.php / metadata.json
= 模块出厂默认资产、安装升级资产、生成器资产、AI 理解资产

admin_menus / admin_permissions / admin_role_*
= 运行时真实菜单、权限和授权状态
```

同步策略：

- 新增清单项：插入数据库。
- 已存在清单项：默认不覆盖用户修改的标题、图标、排序、隐藏状态。
- 删除清单项：标记 deprecated 或提示管理员处理，不自动硬删。
- 权限点变更：补齐权限点，不重置角色授权。
- `--force` 才允许覆盖部分字段。
- 同步记录模块名、来源、版本和最近同步时间。

## 元数据扫描器规划

后续新增 `MetadataScanner`，扫描 Controller、Service 和模块清单，输出统一接口元数据。

建议命令：

```bash
php bin/hyperf.php trueadmin:metadata
php bin/hyperf.php trueadmin:metadata:export
php bin/hyperf.php trueadmin:module:sync Product
```

扫描结果包含：

```text
routes
permissions
menu_buttons
operation_logs
data_scopes
openapi
frontend_api_types
ai_context
```

生产环境建议使用缓存或导出文件，避免每次启动动态扫描带来不确定性。

## 冲突规则

启动期或扫描期必须显式报错：

- 重复路由方法和路径。
- 重复路由 name。
- 重复权限 code。
- 重复菜单 code。
- Admin / Client / Open 注解混用在错误控制器上。
- 注解声明的 Request / Response 类不存在。

不要静默覆盖元数据。

## 第一版落地范围

当前已提供 Attribute 类作为设计契约：

```text
TrueAdmin\Kernel\Http\Attribute\AdminController
TrueAdmin\Kernel\Http\Attribute\ClientController
TrueAdmin\Kernel\Http\Attribute\OpenController
TrueAdmin\Kernel\Http\Attribute\AdminGet / AdminPost / AdminPut / AdminDelete
TrueAdmin\Kernel\Http\Attribute\ClientGet / ClientPost / ClientPut / ClientDelete
TrueAdmin\Kernel\Http\Attribute\OpenGet / OpenPost / OpenPut / OpenDelete
TrueAdmin\Kernel\Http\Attribute\Permission
TrueAdmin\Kernel\Http\Attribute\MenuButton
TrueAdmin\Kernel\Http\Attribute\OpenApi
```

当前不做：

- 不自动注册注解路由。
- 不自动同步菜单和权限到数据库。
- 不自动生成 OpenAPI。

下一步才实现 `MetadataScanner`，先扫描输出清单，再逐步接入注解路由注册和模块同步。
