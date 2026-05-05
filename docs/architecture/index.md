# 总体架构

TrueAdmin 使用 Monorepo 组织后端、Web 管理端、移动端、部署编排、文档和可复用内核包。架构目标是让普通后台 CRUD 足够快，让复杂业务有清晰边界，也让 AI 能通过文档和目录稳定理解项目。

## 仓库结构

```text
TrueAdmin/
  backend/            Hyperf 后端应用
  web/                React + Umi Max + Ant Design Pro + Ant Design 管理端
  mobile/             uni-app + Wot UI 移动端
  packages/kernel     TrueAdmin 可复用 Composer 核心原语
  deploy/             本地开发和部署编排
  docs/               项目文档中心
  scripts/            工程脚本
  llms.txt            面向 LLM 的项目入口说明
```

## 后端分层

后端采用四层组织：

```text
packages/kernel        稳定、可复用、可 Composer 化的框架原语
backend/app/Foundation 项目级可改默认行为
backend/app/Infrastructure 外部技术适配
backend/app/Module     系统能力和业务模块
```

业务模块采用 `app/Module + 模块内 MineAdmin 分层`：外层按模块聚合上下文，模块内部保留 `Http/Admin`、`Http/Client`、`Service`、`Repository`、`Model`、`Library` 等高效率后台分层。

后端主文档见 [后端架构](../backend/index.md)。

## Web 管理端

Web 管理端使用 React + Umi Max + TypeScript + Ant Design Pro + Ant Design。第一阶段要建立登录、基础布局、动态菜单、权限路由、按钮权限、API 请求封装和标准 CRUD 页面约定。

推荐结构：

```text
web/src/app
web/src/pages
web/src/features
web/src/shared
web/src/services
web/src/stores
```

## 移动端

移动端使用 uni-app + Vue 3 + TypeScript + Wot UI。它不是完整后台，而是管理人员处理移动事务的轻量入口，优先承载登录、消息、待办、审批和个人中心。

## API 契约

TrueAdmin 使用 RESTful API + OpenAPI/Swagger。接口按调用方分为：

```text
/api/v1/admin   后台管理端
/api/v1/client  用户端
/api/v1/open    外部开放平台
```

API 规范见 [API 文档](../api/index.md)。

## 架构原则

- 文档先于实现，关键决策必须沉淀到文档。
- 框架本身优先配置模式，业务开发优先注解模式。
- 模块资产优先模块清单，运行时真实状态以数据库为准。
- Controller 负责入口，Service 负责编排，Repository 负责数据访问，Model 表达数据表。
- `kernel` 不依赖 `backend/app`，`Foundation` 和 `Infrastructure` 不反向依赖业务模块。
- 用户端和后台端的身份、权限、数据权限默认分域，不共用一套后台 RBAC。

## 进一步阅读

- [后端架构](../backend/index.md)
- [API 规范](../api/index.md)
- [项目概览](../overview/index.md)
- [AI 开发指南](../ai/ai-development-guide.md)
