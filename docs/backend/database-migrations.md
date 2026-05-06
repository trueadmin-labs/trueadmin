# 数据库迁移规范

TrueAdmin 数据库迁移采用：迁移归模块，执行归框架。

底层使用 Hyperf 原生 migration 和 seeder，不另造迁移/填充系统。TrueAdmin 在应用启动时把模块和插件迁移目录注册到 Hyperf Migrator，把模块和插件 Seeder 目录注册到 Hyperf Seed，因此原生 `migrate`、`migrate:status`、`migrate:rollback`、`db:seed`、`migrate --seed` 等命令都能感知模块资源。

数据库驱动采用 PostgreSQL 优先、MySQL 兼容的策略。默认使用 `DB_DRIVER=pgsql`，PostgreSQL 支持来自 Hyperf 官方扩展包 `hyperf/database-pgsql`；MySQL 仍使用 Hyperf 原生 MySQL connector。迁移文件应优先使用 Hyperf Schema Builder 的跨库安全写法，不在迁移中直接写某一数据库专属 SQL。

## 目录规则

```text
backend/app/Module/System/Database/Migrations
backend/app/Module/System/Database/Seeders

backend/app/Module/Product/Database/Migrations
backend/app/Module/Product/Database/Seeders

backend/plugin/*/*/Database/Migrations
backend/plugin/*/*/Database/Seeders
```

## 放置规则

模块自己的业务表放模块内。

```text
Product/Database/Migrations/create_products_table.php
Order/Database/Migrations/create_orders_table.php
Workflow/Database/Migrations/create_workflow_definitions_table.php
```

系统业务表放 `Module/System`。

```text
admin_users
admin_departments
admin_user_departments
admin_positions
admin_roles
admin_menus
admin_operation_logs
admin_login_logs
```

第一版只保留已经形成完整闭环的系统表。`admin_operation_logs` 由 `#[OperationLog]`、AOP、事件和 Listener 写入；`admin_login_logs` 由后台登录事件和 Listener 写入。`system_dicts`、`system_configs`、用户端登录日志等能力不做空表预留，等对应的模型、仓储、接口、事件和后台页面一起设计时再加入，避免脚手架提前背负未使用概念。

后台管理员按多部门设计，不使用单一 `dept_id` 表达全部部门关系。推荐结构：

```text
admin_users.primary_dept_id
admin_departments.parent_id
admin_departments.level
admin_departments.path
admin_user_departments.user_id
admin_user_departments.dept_id
admin_user_departments.is_primary
```

`admin_departments` 使用树形结构维护组织部门；`primary_dept_id` 是默认操作部门；`admin_user_departments` 是所属部门集合。迁移应保证一个用户最多一个主部门，且主部门必须属于该用户所属部门集合。PostgreSQL 和 MySQL 对部分唯一索引能力不同，第一版可以在 Service 层保证一致性，数据库层保留普通索引和唯一组合索引。

角色按层级结构预留授权边界字段：

```text
admin_roles.parent_id
admin_roles.level
admin_roles.path
admin_roles.sort
```

`parent_id` 指向父角色，`level` 便于排序和查询，`path` 存储祖先链，例如 `,1,8,23,`，用于快速判断角色树关系。迁移层只负责字段和索引，是否允许移动、是否越权授权、子角色权限是否超过父角色，必须在 `Module/System` 的 Service 层校验。

第一版内置用户端基础账号表 `client_users`，归属 `Module/System`，只承载认证主体和轻量展示字段。项目需要会员、客户等业务资料时，再按业务语义新增 `Member`、`Customer` 或其他模块，并通过 `client_user_id` 关联 `client_users`；用户端认证入口仍归属 `Module/Auth/Http/Client`，不要新增泛化 `Module/User`。

```text
client_users
member_profiles
customer_profiles
```

插件表跟随插件目录。插件迁移只有在插件启用时才进入扫描路径，插件启停和清单规则见 [插件系统规范](plugin-system.md)。

第一版不保留 `backend/database/migrations` 根级迁移目录。框架内置基础表归属 `Module/System`，业务表归属对应业务模块。

## 执行命令

Hyperf 默认迁移：

```bash
php bin/hyperf.php migrate
```

查看 TrueAdmin 注册到 Hyperf Migrator 的迁移和种子目录：

```bash
php bin/hyperf.php trueadmin:migration-paths
```

迁移和填充直接使用 Hyperf 原生命令：

```bash
# 开发环境清库重建，优先使用
php bin/hyperf.php migrate:fresh --seed

# 正常初始化或升级，不清库
php bin/hyperf.php migrate --seed

# 只补跑种子数据
php bin/hyperf.php db:seed --force

# 验证 down() 可回滚时使用
php bin/hyperf.php migrate:refresh --seed
```

模块 Seeder 支持命名空间类，路径由 `RegisterSeederPathsListener` 在启动期注册到 Hyperf 原生 `Seed`。

## 生成迁移

仍使用 Hyperf 原生命令，但指定模块路径：

```bash
php bin/hyperf.php gen:migration create_products_table --path=app/Module/Product/Database/Migrations --create=products
```

## 设计约束

- 迁移文件必须可以重复扫描，但只能执行一次。
- 表名全局唯一，避免不同模块创建同名表。
- 默认目标数据库是 PostgreSQL，兼容目标数据库是 MySQL。
- 不在通用迁移里使用 MySQL-only 或 PostgreSQL-only 的原始 SQL；确实需要数据库特性时，应在文档中标注驱动要求。
- 跨模块外键第一版谨慎使用，优先用业务 ID 关联，避免模块拆分和插件化时互相锁死。
- 大表变更遵循可回滚、可灰度、可分阶段原则。
- Seed 数据和迁移分开，迁移建结构，Seeder 写初始数据。

## 执行原则

迁移和填充主入口继续使用 Hyperf 原生命令：

```bash
php bin/hyperf.php migrate:fresh --seed
php bin/hyperf.php migrate
php bin/hyperf.php migrate --seed
php bin/hyperf.php migrate:status
php bin/hyperf.php migrate:rollback
php bin/hyperf.php db:seed --force
```

`trueadmin:migration-paths` 只用于查看扫描结果，不负责执行迁移或填充。
