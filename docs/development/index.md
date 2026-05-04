# 开发指南

本目录放日常开发、长期协作和上下文恢复相关文档。

## 本地开发

本地基础设施默认使用 PostgreSQL 和 Redis：

```bash
docker compose -f deploy/docker/docker-compose.yml up -d
```

后端默认使用 `DB_DRIVER=pgsql`，PostgreSQL 由 Hyperf 官方扩展包 `hyperf/database-pgsql` 支持；如需 MySQL，可切换 `DB_DRIVER=mysql`。

详细说明见 [本地开发与部署](local-development.md)。

## 长期协作

长期开发时，项目目标、架构决策、阶段范围和已完成事项应写入 [项目记忆](project-memory.md)。它用于帮助人类开发者和 AI 在长时间、多轮协作中快速恢复现场。

## AI 协作

AI 任务应优先阅读根目录 [AGENTS.md](../../AGENTS.md)，再阅读 [AI 开发指南](../ai/ai-development-guide.md)。新增模块时建议使用 [任务拆分模板](../ai/task-template.md) 和 [模块 Prompt 模板](../ai/module-prompt-template.md)。
