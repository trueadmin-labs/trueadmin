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

- `DB_CONNECTION=pgsql`
- `DB_HOST=127.0.0.1`
- `DB_PORT=5432`
- `REDIS_HOST=127.0.0.1`
- `REDIS_PORT=6379`
- `JWT_SECRET=change-me`

## 后续补充

当后端和 Web 应用初始化后，本文件应继续补充：

- 后端启动命令。
- Web 启动命令。
- 移动端启动命令。
- 数据迁移命令。
- 默认管理员账号。
- 常见问题。

