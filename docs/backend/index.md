# 后端架构

TrueAdmin 后端是 Hyperf 企业后台脚手架，参考 MineAdmin 的高效率后台分层，同时增加模块化上下文、`trueadmin-kernel`、项目级 Foundation、技术适配 Infrastructure 和 AI 友好规范。

它不是重 DDD 框架，也不是简单 CRUD 模板。第一版采用“模块化外壳 + MineAdmin 内部分层 + AI 友好生成规范”：普通 CRUD 足够快，复杂业务可以逐步引入事件、策略、契约和插件化能力。

## 核心结构

```text
trueadmin-kernel
  src/
    Context/
    Crud/
    DataPermission/
    Http/Attribute/
    Pagination/
    OperationLog/
    Exception/

backend/app/
  Foundation/
    Auth/
    Crud/
    Database/
    Exception/
    Http/
    OpenApi/
    Repository/
    Service/
  Infrastructure/
    Cache/
    Lock/
    Mail/
    Queue/
    Sms/
    Storage/
  Module/
    Auth/
    System/
```

一句话边界：`Kernel` 提供稳定原语，`Foundation` 提供项目默认行为，`Infrastructure` 提供技术适配，`Module` 承载系统能力和业务能力。

## 模块结构

标准模块按需包含：

```text
Module/Xxx/
  Http/
    Admin/
      Controller/
      Middleware/
      Request/
      Vo/
    Client/
      Controller/V1/
      Middleware/
      Request/V1/
      Vo/V1/
    Open/
      Controller/V1/
      Middleware/
      Request/V1/
      Vo/V1/
    Common/
      Event/
      Middleware/
      Request/
  Service/
  Repository/
  Model/
  Library/
  Event/
  Listener/
  Command/
  Crontab/
  Database/
    Migrations/
    Seeders/
  module.php
  menus.php
  permissions.php
  openapi.json
  llms.txt
```

第一版不要求每个模块创建完整目录，只创建实际需要的部分。不使用 `Subscriber` 目录，统一使用 `Event / Listener`。

## 路由和注解

当前已落地注解路由注册：根 `backend/config/routes.php` 只保留框架入口、OpenAPI 入口和注解路由注册器，业务路由写在 Controller 的 `#[AdminGet]`、`#[ClientGet]`、`#[OpenGet]` 等 Attribute 上。模块内不再默认创建 `routes.php`。

```bash
php bin/hyperf.php trueadmin:routes
```

业务开发推荐使用 Attribute 声明路由、权限、操作日志、数据权限、OpenAPI 和接口元数据。第一版已经把接口元数据、`DataScope`、`OperationLog` 的基础 Attribute/AOP/Event 原语放入 `trueadmin-kernel`，并启用注解路由注册、接口元数据扫描、菜单权限同步和 OpenAPI 输出。

```bash
php bin/hyperf.php trueadmin:metadata
php bin/hyperf.php trueadmin:metadata-sync
php bin/hyperf.php trueadmin:openapi
```

## 数据库迁移

迁移和填充采用“资源归模块，执行归框架”。底层使用 Hyperf 原生 migration/seeder，TrueAdmin 在启动期把模块迁移目录注册到 Hyperf Migrator，把模块 Seeder 目录注册到 Hyperf Seed。

```text
backend/app/Module/*/Database/Migrations
backend/app/Module/*/Database/Seeders
backend/plugins/*/*/Database/Migrations
backend/plugins/*/*/Database/Seeders
```

默认数据库是 PostgreSQL，MySQL 保持兼容。第一版不保留 `backend/database` 根级迁移目录；模块种子数据可直接通过 `php bin/hyperf.php db:seed --force` 或 `php bin/hyperf.php migrate --seed` 执行。

## 专题文档

- [后端完整架构方案](architecture.md)
- [层级边界规范](layer-boundaries.md)
- [Composer 包抽取检查](composer-packages.md)
- [模块目录规范](module-architecture.md)
- [配置模式与注解模式](configuration-vs-attribute.md)
- [接口元数据体系](interface-metadata.md)
- [后端注解驱动设计](annotation-driven.md)
- [数据库迁移规范](database-migrations.md)
- [插件系统规范](plugin-system.md)
- [MineAdmin 后端设计分析](../research/mineadmin-backend-analysis.md)
