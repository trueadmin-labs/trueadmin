# 后端 Composer 包抽取检查

本文档记录后端哪些能力应该进入 Composer 包，哪些必须留在模板应用。TrueAdmin 后端基于 Hyperf，因此 `trueadmin/kernel` 可以依赖 Hyperf 组件；边界重点不是“是否依赖 Hyperf”，而是“是否依赖宿主业务事实”。

## 总体结论

第一阶段继续强化一个 `trueadmin/kernel`，暂不拆多个 Composer 包。

原因：

- 当前框架能力还在快速收口，过早拆 `trueadmin/crud`、`trueadmin/plugin-runtime`、`trueadmin/metadata` 会增加版本联动成本。
- 这些能力都服务同一套 Hyperf 后端框架内核，放在 `kernel` 中更利于模板快速升级。
- 后续当某个子域变大、发布节奏不同、依赖明显不同，再从 `kernel` 拆二级包。

## 判断标准

可以进 `trueadmin/kernel`：

- 依赖 Hyperf 但不依赖宿主业务模块。
- 不读取 `Module/System` 的表结构、Repository、Service。
- 不要求项目修改包源码才能适配。
- 输入输出协议稳定，能通过接口、配置或继承扩展。
- 对 Admin、Client、Open 或插件都有复用价值。

必须留在模板或模块：

- 依赖后台管理员、角色、菜单、部门、文件表、通知表等具体业务表。
- 承载项目默认业务流程。
- 读取项目私有配置或供应商配置。
- 只是当前模板的组织方式，还没有稳定扩展协议。

## P0：已进入 kernel，模板已切换

当前 `trueadmin-kernel` 已推送：

```text
v0.1.1  CRUD / HTTP / Pagination 原语
v0.1.2  Hyperf 后端运行时服务
v0.1.3  路由命令补齐
v0.1.5  CRUD QueryApplier
v0.1.6  DataPolicy runtime
v0.1.7  HTTP controller defaults / exception handler
v0.1.8  Permission middleware runtime
v0.1.9  Service helper base
v0.1.10 Remaining foundation primitives
v0.1.11 Repository typing and CRUD boundary cleanup
```

模板后端已切到 `trueadmin/kernel ^0.1.11`，并直接使用 Packagist 解析，不再保留临时 GitHub VCS repository。模板应用不能依赖本地 path repository 或临时 VCS repository，否则开源用户初始化项目时会得到不可复现的依赖解析结果。

### CRUD 协议值对象

当前状态：

- `trueadmin-kernel/src/Crud/*` 已新增。
- 模板已删除 `backend/app/Foundation/Crud/*` 重复定义。

已处理：

- 模板后端改用 `TrueAdmin\Kernel\Crud`。
- 删除 `backend/app/Foundation/Crud/*`。
- `CrudQueryRequest` 和 `AbstractRepository` 同步切换 import。

### 分页结果

当前状态：

```text
trueadmin-kernel/src/Pagination/PageResult.php
```

模板已删除：

```text
backend/app/Foundation/Pagination/PageResult.php
```

理由：分页响应是 CRUD/API 协议的一部分，不依赖业务表。前端 `@trueadmin/web-core/http` 已经有 `PageResult` 类型，后端应有同名标准值对象。

### API 响应 envelope

当前状态：

```text
trueadmin-kernel/src/Http/ApiResponse.php
```

模板已删除：

```text
backend/app/Foundation/Support/ApiResponse.php
```

理由：`code/message/data` 是框架 API 协议，不是项目私有实现。进入 kernel 后，异常处理、SSE 错误响应、Controller 基类都能复用同一份输出结构。

### FormRequest 基类

当前状态：

```text
trueadmin-kernel/src/Http/Request/FormRequest.php
```

模板已删除：

```text
backend/app/Foundation/Http/Request/FormRequest.php
```

理由：当前只是在 Hyperf FormRequest 上增加 `authorize=true` 和 `normalize()`，是标准框架输入契约能力。

