# 页面容器规范

页面容器负责沉淀管理端页面的基础结构，不负责替业务内容决定最终高度，也不替请求层管理数据状态。第一阶段以轻量、可组合、接近 Ant Design / ProLayout 的后台体验为准。

## 组件分层

- `TrueAdminPage`：页面根容器，统一 ErrorBoundary、页面切换动效、路由 contentPadding、可选页头、页面级加载和高度模式。默认不展示页内 title，避免和 AppShell 的面包屑、标签栏重复。
- `TrueAdminPageSection`：页面内区块容器，适合详情块、表格块、表单块、抽屉/弹窗中的局部区域。支持可选标题、描述、操作区、surface、区块级加载。
- `TrueAdminSplitPage`：左右分栏页面，适合左树右表、左目录右详情、左筛选右列表。高度来自 `WorkspaceViewport`，分栏内部自己滚动。
- `LoadingContainer`：只负责加载展示、内容保留和高度过渡，不承担页面容器高度约束。页面、区块、分栏决定布局语义，业务内容决定真实内容高度。

## 默认规则

- 页面默认使用 `<TrueAdminPage>` 包裹。
- `layout="natural"` 是默认模式，适合工作台、详情页、表单页和普通配置页；内容超过可视区时允许外层 content 滚动。
- `layout="workspace"` 适合左树右表、纯表格、固定高度编辑器等工作区页面；页面外框精确占满右侧可用空间，不让外层 content 出滚动条，内部面板或表格自己滚动。
- 普通页面默认不启用 `showHeader`。只有页面确实需要页内标题、说明或页面级操作时才设置 `showHeader`。
- `fullHeight` 只表示在当前布局内填满剩余空间；需要工作区精确高度时使用 `layout="workspace"`，不要手写 `100vh` 或重复计算 header、tabs、footer 高度。
- 页面内重复内容优先使用 `TrueAdminPageSection`，但不要把卡片再套卡片；`surface` 只用于确实需要独立面板边界的区域。
- 表格固定高度、左右分栏、树表页面优先消费 `WorkspaceViewport` 或 `TrueAdminSplitPage`，不要让 body 滚动策略散落在业务页面里。


## 标准 CRUD 页面

标准列表页优先使用 `TrueAdminCrudPage`。它固定采用 `TrueAdminPage layout="workspace"`，页面标题卡片、可选左侧区域、表格工作区会共同占满 AppShell 的 content 可用高度。

纯表格页面：只传 `columns`、`service`、`filters`、`quickSearch` 等 CRUD 配置。页面级新增、导出等主操作放在 `extra` 或 `toolbarRender`，不要在页面外再包一层自定义滚动容器。

左树右表页面：使用 `aside`、`asideWidth`、`asideGap` 扩展左侧区域。左侧树的搜索、刷新、展开收起属于树组件职责；右侧表格高度仍由 `TrueAdminCrudTable` 统一测量。

复杂组合页面：如果页面不是标准“标题 + 可选侧栏 + 单表格”结构，可以直接组合 `TrueAdminPage`、`TrueAdminPageSection` 和 `TrueAdminCrudTable`。这样可以复用标准表格查询、生命周期、空态、错误态和分页能力，同时由业务页面控制外层布局。

不要在业务页手动计算 `100vh - header - tabs - footer`。AppShell 和页面容器已经提供工作区高度，CRUD 内部会继续计算表格主体可用高度。

## 加载态规则

- 页面首次进入或路由级加载由路由/页面负责。
- 编辑页、详情页、表格区、抽屉、弹窗里的接口加载，优先放在对应 `TrueAdminPageSection` 或 `LoadingContainer` 上。
- `initialLoadingHeight` 只表示首次加载占位高度，不表示容器最小高度。内容加载完成后应允许按照真实内容高度收缩或增长。
- 已有内容刷新时默认 `keepLoadingChildren`，避免内容突然消失；是否遮罩后台刷新由业务显式决定。

## 分栏页面

`TrueAdminSplitPage` 第一阶段只提供左右两栏，默认使用 `layout="workspace"`。左侧宽度通过 `leftWidth` 配置，默认 280px；右侧自动占满剩余空间。分栏容器默认高度为 `100%`，即占满 `TrueAdminPage` body 剩余空间，也可以通过 `height` 显式覆盖。

分栏内部滚动属于分栏面板职责。左侧树、右侧表格、详情列表可以各自决定是否继续细分滚动区域。

## Demo

开发模式菜单中提供 `/examples/page-container`，用于验证标准页头、区块加载和左右分栏固定高度。新增页面容器能力时，优先在该 demo 中补一个最小可观察案例。
