# 前端命名与目录边界规范

本文定义 TrueAdmin Web 管理端的组件、Hook、方法和目录归属边界。新增前端能力时先按本文判断归属，再写代码。

## TrueAdmin 前缀边界

公开、稳定、面向模块/插件开发者复用的 API 必须使用 `TrueAdmin` 前缀。包括：

- `core/*/index.ts` 对外导出的框架组件，例如 `TrueAdminPage`、`TrueAdminCrudTable`、`TrueAdminPermission`、`TrueAdminLoadingContainer`、`TrueAdminStreamProgressPanel`。
- `@trueadmin/*` npm 包导出的组件、类型和 Hook，例如 `TrueAdminRemoteSelect`、`TrueAdminActionBar`。
- 模块或插件通过公开出口导出的领域组件，例如 `TrueAdminUserSelect`、`TrueAdminDepartmentSelect`。
- 开发者直接调用、且承载 TrueAdmin 约定的 Hook，例如 `useTrueAdminUpload`、`useTrueAdminDownload`。

不加 `TrueAdmin` 前缀的情况：

- App 壳内部实现，例如 `AppLayout`、`AppTabsBar`、`useRouteTabs`、`useAppTabsBarController`。
- 页面私有组件和页面模型，例如 `RoleFormModal`、`MenuTableColumns`、`createMenuFilters`。
- 组件内部控制器 Hook，例如 `useCrudTableData`、`useImageUploadController`、`useAttachmentUploadController`。
- 纯协议、纯工具、纯 service 方法，例如 `streamRequest`、`requestMaybeStream`、`defineModule`、`toCrudRequestParams`、`adminUserApi`。

纯函数如果直接操作 TrueAdmin 平台资源，可以在动词后带 `TrueAdmin`，例如 `uploadTrueAdminFile()`、`uploadTrueAdminRemoteFile()`。这类命名表达的是“上传到 TrueAdmin 文件系统”，不是 React 组件品牌。

## 类型命名

公开组件和公开 Hook 的 props/result/type 使用同名 `TrueAdmin` 前缀：

```ts
export type TrueAdminLoadingContainerProps = {};
export type TrueAdminStreamProgressPanelStatus = 'idle' | 'processing';
export type UseTrueAdminUploadResult = {};
```

内部组件 props 不强制加 `TrueAdmin`，优先按局部组件名命名，例如 `RoleFormModalProps`、`UseImageUploadControllerOptions`。

## Hook 命名

Hook 先判断是否面向开发者公开：

- 公开框架 Hook：`useTrueAdminXxx`，例如 `useTrueAdminUpload`、`useTrueAdminDownload`。
- 上下文读取 Hook：使用上下文自身语义，例如 `useI18n`、`useCurrentUserQuery`。
- 内部控制器 Hook：使用局部对象名，例如 `useCrudTableSelection`、`useRouteTabs`、`useAnnouncementManagementPage`。

不要为了统一视觉效果把所有 Hook 都改成 `useTrueAdminXxx`。`useTrueAdminXxx` 应该让调用者明确知道它正在使用 TrueAdmin 的平台约定、默认行为或运行时能力。

## 目录归属

`app/` 放当前 Admin 应用壳和运行时装配：路由、Provider、布局、登录页、403/404、RouteTabs、顶部栏、布局设置等。`AppTabsBar` 和 `useRouteTabs` 属于 App 壳内部能力，放在 `app/layout/tabs`，不放进 `core`。

`core/` 放 TrueAdmin Admin 模板框架能力：请求、权限、菜单、图标、页面容器、CRUD、上传、流式响应、通知、选择器、弹窗、i18n runtime 等。每个 `core/<feature>` 必须有清晰公开出口；跨模块/插件使用时优先从 `@core/<feature>` 导入。

`shared/` 只放不承载 TrueAdmin 框架规则的普通工具和 UI。`crud`、`permission`、`menu`、`layout viewport`、`module registry`、`plugin registry`、`i18n runtime` 不进入 `shared`。

`modules/<module>` 和 `plugins/<vendor>/<plugin>` 放领域事实。用户、部门、角色、商品、客户等领域组件留在所属模块或插件，通过公开出口导出。

## 文件数量与拆分规则

文件多不等于目录错误，关键看职责是否单一。`core/crud`、`core/upload` 这类复杂框架能力可以拥有较多文件，但必须保持同一业务轴线和公开出口清晰。

当一个目录同时满足任意两条时，应拆分子目录或收窄公开 API：

- 顶层文件超过 12 个，且混合了组件、Hook、工具、测试、类型。
- 调用方开始深层引用多个内部文件。
- 文件名需要靠很长前缀才能区分职责。
- 新增能力需要解释“这个文件为什么在这里”。

推荐拆分方式：

```text
core/upload/
  index.ts
  TrueAdminAttachmentUpload.tsx
  TrueAdminImageUpload.tsx
  hooks/
  internal/
  utils/
```

第一阶段不为了形式感机械移动文件。目录重构应与真实职责收口一起做，避免无意义路径 churn。

## 导入规则

跨目录复用优先走公开出口：

```ts
import { TrueAdminPermission } from '@core/auth';
import { TrueAdminLoadingContainer } from '@core/loading';
import { TrueAdminPage, TrueAdminPageSection } from '@core/page';
```

同目录内部实现使用相对路径。页面私有组件只能被同页面目录内文件引用，不通过模块公开出口导出。