### CRUD Query Request

当前状态：

```text
trueadmin-kernel/src/Crud/CrudQueryRequest.php
```

模板已删除：

```text
backend/app/Foundation/Http/Request/CrudQueryRequest.php
```

理由：它实现的是标准 `page/pageSize/keyword/filters[n]/sorts[n]/params[key]` 协议解析和校验，不依赖业务模块。进入 kernel 后，Admin、Client、Open 列表接口都能复用。

注意：字段白名单不在 Request 里做。Request 只校验协议形态；Repository/QueryApplier 负责按资源白名单拒绝未知字段。

## P1：已进入 kernel，模板已切换

### Attribute 路由注册

当前状态：

```text
trueadmin-kernel/src/Http/Routing/AttributeRouteRegistrar.php
trueadmin-kernel/src/Http/Command/TrueAdminRoutesCommand.php
```

模板已删除：

```text
backend/app/Foundation/Http/Routing/AttributeRouteRegistrar.php
backend/app/Foundation/Http/Command/TrueAdminRoutesCommand.php
```

理由：它只依赖 Hyperf Router 和 kernel 里的路由 Attribute，不依赖业务模块。模板 `config/routes.php` 应只调用 kernel registrar。

### 接口元数据扫描与 OpenAPI 生成

当前状态：

```text
trueadmin-kernel/src/Metadata/InterfaceMetadataScanner.php
trueadmin-kernel/src/Metadata/OpenApiDocumentBuilder.php
trueadmin-kernel/src/Metadata/MetadataSynchronizer.php
trueadmin-kernel/src/Metadata/MetadataMenuRepositoryInterface.php
trueadmin-kernel/src/Metadata/Command/*
```

模板已删除同名 Foundation 类。具体菜单入库实现继续留在 `Module/System`。

理由：扫描 Attribute、读取模块和插件 `resources/menus.php`、生成 OpenAPI 都是框架运行时能力。具体表结构和同步落库由宿主实现接口。

### 模块迁移和 Seeder 路径注册

当前状态：

```text
trueadmin-kernel/src/Database/ModuleMigrationLocator.php
trueadmin-kernel/src/Database/Listener/RegisterMigrationPathsListener.php
trueadmin-kernel/src/Database/Listener/RegisterSeederPathsListener.php
trueadmin-kernel/src/Database/Command/TrueAdminMigrationPathsCommand.php
trueadmin-kernel/src/Database/Seeder/NamespacedSeed.php
```

模板已删除同名 Foundation 类。

理由：模块/插件迁移目录发现和注册是框架级运行时能力，不依赖业务表。宿主只需要提供插件仓库或配置。

### 插件后端 runtime 读取

当前状态：

```text
trueadmin-kernel/src/Plugin/Plugin.php
trueadmin-kernel/src/Plugin/PluginRepository.php
trueadmin-kernel/src/Plugin/PluginConfigRepository.php
```

模板已删除同名 Foundation 类。

理由：注意这里不是插件安装命令。安装/同步仍属于框架级 Node/npm CLI；但后端运行时读取端内 `config/autoload/plugins.php` 是 Hyperf 后端运行时能力，可以进 kernel。

### 模块翻译加载

当前状态：

```text
trueadmin-kernel/src/I18n/ModuleTranslationLoader.php
trueadmin-kernel/src/I18n/ModuleTranslationLoaderFactory.php
trueadmin-kernel/src/I18n/Middleware/LocaleMiddleware.php
```

模板已删除同名 Foundation 类。

理由：模块和插件语言包加载是框架级能力。具体语言文件仍留在模块、插件和宿主项目。

### SSE / Streamable

当前状态：

```text
trueadmin-kernel/src/Stream/*
```

模板已删除同名 Foundation 类。

理由：`#[Streamable]` 已在 kernel，AOP 和 SSE responder 留在模板会割裂能力。它依赖 Hyperf/Swoole，但不依赖业务表，适合进入 kernel。

