# TrueAdmin 包与端边界

TrueAdmin 按依赖边界和调用端边界拆包，不按“哪里用得多”拆包。能进入 npm/composer 包的能力必须是稳定协议、稳定 UI 模式或稳定后端原语；项目事实、端内事实和业务流程留在模板应用、模块或插件内。

## 调用端

TrueAdmin 同时预留三类后端入口：

- `Admin`：后台管理端，当前 `web` 属于 Admin 管理端；未来 `uniapp` 第一阶段也定位为 Admin 管理端。
- `Client`：未来用户端、会员端或客户侧应用。
- `Open`：第三方系统或开放平台接口。

同一个业务模块按业务域组织，不按调用端拆模块。端入口放在模块内：

```text
Module/Xxx/Http/Admin
Module/Xxx/Http/Client
Module/Xxx/Http/Open
```

跨端可复用的是领域模型、Repository、通用 Service、事件、值对象和稳定协议。端独有的是 Controller、Request、鉴权、权限策略、菜单、页面组件、路由入口、端内配置和端内生成文件。

## 后端包

### `trueadmin/kernel`

Composer 核心原语包。TrueAdmin 后端基于 Hyperf，因此 kernel 可以依赖 Hyperf；它只承载所有 TrueAdmin 项目都应共享的稳定底层契约和 Hyperf 运行时能力。

允许：

- 错误码和基础异常
- HTTP Attribute 原语，例如路由、权限、OpenAPI 元数据
- Actor / Context 值对象
- 数据权限和操作日志的 Attribute、事件和值对象
- CRUD 查询协议值对象，例如 `CrudQuery`、`CrudFilterCondition`、`CrudSortRule`
- 分页、API envelope、FormRequest、CRUD Query Request 等稳定协议实现
- Attribute 路由注册、模块迁移路径注册、插件后端 runtime、模块翻译加载、SSE/Streamable 等不依赖业务表的 Hyperf 运行时能力

不允许：

- 应用 Controller、Request、Service、Repository
- 数据库表、迁移、Seeder、菜单、权限资源事实
- Admin / Client / Open 某一端专属业务逻辑
- 依赖 `Module/System` 或其他宿主业务模块的具体实现

### `backend/app/Foundation`

模板项目可改的后端默认实现层。它可以依赖 `trueadmin/kernel`，并把 kernel 原语应用到 Hyperf、数据库、分页、Request 和 Repository。

允许：

- `CrudQueryRequest`
- `AbstractRepository`
- `AbstractService`
- 分页返回结构、统一响应、项目级 Controller 基类
- 项目默认的 CRUD Query 解析、校验和应用逻辑
- 尚未稳定进入 kernel 的框架默认实现

不允许：

- 复制已经稳定进入 `trueadmin/kernel` 的值对象
- 承载模块业务事实
- 承载插件安装、同步、生成命令；插件 CLI 属于框架级 Node/npm 工具

### 模块与插件后端

模块和插件后端承载业务事实。菜单资源、权限资源、迁移、Seeder、业务服务、业务 Repository、端入口 Controller 都留在所属模块或插件内。

## 前端包

### `@trueadmin/web-core`

框架无关 Web 协议包。它不能依赖 React、Ant Design、Vite 或宿主应用配置。

允许：

- API envelope、分页、错误、下载、URL/search-param helper
- CRUD 查询参数协议和序列化器
- 插件 / 模块 manifest 类型辅助和开发期纯校验工具
- i18n marker、浏览器标准能力 helper

不允许：

- React 类型或组件
- Ant Design 组件或图标
- `import.meta.env`、endpoint、auth session、菜单、插件启用事实
- `web/config`、应用 store、provider wiring

### `@trueadmin/web-react`

React 适配层，后续用于沉淀与 UI 库无关的 React 能力。

允许：

- React render 类型绑定
- React hooks 或 provider contract，前提是不绑定 Ant Design 和宿主配置

不允许：

- Ant Design 组件
- Admin 端专属布局、菜单、权限页面和业务流程
- endpoint、auth、插件事实和项目配置读取

### `@trueadmin/web-antd`

Ant Design 集成包。它可以依赖 React、Ant Design 和 Ant Design Icons，但不能读取应用事实。

允许：

- 稳定、跨 Admin 页面复用且业务无关的 AntD 组件
- 只通过 props、render hooks、`className`、`style`、`classNames`、`styles`、原生组件 props 透传实现定制的组件
- `TrueAdminActionBar`、`TrueAdminConfirmAction`
- `TrueAdminQuickFilter`、`TrueAdminTreeFilter`
- `TrueAdminRemoteSelect`

不允许：

- 项目 API 调用、业务 service、auth session、菜单、模块 registry、插件 registry
- 硬编码 `/api/admin` 或任何业务 endpoint
- 读取 `web/config` 或应用 store
- Admin Layout、Route Tabs、角色授权页、用户/部门/商品等领域选择器

### Admin 模板应用 `web`

当前 `web` 是 Admin 管理端模板。它拥有 Admin 端事实和可改实现。

保留在模板内：

- `web/config/*`，包括端内插件事实文件
- auth session、菜单运行时、权限消费、i18n provider、module/plugin registry
- Admin Layout、AppTabsBar、工作区、消息铃铛、个人中心
- `TrueAdminCrudPage` / `TrueAdminCrudTable`，直到 API 足够稳定再考虑拆到 admin 专用包
- 依赖业务领域的选择器，例如 `TrueAdminUserSelect`
- 依赖 CRUD 表格弹窗、业务 i18n 或 service 的组合组件，例如 `TrueAdminRemoteTableSelect`、`TrueAdminTablePicker`

## 抽包判断

一个能力只有同时满足以下条件才允许移入 npm/composer 包：

- 不读取跨端目录，不读取宿主运行时配置。
- API 可以通过参数、回调、render hook、slot 或 config 表达，不要求用户改包源码。
- 行为稳定，至少两个真实场景复用。
- 边界测试能禁止项目别名、端内配置和业务 service 泄漏进包。
- 文档写清默认行为、可定制点和不支持的职责。

不满足这些条件时，先留在模板、模块或插件内。宁愿暴露问题并继续收口，也不要用本地兼容层掩盖 API 归属不清。
