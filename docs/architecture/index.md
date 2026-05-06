# 总体架构

TrueAdmin 使用 Monorepo 组织后端、Web 管理端、移动端、部署编排、文档和可复用内核包。架构目标是让普通后台 CRUD 足够快，让复杂业务有清晰边界，也让 AI 能通过文档和目录稳定理解项目。

## 仓库结构

```text
TrueAdmin/
  backend/            Hyperf 后端应用
  web/                Vite + React + Ant Design 6 + ProComponents 3 管理端
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

Web 管理端使用自研模块化前端底座，技术栈为 Vite + React + TypeScript + React Router + Ant Design 6 + ProComponents 3 + TanStack Query + alova + Zustand + MSW + Tailwind v4 + antd-style。`web` 本身就是后台管理端，不在目录内重复划分 `admin` / `client`。用户端、开放端如果需要独立前端，应使用新的应用目录，而不是混入 `web`。

前端不直接使用 Ant Design Pro v6 官方工程作为项目底座。Ant Design Pro v6 作为 ProLayout、RightContent、AvatarDropdown、Footer、SettingDrawer、PageContainer、global style 和主题体验参考；MineAdmin 作为模块化、插件化、菜单权限、CRUD 工作流和工作区体验参考。

前端采用 `config + app + core + modules + plugins + shared + generated` 结构：

```text
web/
  config/           项目级配置入口，内部读取 Vite env
  src/app/          应用启动、Provider、Router、Layout 装配
  src/core/         前端框架能力：模块、插件、请求、权限、菜单、布局、页面、CRUD、国际化、错误
  src/modules/      内置模块和项目业务模块，统一通过 manifest.ts 暴露前端能力
  src/plugins/      vendor/plugin 插件目录，统一通过 manifest.ts 暴露前端能力
  src/shared/       普通跨模块复用组件、Hooks、工具
  src/generated/    生成代码目录，第一版可为空
```

菜单、权限、按钮、接口元数据以后端为事实来源。前端 manifest 只负责 `path -> component`、模块 locales、图标和前端扩展能力。后端 menu-tree 下发菜单，前端按 path 匹配 React Router 页面；权限点由后端注册和校验，前端只消费当前用户 permissions 控制按钮展示。

布局采用 Ant Design Pro 基础布局 + 可插拔工作区增强。第一版提供 ProLayout、RightContent、AvatarDropdown、Footer、SettingDrawer、PageContainer、TrueAdminPage、WorkspaceViewport 和 TrueAdminCrudPage；RouteTabs 和 KeepAlive 预留为 feature，不作为第一版默认能力。

前端主文档见 [前端架构](../frontend/index.md)。

## 移动端

移动端使用 uni-app + Vue 3 + TypeScript + Wot UI。它不是完整后台，而是管理人员处理移动事务的轻量入口，优先承载登录、消息、待办、审批和个人中心。

## API 契约

TrueAdmin 使用 RESTful API + OpenAPI/Swagger。接口按调用方分为：

```text
/api/admin   后台管理端
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
