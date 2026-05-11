# CRUD 搜索与筛选规范

TrueAdmin 标准 CRUD 由 `TrueAdminCrudTable` 统一管理列表查询状态、快速搜索、复杂筛选、分页和排序；`TrueAdminCrudPage` 只负责页面级包装。列表状态由 URL 驱动，刷新页面、复制链接、标签页恢复时都应保持同一份列表状态。

## 浏览器 URL 状态参数规则

浏览器 URL 只保存前端列表状态，用于刷新页面、复制链接和标签页恢复；它不是后端接口查询协议。筛选字段使用页面自然字段名，系统状态参数使用 `_` 前缀，避免和业务筛选字段冲突：

- `_page`：当前页
- `_pageSize`：每页条数
- `_sort`：排序字段
- `_order`：`asc` 或 `desc`

示例：

```text
?keyword=chen&status=enabled,pending&createdAt=2026-01-01,2026-01-31&_page=2&_pageSize=20&_sort=createdAt&_order=desc
```

数组类值统一用逗号拼接。空数组不写入 URL。筛选值约定不包含逗号；如果未来出现自由文本数组这类值可能包含逗号的场景，应为该字段增加自定义序列化或 `transform`。

## 快速搜索

快速搜索通过 `quickSearch` 显式开启，展示在表格右侧工具区，并位于刷新、列设置等通用表格能力之前。

```tsx
<TrueAdminCrudPage
  quickSearch={{
    name: 'keyword',
    placeholder: '搜索用户名 / 昵称',
  }}
/>
```

`name` 默认是 `keyword`。快速搜索通过回车或搜索按钮提交；点击清空按钮会立即提交空值，并从 URL 中移除对应参数。

## 复杂筛选

复杂筛选通过 `filters` 显式开启。没有配置 `filters` 时，不展示筛选按钮和筛选面板。

```tsx
<TrueAdminCrudPage
  filters={[
    { name: 'status', label: '状态', type: 'select', options: statusOptions },
    { name: 'roles', label: '角色', type: 'select', mode: 'multiple', options: roleOptions },
    { name: 'createdAt', label: '创建时间', type: 'dateRange' },
  ]}
/>
```

第一阶段支持的字段类型：

- `input`
- `select`
- `select` + `mode: 'multiple'`
- `dateRange`
- `custom` 兜底

筛选面板默认收起。页面可以设置 `defaultFiltersExpanded` 让面板默认展开。即使 URL 中已有复杂筛选条件，面板也不自动展开，只通过筛选按钮角标展示已应用的复杂筛选数量。

## 提交与重置

搜索和筛选都使用显式提交模型：

- 快速搜索通过回车或搜索按钮提交。
- 复杂筛选通过面板里的“查询”按钮提交。
- 提交快速搜索或复杂筛选后，`_page` 重置为 1。
- 重置会清空快速搜索、复杂筛选、排序和页码。
- 通过 toolbar 中的筛选按钮收起筛选面板时，未提交的临时编辑会丢弃，并恢复到当前 URL 中的已提交条件。

## 接口请求参数

`TrueAdminCrudTable` 会把浏览器 URL 状态转换成后端标准查询协议。前端 service 通过 `crudRequestOptions` / `@trueadmin/web-core/crud` 序列化为 bracket query，后端通过 `AdminQueryRequest` 读取。

标准请求对象：

```ts
{
  page: 1,
  pageSize: 20,
  keyword: 'chen',
  filter: {
    status: ['enabled', 'pending'],
    createdAt: ['2026-01-01', '2026-01-31'],
  },
  op: {
    status: 'in',
    createdAt: 'between',
  },
  sort: 'createdAt',
  order: 'desc',
}
```

序列化后的接口查询：

```text
page=1&pageSize=20&keyword=chen&filter[status][]=enabled&filter[status][]=pending&op[status]=in&filter[createdAt][]=2026-01-01&filter[createdAt][]=2026-01-31&op[createdAt]=between&sort=createdAt&order=desc
```

默认映射规则：

- `input`：`filter[field]=value`，默认 `op[field]` 为 `like`
- 单选 `select`：`filter[field]=value`，默认 `op[field]` 为 `=`
- 多选 `select`：`filter[field][]=...`，默认 `op[field]` 为 `in`
- `dateRange`：`filter[field][]=start&filter[field][]=end`，默认 `op[field]` 为 `between`

字段级 `operator` 可以覆盖默认操作符。字段级 `requestMode: 'param'` 可以把筛选值作为普通顶层参数传递。字段级 `requestName` 可以把前端字段名映射到后端字段名；设置 `requestName: false` 时，该字段不会自动进入请求参数。

