# CRUD 搜索与筛选规范

TrueAdmin 标准 CRUD 由 `TrueAdminCrudTable` 统一管理列表查询状态、快速搜索、复杂筛选、分页和排序；`TrueAdminCrudPage` 只负责页面级包装。列表状态由 URL 驱动，刷新页面、复制链接、标签页恢复时都应保持同一份列表状态。

## URL 参数规则

筛选字段使用自然字段名，系统参数使用 `_` 前缀：

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

## 请求参数

默认情况下，请求参数沿用 URL 中的字符串格式。字段级 `transform` 可以额外添加或覆盖请求参数。

```tsx
{
  name: 'createdAt',
  label: '创建时间',
  type: 'dateRange',
  transform: ({ value }) => {
    const [start, end] = value.split(',');
    return { createdAtStart: start, createdAtEnd: end };
  },
}
```

分页和排序请求参数格式：

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

- 左侧：业务操作，例如新增、导出、批量操作。通过 `toolbarRender` 注入，核心 CRUD 负责放到标准 toolbar 左侧。
- 右侧：快速搜索、筛选按钮等通用查询能力。由核心 CRUD 统一渲染。

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
