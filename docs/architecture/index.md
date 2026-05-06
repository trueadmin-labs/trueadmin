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

Web 管理端使用 React 19 + Umi Max 4 + TypeScript 6 + Ant Design Pro Components 3 + Ant Design 6。`web` 本身就是后台管理端，不再在目录内重复划分 `admin` / `client`。用户端、开放端如果需要独立前端，应使用新的应用目录，而不是混入 `web`。

官方 Ant Design Pro v6 模板是技术栈和配置参考，不作为目录覆盖来源。模板中的 Welcome/Admin/table-list/chatbot/PWA/service-worker、示例 Mock、多语言样例和官网链接都属于演示资产，不进入 TrueAdmin Web 主干。TrueAdmin Web 的主干以模块化后台产品为目标，优先保持稳定、清爽、AI 易读的结构。

前端采用 `foundation + modules` 结构：业务模块自己维护页面、手写 API、类型、局部组件、Hooks 和多语言；框架层能力放入 `foundation`；Umi 运行时入口保留在框架约定位置；`src/locales` 只作为 Umi 国际化插件的薄入口。

```text
web/src/
  app.tsx                  Umi 运行时配置、初始状态、布局菜单
  access.ts                Umi 权限入口
  requestErrorConfig.ts    全局请求错误处理
  foundation/              TrueAdmin Web 框架层能力
    auth/                  token、权限判断等
    request/               API 响应和分页类型
    menu/                  后端菜单到 ProLayout 菜单转换
    layout/components/     布局级组件
    exception/pages/       403、404、500 等框架异常页
    locale/framework/      框架级语言包
    router/                路由类型与模块路由聚合生成物
  modules/
    auth/                  登录、退出、当前用户等认证能力
      pages/
      routes.ts
      services/
      locales/
      types.ts
    dashboard/             控制台
      pages/
      routes.ts
      locales/
    system/                系统管理模块
      routes.ts
      pages/
      services/
      types/
      locales/
      components/
      hooks/
  locales/                 Umi 国际化入口目录，整目录由 scripts/generate-locales.mjs 生成且不进 git
  generated/openapi/       OpenAPI 生成代码预留
```

前端模块边界规则：

- 页面组件放在 `modules/<module>/pages/<PageName>/index.tsx`。
- 手写接口放在 `modules/<module>/services/*.api.ts`。
- 模块 DTO 和页面类型放在 `modules/<module>/types`。
- 模块多语言放在 `modules/<module>/locales/<locale>.ts`；`scripts/generate-locales.mjs` 会生成 Umi 框架语言入口和 `moduleLocaleRegistry.generated.ts`。模块语言通过 `loadModuleLocale()` 按需加载，不进入首屏语言包。
- 模块路由放在 `modules/<module>/routes.ts`；`scripts/generate-routes.mjs` 会生成 `foundation/router/moduleRoutes.generated.ts`。`config/routes.ts` 只保留模块路由聚合、根路径跳转和 404，不写业务模块页面。
- 模块内私有组件和 Hooks 放在 `modules/<module>/components`、`modules/<module>/hooks`。
- 跨模块框架能力放入 `foundation`，不要从一个业务模块直接 import 另一个业务模块的页面或私有组件。
- `config/routes.ts` 仍作为 Umi 路由入口，但具体业务路由必须来自模块 `routes.ts`，页面组件应指向 `@/modules/...` 或 `@/foundation/...`。
- 不新增根级 `src/pages` 业务页面；官方模板示例页不得作为业务目录继续扩展。
- 后端菜单负责运行时展示，前端路由负责可渲染页面；后端下发的菜单路径如果没有对应页面，必须进入 404，而不是空白页。

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