字段级 `transform` 可以完全接管该筛选项的请求参数，并额外添加或覆盖 `filter` / `op` / 顶层参数：

```tsx
{
  name: 'createdAt',
  label: '创建时间',
  type: 'dateRange',
  transform: ({ value }) => {
    const [start, end] = value.split(',');
    return {
      filter: { created_at: [start, end] },
      op: { created_at: 'between' },
    };
  },
}
```

分页和排序始终发送为后端标准字段：

```ts
{
  page: 1,
  pageSize: 20,
  sort: 'createdAt',
  order: 'desc',
}
```

## Toolbar 分区

标准表格工具栏遵循以下分区：

- 页面标题右侧：页面级主操作，例如新增。通过 `TrueAdminCrudPage.extra` 注入。
- toolbar 左侧：列表上下文业务操作，例如状态快速筛选、批量操作。通过 `toolbarRender` 注入。
- toolbar 右侧：通用查询和列表工具，顺序为快速搜索、高级筛选、导入/导出、刷新。导入/导出使用 `importExport` 开启；少量页面级特殊工具可以通过 `toolbarExtraRender` 插入到导入/导出前。

标准 CRUD 页面使用 Ant Design 基础组件实现，不依赖 ProTable。业务需要行选择时，通过 `rowSelection` 传入；业务需要横向滚动时，通过 `tableScrollX` 传入。

## 组件边界

`TrueAdminCrudTable` 是标准 CRUD 的核心表格组件，只负责查询状态、筛选、toolbar、alert、table、pagination 和表格区域高度测量。它可以直接嵌入详情页、弹窗、抽屉或复杂自定义页面。

`TrueAdminCrudPage` 是页面级包装，负责 `TrueAdminPage`、页面标题、页面 extra 和可选左侧区域。左树右表第一阶段不单独封装组件，直接通过 `aside` 插槽实现：

```tsx
<TrueAdminCrudPage
  title="用户管理"
  resource="system.users"
  aside={<DepartmentTree />}
  asideWidth={280}
  columns={columns}
  service={service}
/>
```

如果业务页面需要更复杂的分栏、嵌套布局或多块列表，应直接组合 `TrueAdminPage`、`TrueAdminPageSection` 和 `TrueAdminCrudTable`，不要为了单个场景新增专用 CRUD 页面组件。


## 数据生命周期

`TrueAdminCrudTable` 的数据请求、刷新和写操作由 `useCrudTableData` 管理。表格组件只组合 toolbar、筛选、表格、分页和布局测量，不在组件主体里直接维护请求流程。

标准生命周期顺序：

1. `beforeRequest(params, context)`：请求前拦截。返回 `false` 时中断本次列表请求。
2. `transformParams(params, context)`：把 URL/筛选状态转换成接口请求参数。
3. `service.list(params)`：执行业务列表请求。
4. `transformResponse(response, context)`：规范化后端响应。
5. `onLoadSuccess(response, context)`：列表加载成功后通知业务。
6. `onLoadError(error, context)`：列表加载失败后通知业务。返回 `false` 时跳过全局错误中心。

新增、编辑、删除统一通过 render context 里的 `action` 调用：

```tsx
toolbarRender={({ action }) => (
  <UserForm
    onCreate={(values) => action.create?.(values)}
    onUpdate={(id, values) => action.update?.(id, values)}
  />
)}
```

这样可以保证 `onCreateSuccess`、`onUpdateSuccess`、`onDeleteSuccess` 和自动刷新流程都能执行。业务如果绕过 `action` 直接调用 `service.create/update/delete`，核心 CRUD 不会感知这次写操作。

导入/导出属于列表通用工具能力，推荐通过 `importExport` 开启并放在表格右侧工具区、刷新按钮之前。导出默认提供“导出当页 / 导出选中 / 导出当前筛选结果”三个入口，实际导出数量和异步任务策略由后端控制。导入第一阶段使用标准弹窗流程：模板下载、拖拽/选择文件、确认导入；不内置粘贴导入。确认导入成功后核心会自动刷新列表。

## 行操作

标准表格默认在配置了 `service.delete` 时展示删除操作列，并使用 `resource` 自动推导权限码。页面可以通过 `rowActions` 扩展或关闭行操作：

```tsx
<TrueAdminCrudPage
  rowActions={{
    width: 160,
    render: ({ record, action }) => (
      <Button type="link" size="small" onClick={() => openEdit(record)}>
        编辑
      </Button>
    ),
  }}
/>
```

