# 技术栈说明

## 后端

后端使用 PHP + Hyperf。

选择理由：

- Hyperf 在 PHP 生态中成熟度较高。
- 适合构建 API 服务、队列、定时任务和后台管理系统。
- 对企业级后台常见能力有较好的工程承载力。
- 和 MineAdmin 一类后台项目的功能形态更接近。

基础设施使用 PostgreSQL + Redis。

PostgreSQL 是 TrueAdmin 默认数据库，MySQL 作为兼容数据库保留。后端通过 Hyperf 官方扩展包 `hyperf/database-pgsql` 支持 `DB_DRIVER=pgsql`，通过 Hyperf 原生 MySQL connector 支持 `DB_DRIVER=mysql`。

PostgreSQL 适合组织权限、流程、审计和复杂查询场景。Redis 用于缓存、验证码、Token 黑名单、限流和队列辅助能力。

## Web 管理端

Web 管理端使用 Vite + React + TypeScript + React Router + Ant Design 6 + ProComponents 3 + TanStack Query + alova + Zustand + MSW + Tailwind v4 + antd-style。

选择理由：

- Vite 保持前端工程轻量、直接，便于人和 AI 理解模块化底座。
- Ant Design 6 和 ProComponents 3 承载企业后台组件、ProLayout、PageContainer 和 CRUD 基础组件能力。
- React Router 负责前端页面路由，后端 menu-tree 负责菜单运行时展示。
- TanStack Query 管理服务端状态缓存，alova 负责 HTTP 方法、响应解包和错误转换。
- Zustand 管理纯前端 UI 状态和本地偏好，不承载服务端数据缓存。
- MSW 只保留最小开发 Mock，默认优先真实后端。
- Tailwind v4 用于布局、间距和响应式，antd-style 用于消费 Ant Design token 的框架样式。
- TypeScript 能提升接口契约、模块 manifest 和 AI 生成代码的稳定性。

Ant Design Pro v6 是布局、主题和交互参考，不作为 Web 工程底座；MineAdmin 是模块化、插件化、菜单权限和 CRUD 工作流参考。前端详细规范见 [前端架构](../frontend/index.md)。

## 移动端

移动端使用 uni-app + Vue 3 + TypeScript + Wot UI。

选择理由：

- uni-app 适合多端发布。
- Wot UI 是现代 uni-app 组件库，组件丰富，支持暗黑模式、国际化、自定义主题，并强调 AI 友好。
- 移动端只承载轻量管理场景，不与 Web 管理端争夺复杂配置能力。

## API 契约

接口采用 RESTful API + OpenAPI/Swagger。

OpenAPI 是前后端协作和 AI 协作的重要入口，后续可以用于生成类型、客户端请求代码、接口测试用例和文档。

## 开发与部署

第一阶段提供 Docker Compose 本地基础设施：

- PostgreSQL，默认数据库。
- MySQL，兼容数据库。
- Redis。

后续再扩展：

- MinIO 或云对象存储。
- 队列服务。
- WebSocket 服务。
- CI/CD 流程。
