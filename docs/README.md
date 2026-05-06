# TrueAdmin 文档中心

本文档中心是 TrueAdmin 的主阅读入口。它按开源项目常见方式组织：先理解项目定位，再阅读架构，再进入后端、前端、API、开发和 AI 协作规范。

## 推荐阅读路径

新读者建议按以下顺序阅读：

1. [项目概览](overview/index.md)
2. [总体架构](architecture/index.md)
3. [后端架构](backend/index.md)
4. [前端架构](frontend/index.md)
5. [API 规范](api/index.md)
6. [本地开发](development/local-development.md)
7. [AI 开发指南](ai/ai-development-guide.md)

AI 编码代理应先阅读根目录的 [AGENTS.md](../AGENTS.md)，再根据任务进入对应专题文档。

## 文档分区

- [overview](overview/index.md)：项目定位、技术栈、模块范围和演化路径。
- [architecture](architecture/index.md)：Monorepo 总体架构、分层原则和前后端协作方式。
- [backend](backend/index.md)：Hyperf 后端、模块化目录、注解、迁移、接口元数据、插件系统和层级边界。
- [frontend](frontend/index.md)：Web 管理端技术栈、模块系统、插件系统、CRUD、布局、主题、权限、国际化和质量规范。
- [api](api/index.md)：API 响应、身份边界、多端 API、版本管理和复用边界。
- [development](development/index.md)：本地开发、长期项目记忆和协作上下文。
- [ai](ai/ai-development-guide.md)：AI 协作开发约定、黄金 CRUD 模块、任务模板、模块 Prompt 和测试约定。
- [research](research/mineadmin-backend-analysis.md)：MineAdmin 等参考项目分析，不作为日常开发主路径。

## 维护原则

- 架构决策必须写入文档，不能只留在聊天记录中。
- 同一主题只保留一个主文档，避免多个文档给出不同答案。
- 研究资料和历史分析放入 `research/`，不要混入主阅读路径。
- 新增模块、接口、权限点、迁移或生成器能力时，应同步更新对应专题文档。
