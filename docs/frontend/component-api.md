# 前端组件 API 规范

TrueAdmin 前端组件必须优先提供稳定 API 和定制点，禁止让开发者通过修改 `@trueadmin/*` 包源码完成项目定制。组件是否放进 npm 包，取决于它是否能做到业务无关和端内事实隔离。

## API 基准

框架组件 API 默认包含以下能力：

- `className` / `style`：组件根节点定制。
- `classNames` / `styles`：内部关键区域定制，key 必须稳定并写入类型。
- 原生组件 props 透传：例如 `buttonProps`、`searchProps`、`treeProps`、`segmentedProps`。
- render hook：用于替换局部结构，例如 `emptyRender`、`errorRender`、`notFoundContentRender`。
- lifecycle callback：用于接入业务流程，例如 `onLoadSuccess`、`onLoadError`。
- 受控 / 非受控：表单类组件优先支持 `value`、`defaultValue`、`onChange`。

不允许：

- 在组件内部读取项目级 store、config、router 或业务 service。
- 通过隐藏全局变量控制行为。
- 用本地转发文件长期伪装包 API，例如 `@core/action` 转发到 `@trueadmin/web-antd/action`。

## 命名基准

公开框架组件、公开领域组件和开发者直接使用的 TrueAdmin Hook 必须使用 `TrueAdmin` 前缀，例如 `TrueAdminPage`、`TrueAdminPermission`、`TrueAdminUserSelect`、`useTrueAdminUpload`。App 壳内部组件、页面私有组件、内部控制器 Hook 和纯协议工具不强制加前缀，例如 `AppTabsBar`、`RoleFormModal`、`useCrudTableData`、`streamRequest`。

完整规则见 [前端命名与目录边界规范](naming-and-structure.md)。

## 组件归属

### 可以进入 `@trueadmin/web-antd`

这类组件必须只依赖 React + Ant Design，所有数据和业务行为由调用方传入。

- 操作栏、确认操作、状态快速筛选、树筛选。
- 远程下拉基础组件，调用方提供 `fetchOptions`、`fetchByValues`、`getLabel`、`getValue`。
- 无领域语义的展示、反馈、选择、过滤控件。

### 留在 Admin 模板

这类组件依赖 Admin 端事实，暂不进入通用包。

- AppLayout、AppTabsBar、工作区、菜单、权限、当前用户、消息铃铛。
- `TrueAdminCrudPage` / `TrueAdminCrudTable`，当前仍属于 Admin 管理端框架能力。
- `TrueAdminRemoteTableSelect` 和 `TrueAdminTablePicker`，因为依赖模板 CRUD、弹窗和 i18n。
- 用户、部门、角色、商品、客户等带明确业务领域的选择器。

### 留在模块或插件

组件与领域模型强绑定时，放在所属模块或插件中，通过公开出口导出：

```ts
import { TrueAdminUserSelect } from '@modules/system';
```

不要从其他模块深层引用 `pages` 或私有工具。

## CRUD 查询组件

标准 CRUD 查询状态分为两层：

- 浏览器 URL：保存页面状态，使用 `page`、`pageSize`、`sorts[n]` 和页面自然字段名。
- 后端请求：由 `@trueadmin/web-core/crud` 序列化为 `page/pageSize/keyword/filters[n]/sorts[n]/params[key]`。

`TrueAdminCrudPage` 和 `TrueAdminCrudTable` 通过以下 API 支持左树右表、快速筛选和外部控件联动：

- `aside` / `asideWidth`：左树右表。
- `toolbarRender`：左上角状态筛选、批量操作、业务按钮。
- `summaryRender`：统计卡片或状态概览。
- `extraQuery`：让外部控件参与请求参数。
- render context 中的 `query`：读写 URL 状态，包含 `values`、`hasName`、`setValue`、`setValues`、`resetValues`。

外部筛选控件应通过 `query.setValue()` 或 `query.setValues()` 更新页面状态，不直接调用 service。这样 URL、表格请求、刷新和标签页恢复才能保持一致。

## 远程选择器

远程选择器分两级：

- `TrueAdminRemoteSelect`：通用远程下拉，属于 `@trueadmin/web-antd/remote-select`。
- 领域选择器：例如 `TrueAdminUserSelect`，属于具体模块或插件。

领域选择器应包装 `TrueAdminRemoteSelect`，但 API 要保留必要透传能力：

- `fetchOptions` / `fetchByValues` 可覆盖。
- `getValue` / `getLabel` / `optionRender` 可覆盖。
- `onLoadOptionsError` / `onLoadOptionsSuccess` 可接入业务反馈。
- `notFoundContentRender` 可替换空状态。

这样开发者可以定制数据来源、展示和交互，不需要修改 npm 包或模板核心组件。

## 文件上传

文件上传分三层，避免业务页面重复拼接口细节：

- `uploadTrueAdminFile()` / `uploadTrueAdminRemoteFile()` 是纯 API 层，负责本地上传、OSS 预签名直传兜底和远程 URL 转存。
- `useTrueAdminUpload()` 是开发者优先使用的 hook，统一维护 `uploading`、`error`、`reset`，默认使用 `category: 'attachment'` 和 `visibility: 'public'`，调用时可覆盖。
- `TrueAdminImageUpload` / `TrueAdminAttachmentUpload` 是表单组件层，只负责预览、列表、删除、展示名编辑和值归一化；自定义上传函数应通过 `upload` 传入，示例页面可以不传 `upload`，只生成本地临时值。

```tsx
const { upload, uploadRemote, uploading } = useTrueAdminUpload({
  category: 'announcement',
  visibility: 'public',
});

<TrueAdminAttachmentUpload multiple upload={upload} />;
```

业务表单保存附件时只保存附件快照字段，不保存 Ant Design Upload 的临时对象。