## P2：小件进入 kernel，模板组合使用

### AbstractRepository

当前状态：

```text
backend/app/Foundation/Repository/AbstractRepository.php
```

不建议整体进入 kernel。

原因：

- 它混合了基础 Model helper、CRUD 查询应用、数据权限 helper、分页 helper、pivot helper。
- 直接抽整个类会把宿主 Repository 继承链锁死，后续不好拆。

已抽出小件：

```text
trueadmin-kernel/src/Crud/CrudQueryApplier.php
trueadmin-kernel/src/Crud/CrudQueryApplierOptions.php
```

模板 `AbstractRepository` 通过 `CrudQueryApplierOptions` 把关键词字段、过滤白名单、排序白名单、列映射和默认排序传给 kernel applier。模板仍保留 `applyParams()`、`applyFilterCondition()`、`applySortRule()`、`filterColumn()`、`sortColumn()` 等 protected 扩展点，项目可以覆盖模板方法，不需要改 composer 包源码。

### DataPolicyManager / DataPolicyRegistry

当前状态：

```text
trueadmin-kernel/src/DataPermission/DataPolicyProviderInterface.php
trueadmin-kernel/src/DataPermission/DataPolicyStrategyInterface.php
trueadmin-kernel/src/DataPermission/DataPolicyManager.php
trueadmin-kernel/src/DataPermission/DataPolicyRegistry.php
```

模板已删除同名 Foundation runtime。

理由：

- `DataPolicyStrategyInterface` 和 `DataPolicyProviderInterface` 是框架数据权限契约。
- `DataPolicyManager` 和 `DataPolicyRegistry` 不依赖 System 表，只依赖 provider 接口、配置和资源文件。
- 模块和插件通过自己的 `resources/data_policies.php` 注册资源和策略，仍符合端内事实文件边界。

保留在 `Module/System`：

- `AdminRoleDataPolicyProvider`
- 组织/部门策略具体实现
- 数据权限落库、角色授权页面相关业务

### AppExceptionHandler

当前状态：

```text
trueadmin-kernel/src/Exception/TrueAdminExceptionHandler.php
```

模板已删除 `backend/app/Foundation/Exception/AppExceptionHandler.php`。

理由：`BusinessException`、`ValidationException` 和未知异常的 API envelope 输出是框架默认协议。项目如需改变日志策略、debug trace 或字段格式，可以继承 `TrueAdminExceptionHandler` 并在 `config/autoload/exceptions.php` 替换。

### Controller 基类

当前状态：

```text
trueadmin-kernel/src/Http/Controller/AbstractController.php
trueadmin-kernel/src/Http/Controller/AdminController.php
trueadmin-kernel/src/Http/Controller/ClientController.php
trueadmin-kernel/src/Http/Controller/OpenController.php
trueadmin-kernel/src/Http/Controller/OpenApiController.php
```

模板已删除空壳 Controller 基类和 OpenAPI Controller，只保留项目默认 `HealthController`。

理由：`stream()` helper、Admin/Client/Open 语义基类和 OpenAPI 输出都不依赖业务表，属于框架 HTTP 默认能力。模块业务 Controller 仍留在各自模块。

### PermissionMiddleware

当前状态：

```text
trueadmin-kernel/src/Http/PermissionProviderInterface.php
trueadmin-kernel/src/Http/Middleware/PermissionMiddleware.php
```

模板已删除：

```text
backend/app/Foundation/Contract/AdminPermissionProviderInterface.php
backend/app/Foundation/Http/Middleware/PermissionMiddleware.php
```

理由：`#[Permission]` 已在 kernel，路由权限解析、single/anyOf/allOf 校验和 forbidden 响应属于框架 HTTP 运行时。kernel 契约只保留 `PermissionProviderInterface::can()`；后台菜单树、权限点列表、角色权限聚合继续留在 `Module/System`。

### AbstractService

