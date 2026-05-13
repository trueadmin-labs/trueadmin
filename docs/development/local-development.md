# 本地开发与部署

## 基础依赖

第一阶段本地环境需要：

- PHP 与 Composer。
- Node.js 与包管理器。
- Docker。
- Docker Compose。

安装根目录框架工具依赖：

```bash
npm install
```

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
- `JWT_SECRET=<至少 32 位随机字符串>`，可使用 `openssl rand -hex 32` 生成
- `TRUEADMIN_SUPER_ADMIN_PASSWORD=<内置 trueadmin 账号初始密码>`
- `TRUEADMIN_ADMIN_PASSWORD=<内置 admin 账号初始密码>`

生产环境运行 System Seeder 前必须显式配置内置管理员初始密码，且不能使用空值、过短密码或常见弱密码；本地开发也建议显式配置后再初始化数据。

TrueAdmin 默认优先使用 PostgreSQL，后端通过 Hyperf 官方扩展包 `hyperf/database-pgsql` 支持 `DB_DRIVER=pgsql`。如需兼容 MySQL，可切换 `DB_DRIVER=mysql` 并使用对应的 MySQL 连接信息。

## Web 管理端

前端包管理器固定为 pnpm，依赖在 `web` 目录内自包含管理，只提交 `web/pnpm-lock.yaml`，禁止提交 `package-lock.json` 和 `yarn.lock`。

安装 Web 依赖：

```bash
pnpm --dir web install
```

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

启动 Web 管理端：

```bash
pnpm --dir web dev
```

前端 env 遵循 Vite 官方优先级：

```text
.env.[mode].local > .env.[mode] > .env.local > .env
```

业务代码禁止直接读取 `import.meta.env`，必须通过 `web/config` 读取结构化配置。

## 后端启动

安装后端依赖、初始化数据库并启动服务：

```bash
composer --working-dir=backend install
php backend/bin/hyperf.php migrate:fresh --seed
composer --working-dir=backend start
```

`SystemSeeder` 会初始化一套轻量组织样例，方便首次安装后直接理解岗位权限模型：

- 部门：总部、总经办、销售部、财务部、仓储部、技术部。
- 角色权限包：超级管理员、管理员、销售管理、财务管理、仓储管理、技术管理、普通成员。
- 岗位：总部内置管理员岗位，以及各业务部门的负责人和普通成员岗位。
- 岗位默认在部门管理中按部门维护，独立岗位路由保留为高级维护入口，不在默认导航中展示。
- 默认账号仍只创建 `trueadmin` 和 `admin`，不会创建额外示例成员账号。

修改注解、AOP、插件扫描路径或执行 `composer dump-autoload` 后，必须重启 Hyperf。`composer dump-autoload` 会清理 `runtime/container`，运行中的 worker 如果继续引用旧代理文件，可能出现偶发 `KERNEL.SERVER.INTERNAL_ERROR`。本地可用以下命令重启：

```bash
composer restart
```

## 框架自检

插件安装、启停或配置变更后，先同步各端事实文件，再运行 doctor：

```bash
npm run plugin:sync
npm run doctor
npm run web:module:validate
```

`doctor` 会检查 `plugins.config.json`、`backend/config/autoload/plugins.php`、`web/config/plugin.ts` 是否一致，并确认后端和 Web 没有跨端读取插件配置；同时检查后端菜单事实来源是否仍统一在 `resources/menus.php`，以及 Web 运行时代码是否只通过 `web/config` 读取环境变量。

`web:module:validate` 会检查前端模块和插件 manifest 的重复路由、重复菜单 code、locale 缺失和插件 id 与目录不匹配等问题。

提交前可运行完整本地验收：

```bash
npm run check
```

该命令串行执行 `doctor`、插件配置校验、Web 校验/构建、后端静态分析和后端测试。

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
