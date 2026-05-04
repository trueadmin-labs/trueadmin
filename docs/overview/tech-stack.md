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

Web 管理端使用 React + Vite + TypeScript + Ant Design。

选择理由：

- Ant Design 对企业后台场景支持成熟。
- React 生态适合构建复杂管理界面。
- Vite 提供轻量、快速的开发体验。
- TypeScript 能提升接口契约和 AI 生成代码的稳定性。

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
