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

当 Web 应用初始化后，本文件应继续补充实际启动命令和常见问题：

- Web 启动命令。
- 移动端启动命令。
- 常见问题。

## Web 管理端

当前 `web/` 目录处于清空待初始化状态。实现前必须先阅读 [前端架构](../frontend/index.md)，按自研模块化底座初始化，不直接使用 Ant Design Pro v6 官方工程作为项目底座。

前端包管理器固定为 pnpm，依赖在 `web` 目录内自包含管理，只提交 `web/pnpm-lock.yaml`，禁止提交 `package-lock.json` 和 `yarn.lock`。

前端命令必须显式指定 Vite mode，推荐脚本：

```json
{
  "dev": "vite --mode development",
  "dev:test": "vite --mode test",
  "build": "vite build --mode production",
  "build:test": "vite build --mode test",
  "preview": "vite preview --host 0.0.0.0 --port 8000",
  "lint": "biome lint",
  "format": "biome check --write",
  "typecheck": "tsc --noEmit",
  "check": "pnpm lint && pnpm typecheck && pnpm build"
}
```

在仓库根目录执行前端命令时统一使用 `pnpm --dir web <script>`，例如 `pnpm --dir web check`。如果已经进入 `web/` 目录，也可以直接执行 `pnpm check`。

前端 env 遵循 Vite 官方优先级：

```text
.env.[mode].local > .env.[mode] > .env.local > .env
```

业务代码禁止直接读取 `import.meta.env`，必须通过 `web/config` 读取结构化配置。

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

默认管理员由 System 模块 Seeder 写入数据库。System Seeder 同时会调用 MetadataSynchronizer，把 Controller Attribute 中声明的菜单、按钮权限和接口权限同步到数据库，并授权给 `super-admin`。开发环境首次初始化推荐执行 `php bin/hyperf.php migrate:fresh --seed`；正常升级执行 `php bin/hyperf.php migrate --seed`；模块 Seeder 目录已在启动期注册，只补数据可以直接执行 `php bin/hyperf.php db:seed --force`。

第一阶段已预留 API 分区：

```text
/api/admin
/api/v1/client
/api/v1/open
```