当前状态：

```text
trueadmin-kernel/src/Service/AbstractService.php
```

模板已删除：

```text
backend/app/Foundation/Service/AbstractService.php
```

理由：当前 `AbstractService` 只提供 `assertUnique()`、`assertExistingIds()`、`notFound()` 这类基于 kernel `BusinessException` / `ErrorCode` 的稳定 helper，不依赖业务表。业务 Service 本身仍留在模块，不进入 Composer 包。

### Foundation 剩余原语

当前状态：

```text
trueadmin-kernel/src/Context/ActorFactory.php
trueadmin-kernel/src/Database/AfterCommitCallbacks.php
trueadmin-kernel/src/Database/Listener/RunAfterCommitCallbacksListener.php
trueadmin-kernel/src/Database/Model.php
trueadmin-kernel/src/Support/Password.php
trueadmin-kernel/src/Support/TreeHelper.php
trueadmin-kernel/resources/lang/en/errors.php
trueadmin-kernel/resources/lang/zh_CN/errors.php
```

模板已删除同名 Foundation 类和 Foundation 语言包。

理由：

- `ActorFactory` 只负责从 Hyperf context 读取当前 actor，不依赖后台用户表或 System 模块。
- `AfterCommitCallbacks` 和 listener 是事务生命周期 helper，可被任何模块复用。
- Model 基类只承载 Hyperf Model 通用行为，不包含业务表事实。
- `Password` 和 `TreeHelper` 是稳定支持类，业务模块、System 模块和插件都可能复用。
- `KERNEL.*` 通用错误文案属于 kernel，项目根级 `resources/lang` 只作为最终覆盖层。

## 不应进入 Composer 包

以下内容保持在模板或模块：

- `Module/Auth`、`Module/System` 的所有业务 Service、Repository、Model、Controller。
- 菜单、角色、权限、部门、通知、文件等具体表结构。
- 文件上传业务 API 和 OSS/local 存储配置。
- JWT 配置、数据库配置、Redis 配置、日志配置。
- 插件安装/同步命令。该能力属于框架级 Node/npm CLI，不属于后端 Composer 命令。

## 当前执行状态

1. 已发布 `trueadmin/kernel v0.1.1`、`v0.1.2`、`v0.1.3`、`v0.1.4`、`v0.1.5`、`v0.1.6`、`v0.1.7`、`v0.1.8`、`v0.1.9`、`v0.1.10` Git tag。
2. 模板已改用 kernel CRUD 值对象，已删除 `Foundation/Crud`。
3. `PageResult`、`ApiResponse`、`FormRequest`、`CrudQueryRequest` 已抽到 kernel，模板已删除重复实现。
4. `AttributeRouteRegistrar` 和 routes 命令已抽到 kernel，模板已删除重复实现。
5. 插件 runtime、模块 migration/seeder locator、模块翻译 loader 已抽到 kernel，模板已删除重复实现。
6. Metadata scanner/OpenAPI builder 已抽到 kernel，菜单入库接口由 `Module/System` 实现。
7. SSE/Streamable runtime 已抽到 kernel，模板已删除重复实现。
8. `CrudQueryApplier` 已抽到 kernel，模板 `AbstractRepository` 改为组合使用。
9. DataPolicy runtime 已抽到 kernel，System 只保留后台角色 provider 和组织策略。
10. Controller 默认基类、OpenAPI Controller 和默认 ExceptionHandler 已抽到 kernel。
11. Permission middleware runtime 已抽到 kernel，System 只保留后台权限事实服务。
12. Service helper base 已抽到 kernel，模块业务 Service 只继承稳定 helper。
13. ActorFactory、AfterCommit callbacks、Model 基类、Password、TreeHelper 和 kernel 语言包已抽到 kernel。
14. Foundation 当前保留模板 `HealthController`、`AbstractRepository` 和模板默认组织数据权限策略。组织策略不依赖 System；System 只实现部门树数据来源接口。
