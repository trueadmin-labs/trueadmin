# TrueAdmin 项目记忆

本文档记录 TrueAdmin 的目标、已完成事项、关键决策和当前上下文。它用于帮助开发者和 AI 在长时间、多轮协作中快速恢复现场。

## 项目目标

TrueAdmin 要成为一个面向 AI 协作开发的企业级后台管理脚手架。

它参考 MineAdmin 一类项目的功能形态，但不是复制 MineAdmin 技术栈。TrueAdmin 更强调：

- 企业后台基础能力完整。
- 后续可扩展企业中台能力。
- 代码结构对 AI 友好。
- 开发流程对 AI 友好。
- 文档、接口契约、模块边界和任务模板可持续沉淀。

## 产品定位

- 项目名称：TrueAdmin。
- 定位：开源框架型项目模板。
- 文档语言：中文为主。
- 开源协议：MIT。
- 仓库形态：Monorepo。

## 已确认技术栈

- 后端：PHP + Hyperf。
- Web 管理端：React + Vite + TypeScript + Ant Design。
- 移动端：uni-app + Vue 3 + TypeScript + Wot UI。
- 数据库：PostgreSQL。
- 缓存：Redis。
- 认证：JWT / Token。
- 接口契约：RESTful API + OpenAPI/Swagger。
- 本地基础设施：Docker Compose。

## 已确认架构决策

- 后端采用单体模块化架构。
- 第一版不做多租户。
- 权限模型采用企业后台完整组织体系。
- 移动端定位为轻量管理端。
- 第一阶段聚焦后台基础版。
- 后续扩展消息、待办、流程审批。
- 第一版预留传统后台 CRUD 代码生成能力。

## 第一阶段范围

第一阶段要先完成通用后台基础版：

- 登录认证。
- 用户管理。
- 角色管理。
- 菜单与按钮权限。
- 接口权限。
- 数据权限设计。
- 部门管理。
- 岗位管理。
- 字典管理。
- 操作日志。
- 登录日志。
- 文件上传。
- 个人中心。
- 基础仪表盘。
- CRUD 代码生成能力预留。

## 第二阶段范围

第二阶段扩展企业增强能力：

- 消息中心。
- 站内通知。
- 待办中心。
- 流程定义。
- 流程发起。
- 审批流转。

## 第三阶段范围

第三阶段建设移动轻量管理端：

- 登录。
- 消息。
- 待办。
- 审批。
- 个人中心。

## AI 友好基建目标

TrueAdmin 第一版的 AI 基建按标准版建设，包含：

- README。
- 目录规范。
- 模块说明。
- 接口约定。
- 编码规范。
- AI 开发指南。
- 任务拆分模板。
- 模块 Prompt 模板。
- 接口示例。
- 测试约定。
- 根级 `llms.txt`。

## 已完成事项

- 创建 `TrueAdmin` 仓库目录。
- 初始化 Git 仓库。
- 添加 MIT License。
- 添加 README、ROADMAP、CONTRIBUTING。
- 添加 `backend/`、`web/`、`mobile/`、`deploy/`、`docs/`、`scripts/` 目录。
- 添加架构设计文档。
- 添加模块规划文档。
- 添加技术栈说明。
- 添加 API 规范。
- 添加 AI 开发指南、任务模板、模块 Prompt 模板和测试约定。
- 添加 PostgreSQL + Redis 的 Docker Compose 文件。
- 添加根级 `llms.txt`。
- 初始化 `backend/` Hyperf 3.1 应用骨架。
- 接入 PostgreSQL、Redis、JWT 基础配置。
- 建立统一 API 响应、错误码和业务异常处理。
- 实现后台认证最小闭环：登录、退出、当前用户。
- 预留 API 分区：`admin`、`client`、`open`。
- 添加第一版 OpenAPI JSON 文档入口。
- 调整后端为干净的 `Kernel + Module` 单体模块化结构。

## Git 状态

首次提交：

```text
ce09fcd chore: initialize TrueAdmin scaffold
```

当前新增的项目记忆文档应在下一次提交中记录。

后端初始化阶段提交后，应记录新的提交号。

## 推荐下一步

后端 Hyperf 应用骨架已经初始化完成。下一步建议建设系统权限基础模块。

推荐顺序：

1. 设计用户、角色、菜单、部门、岗位数据表。
2. 添加数据库迁移和种子数据。
3. 将内置管理员账号切换为数据库用户。
4. 实现权限点和菜单查询接口。
5. 扩展 OpenAPI 文档。
6. 为 Web 管理端初始化提供稳定接口。

## API 边界

TrueAdmin 第一阶段已经预留三类 API：

- `/api/v1/admin`：后台管理端 API。
- `/api/v1/client`：未来用户端 API。
- `/api/v1/open`：未来外部开放平台 API。

开放 API 不应直接复用后台管理接口。相关说明见 `docs/api/api-boundaries.md`。

## 后端结构边界

后端当前采用：

```text
backend/app/Kernel
backend/app/Module
```

`Kernel` 放框架层和横切基础能力。业务代码必须归属到具体 `Module`。

Listener 和 Crontab 也按职责归属：框架级放 `Kernel`，业务级放模块内。

## 重要提醒

当项目目标、技术栈、阶段范围、模块边界或路线图发生变化时，必须更新本文档。
