# 数据库迁移规范

TrueAdmin 数据库迁移采用：迁移归模块，执行归框架。

底层使用 Hyperf 原生 migration 和 seeder，不另造迁移/填充系统。TrueAdmin 在应用启动时把模块和插件迁移目录注册到 Hyperf Migrator，把模块和插件 Seeder 目录注册到 Hyperf Seed，因此原生 `migrate`、`migrate:status`、`migrate:rollback`、`db:seed`、`migrate --seed` 等命令都能感知模块资源。

数据库驱动采用 PostgreSQL 优先、MySQL 兼容的策略。默认使用 `DB_DRIVER=pgsql`，PostgreSQL 支持来自 Hyperf 官方扩展包 `hyperf/database-pgsql`；MySQL 仍使用 Hyperf 原生 MySQL connector。迁移文件应优先使用 Hyperf Schema Builder 的跨库安全写法，不在迁移中直接写某一数据库专属 SQL。

## 目录规则

```text
backend/app/Module/System/Database/Migrations
backend/app/Module/System/Database/Seeders

backend/app/Module/User/Database/Migrations
backend/app/Module/User/Database/Seeders

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
admin_roles
admin_menus
admin_operation_logs
system_dicts
system_configs
```

用户端身份表放 `Module/User`。

```text
client_users
client_user_profiles
```

插件表跟随插件目录。插件迁移只有在插件启用时才进入扫描路径，插件启停和清单规则见 [插件系统规范](plugin-system.md)。

第一版不保留 `backend/database/migrations` 根级迁移目录。框架自身不应该创建业务表；系统基础表归属 `Module/System`，用户端身份表归属 `Module/User`，业务表归属对应业务模块。

## 执行命令

Hyperf 默认迁移：

```bash
php bin/hyperf.php migrate
```

查看 TrueAdmin 注册到 Hyperf Migrator 的迁移和种子目录：

```bash
php bin/hyperf.php trueadmin:migration-paths
```

首次初始化可以使用 TrueAdmin 初始化命令；迁移和填充也可以直接使用 Hyperf 原生命令：

```bash
php bin/hyperf.php trueadmin:init
php bin/hyperf.php trueadmin:init --seed-only
php bin/hyperf.php trueadmin:init --fresh
php bin/hyperf.php db:seed --force
php bin/hyperf.php migrate --seed
```

`trueadmin:init` 只是便捷组合命令：默认调用 `migrate --seed`，`--seed-only` 调用 `db:seed`，`--fresh` 调用 `migrate:fresh --seed`。模块 Seeder 支持命名空间类，路径由 `RegisterSeederPathsListener` 在启动期注册到 Hyperf 原生 `Seed`。

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

迁移和填充主入口继续使用 Hyperf 原生命令，项目初始化入口使用 `trueadmin:init`：

```bash
php bin/hyperf.php trueadmin:init
php bin/hyperf.php migrate
php bin/hyperf.php migrate:status
php bin/hyperf.php migrate:rollback
php bin/hyperf.php db:seed --force
php bin/hyperf.php migrate --seed
```

`trueadmin:migration-paths` 只用于查看扫描结果，不负责执行迁移或填充。`trueadmin:init` 负责把 Hyperf 原生迁移和原生 Seeder 串成开箱即用的初始化流程。
