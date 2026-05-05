# 本地开发与部署

## 基础依赖

第一阶段本地环境需要：

- PHP 与 Composer。
- Node.js 与包管理器。
- Docker。
- Docker Compose。

## 基础设施

本地默认使用 PostgreSQL 和 Redis。

启动基础设施：

```bash
docker compose -f deploy/docker/docker-compose.yml up -d
```

停止基础设施：

```bash
docker compose -f deploy/docker/docker-compose.yml down
```

## 环境变量

复制 `.env.example` 作为本地环境变量文件，并根据实际端口和密码调整。

关键变量：

- `DB_DRIVER=pgsql`
- `DB_HOST=127.0.0.1`
- `DB_PORT=15432`
- `DB_DATABASE=trueadmin`
- `DB_USERNAME=trueadmin`
- `DB_PASSWORD=trueadmin`
- `REDIS_HOST=127.0.0.1`
- `REDIS_PORT=6379`
- `JWT_SECRET=change-me`

TrueAdmin 默认优先使用 PostgreSQL，后端通过 Hyperf 官方扩展包 `hyperf/database-pgsql` 支持 `DB_DRIVER=pgsql`。如需兼容 MySQL，可切换 `DB_DRIVER=mysql` 并使用对应的 MySQL 连接信息。

## 后续补充

当后端和 Web 应用初始化后，本文件应继续补充：

- Web 启动命令。
- 移动端启动命令。
- 数据迁移命令。
- 常见问题。

## 后端启动

进入后端目录：

```bash
cd backend
composer install
php bin/hyperf.php migrate:fresh --seed
composer start
```

默认服务地址：

```text
http://localhost:9501
```

默认管理员账号：

```text
username: admin
password: trueadmin
```

默认管理员由 System 模块 Seeder 写入数据库。开发环境首次初始化推荐执行 `php bin/hyperf.php migrate:fresh --seed`；正常升级执行 `php bin/hyperf.php migrate --seed`；模块 Seeder 目录已在启动期注册，只补数据可以直接执行 `php bin/hyperf.php db:seed --force`。

第一阶段已预留 API 分区：

```text
/api/admin
/api/v1/client
/api/v1/open
```
