# TrueAdmin

TrueAdmin 是一个面向 AI 协作开发的企业级后台管理脚手架。

它参考 MineAdmin 一类后台系统的功能形态，但技术栈重新选择为更适合长期演进的组合：后端使用 Hyperf，Web 管理端使用自研模块化 React 底座并复用 Ant Design 6 与 ProComponents 3，移动端预留 uni-app、Vue 3、TypeScript 与 Wot UI。

TrueAdmin 的第一阶段目标不是一次性做完所有业务模块，而是先建立一个稳定、清晰、可持续扩展的工程基座，让人和 AI 都能更容易理解、生成、修改和验证代码。

## 定位

- 开源框架型项目模板。
- 面向企业后台、中后台、内部管理系统和业务中台场景。
- 第一阶段聚焦通用后台基础版。
- 后续扩展消息中心、流程审批、待办中心和轻量移动管理端。
- 从项目结构、文档、接口契约和开发流程上支持 AI 协作开发。

## 技术栈

- 后端：PHP、Hyperf、PostgreSQL、Redis、JWT、OpenAPI/Swagger。
- Web 管理端：Vite、React、TypeScript、React Router、Ant Design 6、ProComponents 3、TanStack Query、alova、Zustand。
- 移动端：uni-app、Vue 3、TypeScript、Wot UI。
- 本地基础设施：Docker Compose、PostgreSQL、Redis。
- 接口风格：RESTful API + OpenAPI/Swagger。

## 快速开始

```bash
npx trueadmin init my-admin
cd my-admin
npm install
pnpm --dir web install
composer --working-dir=backend install
cp .env.example .env
cp backend/.env.example backend/.env
docker compose -f deploy/docker/docker-compose.yml up -d
php backend/bin/hyperf.php migrate:fresh --seed
npm run doctor
```

本地运行时通常开两个终端：

```bash
composer --working-dir=backend start
pnpm --dir web dev
```

## 第一阶段模块

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

## 企业增强模块预留

- 消息中心。
- 站内通知。
- 待办中心。
- 流程定义。
- 流程发起。
- 审批流转。
- 移动端待办与审批。

## 仓库结构

```text
TrueAdmin/
  backend/            Hyperf 后端应用目录预留
  web/                自研模块化 React + Ant Design 6 + ProComponents 3 管理端目录
  mobile/             uni-app + Wot UI 移动端目录预留
  deploy/             本地开发和部署编排
  docs/               架构、接口、AI 协作和开发文档
  scripts/            工程脚本预留
  llms.txt            面向 LLM 的项目入口说明
```

## 文档入口

- [文档中心](docs/README.md)
- [项目概览](docs/overview/index.md)
- [总体架构](docs/architecture/index.md)
- [后端架构](docs/backend/index.md)
- [前端架构](docs/frontend/index.md)
- [API 文档](docs/api/index.md)
- [开发指南](docs/development/index.md)
- [AI 开发指南](docs/ai/ai-development-guide.md)
- [项目记忆](docs/development/project-memory.md)

## AI 协作入口

AI 编码助手或长期协作任务应先阅读 [AGENTS.md](AGENTS.md)。该文件会指向项目记忆、架构文档和 AI 开发规范，帮助新会话快速恢复上下文。

## 开源协议

TrueAdmin 使用 MIT License。
