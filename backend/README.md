# TrueAdmin Backend

后端目录用于承载 Hyperf 应用。

## 技术选择

- PHP。
- Hyperf。
- PostgreSQL，默认数据库。
- MySQL，兼容数据库。
- Redis。
- JWT。
- OpenAPI/Swagger。

## 架构方式

后端采用 `kernel + app/Foundation + app/Infrastructure + app/Module` 的分层方式，其中业务模块采用 `app/Module + 模块内 MineAdmin 分层`。

完整说明见：

- [后端架构](../docs/backend/index.md)
- [后端完整架构方案](../docs/backend/architecture.md)
- [数据库迁移规范](../docs/backend/database-migrations.md)

```text
app/Foundation
app/Infrastructure
app/Module/Auth
app/Module/System
app/Module/Product
app/Module/User
```

模块内部参考 MineAdmin：

```text
Http/Admin      后台管理端入口
Http/Client     用户端入口
Service         业务服务
Repository      数据访问
Model           数据模型
Library         数据权限、操作日志、AOP、Attribute 等横切能力
Schema          结构化输出和代码生成元数据预留
```

`packages/kernel` 保留错误码、业务异常、ActorContext、接口元数据 Attribute、数据权限 Attribute/AOP、操作日志 Attribute/Event/AOP 等可复用基础原语。`app/Foundation` 放项目级可改基础行为，例如统一响应、异常处理、健康检查、OpenAPI 入口、CRUD 默认行为、密码策略、模块路由扫描和模块迁移扫描规则。`app/Infrastructure` 放缓存、存储、队列、短信、邮件等技术适配。

## 当前接口

```text
GET  /
POST /api/v1/admin/auth/login
POST /api/v1/admin/auth/logout
GET  /api/v1/admin/auth/me
GET  /api/v1/admin/products
GET  /api/v1/client/profile
GET  /api/v1/client/products
GET  /api/v1/open/openapi.json
```

业务路由默认使用 Attribute 声明，模块内不再要求维护 `routes.php`。全局 `config/routes.php` 只保留框架入口、OpenAPI 入口和注解路由注册器；确有非常规路由时，再在全局配置中显式兜底。

查看注解路由清单：

```bash
php bin/hyperf.php trueadmin:routes
```

## 本地启动

后端默认使用 `DB_DRIVER=pgsql`，PostgreSQL 支持来自 Hyperf 官方扩展包 `hyperf/database-pgsql`。如需切换 MySQL，可把 `DB_DRIVER` 改为 `mysql` 并调整端口、账号和密码。

```bash
composer install
php bin/hyperf.php migrate:fresh --seed
composer start
```

默认管理员账号：

```text
username: admin
password: trueadmin
```

该账号由 `App\\Module\\System\\Database\\Seeders\\SystemSeeder` 写入数据库。开发环境首次启动推荐执行 `php bin/hyperf.php migrate:fresh --seed`；正常升级执行 `php bin/hyperf.php migrate --seed`；只补种子数据执行 `php bin/hyperf.php db:seed --force`。

## AI 开发提醒

新增后端能力前，先确认：

- 属于哪个模块。
- Controller 放模块内 `Http/Admin` 还是 `Http/Client`。
- Service、Repository、Model 是否需要新增。
- 是否需要 Request、Vo、Schema。
- 是否需要 DataScope、操作日志或 Listener。
- 是否需要 OpenAPI、迁移和种子数据。
