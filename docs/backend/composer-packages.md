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
```

模板后端已切到 `trueadmin/kernel ^0.1.6`。由于 Packagist 可能不会立即同步新 tag，`backend/composer.json` 临时保留 GitHub VCS repository，避免使用 `dev-main` 或本地 path repository。Packagist 同步 `v0.1.6` 后应删除该 VCS repository 配置。

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

候选：

```text
backend/app/Foundation/Exception/AppExceptionHandler.php
```

建议暂留模板。

原因：异常日志策略、是否隐藏错误、是否返回 debug trace、字段格式都可能是项目偏好。等 `ApiResponse` 进入 kernel 后，可以再提供 `TrueAdminExceptionHandler` 作为默认实现，模板允许替换。

### Controller 基类

候选：

```text
backend/app/Foundation/Http/Controller/*
```

kernel 已有 `AbstractController`。模板里的 `Controller` 目前只增加 `stream()`，应在 Stream 能力进入 kernel 后再评估是否删除模板层。`AdminController`、`ClientController`、`OpenController` 可以继续作为模板语义别名保留。

## 不应进入 Composer 包

以下内容保持在模板或模块：

- `Module/Auth`、`Module/System` 的所有业务 Service、Repository、Model、Controller。
- 菜单、角色、权限、部门、通知、文件等具体表结构。
- 文件上传业务 API 和 OSS/local 存储配置。
- JWT 配置、数据库配置、Redis 配置、日志配置。
- 插件安装/同步命令。该能力属于框架级 Node/npm CLI，不属于后端 Composer 命令。

## 当前执行状态

1. 已发布 `trueadmin/kernel v0.1.1`、`v0.1.2`、`v0.1.3`、`v0.1.4`、`v0.1.5`、`v0.1.6` Git tag。
2. 模板已改用 kernel CRUD 值对象，已删除 `Foundation/Crud`。
3. `PageResult`、`ApiResponse`、`FormRequest`、`CrudQueryRequest` 已抽到 kernel，模板已删除重复实现。
4. `AttributeRouteRegistrar` 和 routes 命令已抽到 kernel，模板已删除重复实现。
5. 插件 runtime、模块 migration/seeder locator、模块翻译 loader 已抽到 kernel，模板已删除重复实现。
6. Metadata scanner/OpenAPI builder 已抽到 kernel，菜单入库接口由 `Module/System` 实现。
7. SSE/Streamable runtime 已抽到 kernel，模板已删除重复实现。
8. `CrudQueryApplier` 已抽到 kernel，模板 `AbstractRepository` 改为组合使用。
9. DataPolicy runtime 已抽到 kernel，System 只保留后台角色 provider 和组织策略。
