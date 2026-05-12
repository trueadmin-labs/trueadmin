# 后端扩展 API 规范

本文档定义 TrueAdmin 后端框架能力的扩展方式。目标是让开发者在不修改 `trueadmin/kernel` 或模板基础代码的情况下，能通过继承、配置、接口绑定和模块资源文件完成必要定制。

## 总原则

后端扩展只允许沿四类入口发生：

```text
配置文件
接口 / DI 绑定
protected 模板方法
模块或插件自己的 resources 文件
```

不允许的方式：

```text
修改 vendor 里的 Composer 包源码
跨端读取前端、移动端或其他端的配置文件
把 Admin 端业务事实放进 kernel
让 Controller 解析通用 CRUD 协议
让 Service 依赖 HTTP 查询参数形态
```

`trueadmin/kernel` 可以依赖 Hyperf，但不能依赖宿主业务表、`Module/System`、菜单事实或某个端的默认业务流程。`backend/app/Foundation` 是模板默认实现层，可以被项目直接改，也可以作为后续抽包前的稳定实验区。

## CRUD 查询扩展

标准链路：

```text
CrudQueryRequest -> CrudQuery -> Repository::applyCrudQuery()
```

`CrudQueryRequest` 只负责协议形态：

```text
page
pageSize
keyword
filters[n][field]
filters[n][op]
filters[n][value]
sorts[n][field]
sorts[n][order]
sorts[n][nulls]
params[key]
```

字段是否允许查询，不在 Request 判断，由 Repository 或后续 `CrudQueryApplier` 按资源白名单判断。

可覆盖的 Request 扩展点：

```php
rootKeys()
fieldPattern()
decodeOperator()
decodeSortOrder()
decodeFilters()
decodeSorts()
decodeParams()
normalizeValue()
makeCrudQuery()
makeFilterCondition()
makeSortRule()
```

Repository 侧固定执行顺序：

```text
beforeApplyCrudQuery
applyKeyword
applyFilters
applyParams
applySort
afterApplyCrudQuery
```

`applyCrudQuery()` 保持 final，避免子类破坏标准顺序。业务参数扩展统一写在 `applyParams()`，例如左树右表的 `deptId/includeChildren`、快捷筛选、消息中心状态筛选等。

简单列表优先用属性声明：

```php
protected array $keywordFields = ['code', 'name'];
protected array $filterable = [
    'status' => ['eq', 'in'],
    'created_at' => ['between', 'gte', 'lte'],
];
protected array $sortable = ['id', 'created_at'];
protected array $defaultSort = ['id' => 'desc'];
```

需要动态规则时，覆盖方法而不是复制整段查询逻辑：

```php
protected function filterable(): array;
protected function defaultFilterOps(): array|string;
protected function filterColumn(string $field): string;
protected function sortable(): array;
protected function sortColumn(string $field): string;
protected function defaultSort(): array;
```

复杂行为覆盖更细粒度方法：

```php
applyFilterCondition()
applySortRule()
applyDefaultSortRule()
assertFilterable()
assertSortable()
```

## 框架运行时扩展

框架运行时服务可以通过继承或 DI 替换扩展。项目级替换写在 `backend/config/autoload/dependencies.php`。

示例：

```php
return [
    App\Foundation\Metadata\OpenApiDocumentBuilder::class => App\Foundation\Metadata\ProjectOpenApiDocumentBuilder::class,
];
```

已开放的主要运行时扩展点：

```text
AttributeRouteRegistrar
  controller()
  methodMappings()
  mappingAnnotations()
  routePath()

InterfaceMetadataScanner
  resourceMenus()
  menuResourceFiles()
  testingMenuResourceFiles()
  permissions()
  permissionRules()
  openapi()

OpenApiDocumentBuilder
  info()
  servers()
  components()
  operation()

PluginRepository / PluginConfigRepository
  installedPlugins()
  stringList()
  projectConfig()
  mergeRecursive()

DataPolicyRegistry / DataPolicyManager
  dataPolicyResourceFiles()
  normalizeDataPolicyDefinition()
  normalizeScopes()
  normalizeConfigSchema()
  strategy()

ModuleTranslationLoader / ModuleMigrationLocator
  languagePaths()
  existingDirectories()

LocaleMiddleware
  resolveLocale()
  normalizeLocale()
  supportedLocales()
  localeAliases()

PermissionMiddleware
  allows()
  allowsAny()
  allowsAll()
  permissionFromRoute()
```

这些扩展点属于框架默认实现 API。能通过模块 `resources/*.php` 表达的事实，优先放资源文件；只有默认扫描、合并、输出行为不满足时，才覆盖运行时服务。

## 端边界

Admin、Client、Open 是调用端，不是 Composer 包边界。

跨端复用：

```text
CrudQuery / PageResult / ApiResponse
Repository 查询能力
领域 Service
Model / Event / Listener
模块资源扫描协议
插件 runtime 读取协议
```

Admin 端独有：

```text
后台菜单资源
后台权限码
后台身份解析
后台页面查询参数语义
后台管理默认 Repository 和 Service
```

未来 uniapp 第一阶段也是 Admin 管理端，它可以复用 Admin 后端入口，但不能要求后端读取 `web` 或 `mobile` 的配置。插件安装后，每个端只读取自己端内生成的事实文件。

## 抽包判断

可以进入 `trueadmin/kernel`：

```text
稳定协议值对象
不依赖宿主业务表的 Hyperf 运行时服务
可通过配置、接口、继承或 DI 替换的默认实现
Admin / Client / Open 可复用的基础能力
```

先留在模板：

```text
AbstractRepository 整体继承链
具体 System 模块 Repository / Service
菜单、角色、部门、通知等业务表逻辑
项目默认身份解析和权限落库实现
```

当前建议是先把 `CrudQueryRequest`、`PageResult`、`ApiResponse`、FormRequest 和运行时服务逐步抽进 `trueadmin/kernel`；`AbstractRepository` 先拆出更小的 `CrudQueryApplier` 后再进入 Composer 包。
