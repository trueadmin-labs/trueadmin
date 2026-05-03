# TrueAdmin 架构设计

## 架构目标

TrueAdmin 的第一阶段目标是建立一个企业后台基础版，而不是一次性实现完整业务中台。

架构需要同时满足三类使用者：

- 开发者可以快速理解模块边界和扩展方式。
- 团队可以基于模板快速创建企业后台项目。
- AI 编码助手可以根据文档、契约和约定稳定生成代码。

## 总体形态

TrueAdmin 使用 Monorepo 组织方式。

```text
TrueAdmin/
  backend/   Hyperf 后端应用
  web/       React + Ant Design 管理端
  mobile/    uni-app + Wot UI 轻量移动管理端
  docs/      架构、接口、AI 协作和部署文档
  deploy/    本地基础设施和部署编排
```

## 后端架构

后端采用单体模块化架构。

单体模块化的核心原则是：一个应用进程内承载多个业务模块，但每个模块都有明确的领域边界、数据边界、权限边界和接口边界。

建议后端模块结构：

```text
backend/
  app/
    Module/
      System/
      Auth/
      Permission/
      Organization/
      Dictionary/
      Log/
      File/
      Generator/

packages/
  kernel/
    src/
      Constant/
      Database/
      Event/
        Listener/
      Exception/
      Http/
        Controller/
        Middleware/
      Crontab/
      Support/
```

`packages/kernel` 是可复用 Composer 核心包，包名为 `trueadmin/kernel`。它只放框架层和横切基础能力，例如统一响应、错误码、基础模型、异常处理、HTTP 中间件、健康检查、OpenAPI 文档入口、框架生命周期监听器和全局定时任务。

`backend/app/Module` 放业务能力。业务 Controller、Request、Service、Repository、Model、DTO、Policy、Event、Listener、Crontab 都应归属到具体模块，不应散落在 `backend/app` 外层。

每个模块建议包含：

- Controller：HTTP 入参、鉴权入口、响应出口。
- Request：参数校验。
- Service：业务编排。
- Repository：数据访问。
- Model：数据库模型。
- DTO：跨层数据结构。
- Policy：权限策略。
- Event：领域事件。
- Listener：事件监听。
- Crontab：模块级定时任务。
- Test：模块测试。

## 事件与定时任务边界

事件和定时任务按职责归属：

- 框架生命周期监听器、SQL 日志监听器、全局异常相关监听器放在 `packages/kernel/src/Event/Listener`。
- 业务事件放在对应模块的 `Event` 目录。
- 业务事件监听器放在对应模块的 `Listener` 目录。
- 全局维护类定时任务放在 `packages/kernel/src/Crontab`。
- 业务定时任务放在对应模块的 `Crontab` 目录。

示例：

```text
packages/kernel/src/Event/Listener/DbQueryExecutedListener.php
backend/app/Module/System/Event/UserCreated.php
backend/app/Module/System/Listener/WriteUserAuditLogListener.php
backend/app/Module/System/Crontab/ClearExpiredLoginLogTask.php
```

定时任务不应直接写复杂业务逻辑。任务类只负责调度入口，业务规则应下沉到模块 Service。

## Web 管理端架构

Web 管理端采用 React + Vite + TypeScript + Ant Design。

建议目录结构：

```text
web/
  src/
    app/          应用启动、路由、全局 Provider
    pages/        页面级模块
    features/     业务功能模块
    shared/       跨模块组件、工具和类型
    services/     API 请求封装
    stores/       状态管理
```

Web 端需要优先保证这些能力：

- 动态路由和菜单渲染。
- JWT Token 登录态管理。
- 按钮权限和页面权限控制。
- OpenAPI 驱动的接口类型生成预留。
- 统一列表页、搜索表单、详情页和弹窗表单约定。

## 移动端架构

移动端定位为轻量管理端。

第一阶段只预留目录和规范，后续优先支持：

- 登录。
- 消息。
- 待办。
- 审批。
- 个人中心。

移动端技术栈正式定为 uni-app + Vue 3 + TypeScript + Wot UI。

## 接口契约

TrueAdmin 使用 RESTful API + OpenAPI/Swagger。

接口契约是 AI 协作开发的核心资料。新增或修改接口时，应先更新接口说明、请求参数、响应结构、错误码和权限点，再进入前后端实现。

## 权限模型

第一阶段权限模型包含：

- 用户。
- 角色。
- 菜单。
- 按钮权限。
- 接口权限。
- 数据权限。
- 部门。
- 岗位。
- 组织树。

第一版不实现多租户，但数据库命名、服务分层和权限策略应避免把未来扩展堵死。

## 代码生成

第一阶段预留传统后台 CRUD 代码生成能力。

生成器目标是根据数据表或字段配置生成：

- 后端 Model、Request、Service、Repository、Controller。
- OpenAPI 接口说明。
- Web 列表页、搜索表单、创建表单、编辑表单。
- 菜单、按钮和接口权限点。

## AI 友好原则

- 文档先于实现。
- 模块边界稳定。
- 命名保持一致。
- 接口契约显式。
- 示例代码短小完整。
- 测试约定随模块一起出现。
- 不让业务规则只存在于聊天记录中。
