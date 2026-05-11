# 黄金 CRUD 模块规范

黄金 CRUD 模块是 TrueAdmin 给 AI 和开发者的标准参考样板。

它的目标不是把 CRUD 变成黑盒，而是让常规后台资源有稳定、可复制、可验证的写法。AI 生成新模块时，优先照这个结构生成，再按业务复杂度做少量扩展。

参考代码位于：

```text
examples/backend/golden-crud
```

示例不会参与运行时自动加载、路由注册、迁移和测试。生成真实模块时，应复制到 `backend/app/Module/<ModuleName>` 并替换命名空间、类名、表名、权限码和操作日志 action。

## 适用场景

适合使用黄金 CRUD 的资源通常具备这些特征：

- 后台管理资源。
- 单表或主表为主。
- 有列表、详情、新增、编辑、删除。
- 有关键字、筛选、排序、分页。
- 有按钮级权限和操作日志。
- 业务规则不复杂，但需要唯一性、状态、删除保护等基础约束。

不适合直接套用的场景：

- 流程审批、订单状态机、支付、库存、消息推送等强业务编排。
- 多聚合事务或跨模块一致性要求很高的业务。
- 树形结构、层级权限、数据权限策略较重的资源。此类资源可以复用 `TreeHelper` 和 Repository 查询协议，但 Service 需要显式表达业务规则。

## 标准目录

```text
Module/Xxx/
  Database/Migrations/
  Http/Admin/Controller/
  Http/Admin/Request/
  Model/
  Repository/
  Service/
```

只创建真实需要的目录。不要为了“完整”而创建空目录。

## 分层职责

### Controller

Controller 只负责 HTTP 边界。

必须包含：

- `#[AdminRouteController]`：完整后台路由前缀。
- `resources/menus.php`：菜单和按钮权限默认元数据。
- `#[Permission]`：接口权限点。
- `#[OperationLog]`：会产生数据变更的动作。
- `ApiResponse::success()`：统一响应出口。

Controller 不写业务判断，不直接操作 Model/Db。

标准方法名：

- `list`
- `detail`
- `create`
- `update`
- `delete`

权限码建议和方法语义一致：

```text
<module>:<resource>:list
<module>:<resource>:detail
<module>:<resource>:create
<module>:<resource>:update
<module>:<resource>:delete
```

操作日志 action 使用点号命名：

```text
admin.<module>.<resource>.create
admin.<module>.<resource>.update
admin.<module>.<resource>.delete
```

### Request

Request 负责入参校验和归一化。

必须做：

- 字符串 trim。
- 数字转 int。
- 前端字段保持 camelCase。
- HTTP 入参只接受当前接口契约定义的字段名；Admin API 使用 camelCase，不做旧式 snake_case 输入兼容。

Request 不检查数据库唯一性，不查询其他表。数据库相关的业务不变量交给 Service。

### Service

Service 负责业务流程和不变量。

常规 CRUD 中，Service 应显式表达：

- 创建前唯一性校验。
- 更新前资源存在校验。
- 更新前唯一性排除当前记录。
- 删除前业务保护。
- 组装 Repository 需要的持久化数据。

可以继承 `App\Foundation\Service\AbstractService`，使用：

- `assertUnique()`
- `assertExistingIds()`
- `notFound()`

不要把业务流程隐藏进通用 `CrudService` 黑盒。TrueAdmin 第一版更偏向“可读显式流程 + 少量 helper”。

事务规则：第一版不使用 `#[Transactional]`，也不通过 `AbstractService` 隐式封装事务。标准 CRUD 如果只是单表简单写入，可以不开事务；如果涉及多表写入、授权关系、状态流转或多个 Repository 协作，应在 Service 的公开写方法中直接使用 `Hyperf\DbConnection\Db::transaction()`。Controller、Request、Repository 不开启事务，Service 调 Service 时由最外层用例 Service 控制事务。

`try/catch` 规则：不要为了“防止报错”包住 CRUD 主流程。资源创建、更新、删除、授权、状态变更失败时应让异常向上抛出。只有操作日志、通知等旁路副作用可以捕获异常并记录 warning；关键业务捕获异常后必须重新抛出。

### Repository

Repository 负责数据访问和查询协议。

标准 Repository 继承 `App\Foundation\Repository\AbstractRepository`，并配置：

- `$modelClass`
- `$keywordFields`
- `$filterable`
- `$sortable`
- `$defaultSort`

列表统一使用：

```php
$this->pageQuery(Model::query(), $adminQuery, fn (Model $model): array => $this->toArray($model));
```

Repository 可以使用：

- `findModelById()`
- `createModel()`
- `updateModel()`
- `deleteModel()`
- `existingModelIds()`
- `syncPivot()`
- `pivotIds()`

Repository 不处理 HTTP 语义，不抛业务异常，不判断按钮权限。

### Model

Model 只声明表名和可写字段。

复杂业务不要写在 Model 里。需要跨字段或跨表规则时，放到 Service。

### Migration

迁移归模块维护。

命名建议：

```text
Module/Xxx/Database/Migrations/YYYY_MM_DD_HHMMSS_create_xxx_table.php
```

默认优先 PostgreSQL，同时保持 MySQL 兼容。字段命名使用 snake_case，API 输出使用 camelCase。

## 标准查询协议

后台列表统一使用 `AdminQueryRequest -> AdminQuery -> AbstractRepository::handleSearch()`。

请求参数：

```text
page=1
pageSize=20
keyword=abc
filter[status]=enabled
op[status]=in
sort=created_at
order=desc
```

响应分页字段保持 camelCase，例如 `pageSize`。

## 生成清单

AI 生成一个标准 CRUD 模块时，至少完成：

- Migration。
- Model。
- Repository。
- Service。
- Save Request。
- Admin Controller。
- 权限码和菜单注解。
- 操作日志注解。
- 测试或可执行验证说明。
- 必要文档更新。

## 复制替换清单

从 `examples/backend/golden-crud` 复制时，必须替换：

- `Example` 模块名。
- `ExampleDict` 类名。
- `example_dicts` 表名。
- `/api/admin/example/dicts` 路由。
- `/example/dicts` 前端路径。
- `example:dict:*` 权限码。
- `admin.example.dict.*` 操作日志 action。
- `示例字典` 文案。
- `$keywordFields`、`$filterable`、`$sortable`。
- `toArray()` 输出字段。

## 推荐验证

后端生成完成后至少运行：

```bash
find backend/app backend/test trueadmin-kernel/src -name '*.php' -print0 | xargs -0 -n1 php -l
cd backend && composer test
```

如果本次只新增示例文档，可以只做 PHP 语法检查和文档差异检查。