- `rowActions.render`：在默认删除按钮前追加业务操作。
- `rowActions.delete = false`：保留操作列，但不展示默认删除。
- `rowActions = false`：完全关闭核心行操作列。
- `rowActions.title` / `rowActions.width`：覆盖操作列标题和宽度。

删除成功提示由核心提供兜底。如果页面配置了 `onDeleteSuccess`，成功反馈由业务钩子负责，避免重复提示。

## 空态与错误态

标准空态使用 AntD `Empty.PRESENTED_IMAGE_SIMPLE`。列表请求失败时，表格区展示 AntD `Result` 错误态和刷新按钮，并继续把错误交给全局错误中心，除非 `onLoadError` 返回 `false`。

页面可以用 `emptyRender` 和 `errorRender` 覆盖表格区展示：

```tsx
<TrueAdminCrudTable
  emptyRender={({ action }) => <Empty description="暂无用户" />}
  errorRender={({ action }) => <Result status="error" extra={<Button onClick={action.reload}>重试</Button>} />}
/>
```

错误态只替换表格主体区域，不改变 toolbar、筛选、分页和页面外框，避免业务页面自己重复搭建整套 CRUD 结构。

## 表格高度职责

表格高度由 `useCrudTableLayout` 统一测量，目标是让标准 CRUD 在 `layout="workspace"` 下填满页面可用空间，并在高级筛选展开/收起后刷新 `scroll.y` 和空态高度。

高度职责分层：

- `TrueAdminPage(layout="workspace")` 决定页面是否占满 AppShell 内容区。
- `TrueAdminCrudPage` 决定标题卡片、左侧 aside 和表格主区的组合结构。
- `TrueAdminCrudTable` 决定 toolbar、筛选、summary、table、pagination 的内部高度分配。
- 业务内容只负责自己的表单、树、图表、弹窗内容高度，不手写全局 header、tabs、footer 计算。

如果页面是左树右表，优先使用 `TrueAdminCrudPage` 的 `aside` 插槽。如果只是需要在复杂页面里放一个表格，直接使用 `TrueAdminCrudTable`，不要复制 CRUD 页面结构。

## 后端统计信息

后端列表接口可以在分页结果中通过 `meta` 返回扩展信息，例如状态统计、分类统计或汇总金额：

```ts
{
  items: [],
  total: 128,
  page: 1,
  pageSize: 20,
  meta: {
    statusStats: {
      all: 128,
      enabled: 86,
      pending: 21,
      disabled: 21,
    },
  },
}
```

`TrueAdminCrudTable` 会保留完整列表响应，并通过 render context 暴露 `response`。页面可以在 `summaryRender`、`toolbarRender`、`tableExtraRender`、`tableRender`、`tableViewRender`、`tableAlertRender` 中读取 `response.meta`，用于渲染状态统计、快速筛选或自定义表格区域。

`summaryRender` 是页面标题下方、高级筛选上方的独立插槽。CRUD 核心只提供插槽位置，不内置卡片或图表样式；业务页面应自行决定使用 `Card`、`StatisticCard`、图表或提示组件。`meta` 只是列表响应扩展的默认便利能力，不是统计区的数据来源限制；复杂统计可以在 `summaryRender` 内通过业务 service、React Query 或其他数据层独立请求。

状态类快速筛选优先使用 `TrueAdminQuickFilter`，默认放在 `toolbarRender` 左侧业务区，与批量操作同区展示。它基于 AntD `Segmented`，数量通过角标展示；数量为 0 时不展示，超过 99 时展示 `99+`。

## 后续优化记录

以下问题来自消息中心等页面的实际使用反馈，后续优化 CRUD 组件时优先处理：

1. `filter` 的 `label` 和 `placeholder` 容易混乱。筛选项应默认使用 `label` 作为 `placeholder`，页面只在确实需要不同提示文案时显式覆盖，减少重复配置和误配。
2. 查询状态和外部插槽联动还不够顺手。`toolbarRender`、`summaryRender`、`aside` 等外部区域需要更直接、更类型安全地读写 CRUD 查询状态，减少通过 `extraQuery` 手动桥接的样板代码。
3. 查询参数类型安全需要继续推进。`TrueAdminCrudPage` / `TrueAdminCrudTable` 后续应支持查询参数泛型，例如 `TrueAdminCrudPage<TRecord, TQuery>`，让 `service.list`、`transformParams`、`extraQuery` 和外部查询控制器都能获得更准确的类型约束。
4. 封装 `TrueAdminPrimaryCell`。表格主信息列中常见“固定前缀/类型 Tag + 标题 + 描述 + 附加状态”的布局，应沉淀为通用展示组件，减少业务页面重复编写列渲染结构。
