# TrueAdmin 演化路径

本文档记录 TrueAdmin 从概念到可开发工程，再到企业级脚手架的演化路线。

## 阶段 0：方向确认

已完成。

确认内容：

- 目标不是单纯做一个后台页面模板，而是做企业级后台脚手架基建。
- 功能形态参考 MineAdmin。
- 技术栈由 TrueAdmin 自行选择。
- 项目需要兼顾人类开发和 AI 协作开发。
- 项目主名定为 TrueAdmin。

## 阶段 1：文档和仓库基座

当前阶段。

目标：建立开源项目外壳、文档体系、AI 协作入口和 Monorepo 目录。

已完成：

- Monorepo 目录。
- README。
- License。
- Roadmap。
- Contribution Guide。
- Architecture Docs。
- Module Docs。
- API Conventions。
- AI Development Guide。
- Task Templates。
- Local Docker Compose for PostgreSQL and Redis。
- llms.txt。

阶段完成标准：

- 新会话或新 AI 代理可以通过文档恢复项目上下文。
- 后续开发可以从 `backend/`、`web/`、`mobile/` 任一方向继续。

## 阶段 2：后端工程初始化

已完成第一版。

目标：让后端从文档预留进入可运行工程。

主要任务：

- 初始化 Hyperf 应用。
- 整理后端模块目录。
- 配置 PostgreSQL。
- 配置 Redis。
- 配置 JWT。
- 建立统一响应结构。
- 建立异常处理和错误码。
- 建立 OpenAPI/Swagger 文档入口。
- 实现认证最小闭环。
- 预留 Admin、Client、Open API 分区。

认证最小闭环：

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/auth/me`

当前说明：

- 后台认证已切换为 `admin_users` 数据库用户。
- 默认管理员账号由 System 模块 Seeder 创建，账号为 `admin / trueadmin`；菜单和按钮权限默认元数据由模块 `resources/menus.php` 同步入库，接口权限由 Controller Attribute 校验。
- OpenAPI 文档入口为 `/api/v1/open/openapi.json`。
- PostgreSQL 本地端口映射为 `15432`，避免和本机默认 `5432` 冲突。

## 阶段 3：系统权限基础模块

推荐下一阶段。

目标：完成企业后台基础权限模型。

主要模块：

- 用户。
- 角色。
- 菜单。
- 按钮权限。
- 接口权限。
- 部门。
- 岗位。
- 数据权限策略。

阶段完成标准：

- 可以创建用户、分配角色、控制菜单和按钮显示。
- 后端接口可以根据权限点拒绝无权访问。
- Web 管理端可以根据用户权限渲染菜单。

## 阶段 4：Web 管理端初始化

目标：建立可登录、可进入后台布局、可渲染动态菜单的 Web 管理端。

主要任务：

- 初始化 Vite + React + TypeScript + React Router + Ant Design 6 + ProComponents 3 的自研模块化前端底座。
- 建立登录页。
- 建立基础布局。
- 建立路由和权限守卫。
- 建立 API 请求封装。
- 接入 `auth/me`。
- 接入动态菜单。

## 阶段 5：系统基础能力

目标：补齐后台基础版常见能力。

主要模块：

- 字典管理。
- 操作日志。
- 登录日志。
- 文件上传。
- 个人中心。
- 基础仪表盘。

## 阶段 6：CRUD 代码生成

目标：让 TrueAdmin 具备脚手架核心能力。

第一版生成器范围：

- 后端接口骨架。
- 后端模型和校验。
- OpenAPI 契约。
- Web 列表页。
- Web 表单页。
- 菜单和权限点。

## 阶段 7：企业增强能力

目标：在后台基础版上扩展企业中台能力。

主要模块：

- 消息中心。
- 站内通知。
- 待办中心。
- 流程定义。
- 流程发起。
- 审批流转。

## 阶段 8：移动轻量管理端

目标：建立 uni-app + Wot UI 移动端。

主要能力：

- 登录。
- 消息。
- 待办。
- 审批。
- 个人中心。

## 长期方向

- 多租户能力评估。
- OpenAPI 驱动类型生成。
- AI 模块生成规范强化。
- 更完整的模块脚手架生成器。
- 插件化能力。
- 文档站点。
- 示例业务模板。
