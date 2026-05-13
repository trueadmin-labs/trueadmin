# 页面容器分层规范

页面容器负责沉淀管理端页面的基础结构：标题、操作区、内容滚动、底部操作、版权显示和工作区高度。容器不替业务决定字段布局，不接管请求数据状态，也不在业务页里重复计算 AppShell 的 header、tabs、footer 高度。

第一阶段目标是接近 Ant Design / ProLayout 的后台工作区体验：页面结构稳定、可组合，列表页尽量不出现外层 content 滚动条，表单和详情页有清晰的固定操作入口。

## 容器选择

| 场景 | 推荐容器 | 高度模式 | 标题与操作 | 滚动职责 | 版权显示 |
| --- | --- | --- | --- | --- | --- |
| 工作台、普通配置页、轻量自定义页 | `TrueAdminPage` | 默认 `natural` | 默认不展示页内标题；需要时 `showHeader` | 外层 content 可滚动 | 跟随路由/全局配置 |
| 标准列表、纯表格、左树右表 CRUD | `TrueAdminCrudPage` | 固定 `workspace` | 标题卡片左侧标题/副标题，右侧页面主操作 | `TrueAdminCrudTable` 内部滚动 | 通常不依赖版权区 |
| 复杂表单、长流程编辑页 | `TrueAdminFormPage` | 默认 `workspace` | 固定页头，右侧放提交、保存、取消等主操作 | 页面内容区内部滚动 | 建议路由设置 `layout.showFooter=false` |
| 复杂详情、只读工作流页 | `TrueAdminDetailPage` | 默认 `workspace` | 固定页头，右侧放审核、编辑、返回等主操作 | 页面内容区内部滚动 | 建议路由设置 `layout.showFooter=false` |
| 弹窗承接复杂表单/详情/选择器 | `TrueAdminPageModal` | Modal 内部 | 标题用 Modal header，主操作用 Modal footer | Modal body 内部滚动 | 不显示页面版权 |
| 左目录右内容、非 CRUD 分栏 | `TrueAdminSplitPage` | 默认 `workspace` | 左右面板可各自有标题和操作 | 左右面板各自滚动 | 跟随承载页面规则 |
| 页面局部卡片/分块 | `TrueAdminPageSection` | 跟随父容器 | 区块标题和区块操作 | 区块 body 自己决定 | 不处理版权 |

## TrueAdminPage

`TrueAdminPage` 是页面根容器，统一 ErrorBoundary、页面切换动效、路由 contentPadding、可选页头、页面级加载和高度模式。

- `layout="natural"` 是默认模式，适合工作台、普通详情、配置页和内容高度不固定的页面；内容超过可视区时允许外层 content 滚动。
- `layout="workspace"` 适合固定工作区页面，例如表格、分栏、复杂表单和编辑器；页面占满 AppShell 内容区，不让外层 content 因内部动画或高度变化产生额外滚动条。
- `showHeader` 默认关闭。只有页面确实需要页内标题、说明或页面级操作时才打开。
- `contentPadding` 默认跟随路由布局配置，业务页不要再手写整页 padding 包裹层。
- `fullHeight` 只表示在当前布局内填满父容器；需要精确工作区高度时使用 `layout="workspace"`。

通用自定义页优先从 `TrueAdminPage` 开始，再按内容复杂度组合 `TrueAdminPageSection`、`TrueAdminSplitPage` 或 `TrueAdminCrudTable`。

## TrueAdminCrudPage

标准列表页优先使用 `TrueAdminCrudPage`。它固定采用 `TrueAdminPage layout="workspace"`，并负责标题卡片、可选左侧区域和表格工作区组合。

标题区规则：

- 左侧使用“标题 + 副标题”同一行展示，整体左对齐并垂直居中。
- 副标题只做辅助说明，过长时单行省略，不换行撑高标题卡片。
- 右侧 `extra` 放页面级主操作，例如新增、页面级导入入口或批量创建入口。
- 表格通用工具，例如快速搜索、高级筛选、导入/导出、刷新，放在 `TrueAdminCrudTable` toolbar 右侧。
- 列表上下文业务操作，例如状态快速筛选、批量操作，放在 toolbar 左侧。

滚动规则：

- `TrueAdminCrudPage` 自身不滚动，外层 content 不滚动。
- `TrueAdminCrudTable` 负责 toolbar、筛选面板、表格、分页和空态高度测量。
- 高级筛选展开/收起后，由表格组件刷新 `scroll.y` 和空态高度。
- 左树右表使用 `aside`、`asideWidth`、`asideGap`，不要单独新增“左树右表页面容器”。左侧树的搜索、刷新、展开收起属于树组件职责。

复杂组合页面如果不是“标题 + 可选侧栏 + 单表格”，可以直接组合 `TrueAdminPage`、`TrueAdminPageSection` 和 `TrueAdminCrudTable`，继续复用标准查询状态、生命周期、空态、错误态和分页。

## TrueAdminFormPage

`TrueAdminFormPage` 用于复杂表单和长流程编辑页。它默认使用 `workspace`，页头固定在内容区顶部，内容区独立滚动。

标题与操作规则：

- 页面标题固定在顶部，背景跟随 AppShell header/tabs 的通透背景，避免滚动时标题区域突兀。
- 标题和副标题使用紧凑单行展示；副标题不换行，避免固定标题占用过多高度。
- 提交、保存草稿、取消、预览等主操作优先放在页头 `extra`。
- 第一阶段不推荐默认使用底部悬浮 footer。只有业务明确需要底部操作条时，再使用 `footer`，并设置合适的 `footerMode`。

滚动和版权规则：

- 表单内容放在 `trueadmin-form-page-content`，由内容区内部滚动。
- 复杂表单页建议在路由 meta 中设置 `layout: { showFooter: false }`，避免固定操作区和版权区抢占空间。
- 不要在表单页手动计算 `100vh - header - tabs - footer`。

## TrueAdminDetailPage

`TrueAdminDetailPage` 是详情页语义入口，底层复用 `TrueAdminFormPage` 的固定标题、内部滚动和操作区规则。它适合复杂详情、审批详情、订单详情、只读流程页等页面。

详情页规则：

- 详情页默认是只读内容，不承担表单校验和提交状态；需要编辑时跳转编辑页或打开编辑弹窗。
- 审核、编辑、打印、导出、返回等操作放在页头 `extra`。
- 大块只读信息优先使用 Ant Design `Card`、`Descriptions`、`Table`、`Timeline`、`Statistic` 等基础组件组合。
- 附件详情使用上传组件只读模式，允许预览和下载。
- 复杂详情页同样建议关闭页面版权：`layout: { showFooter: false }`。

如果详情页非常简单，只是几个字段的自然文档流，可以直接使用 `TrueAdminPage layout="natural"`，不必强制使用 `TrueAdminDetailPage`。

## TrueAdminPageModal

`TrueAdminPageModal` 用于弹窗里承接页面型内容，例如复杂表单、复杂详情、表格选择器。

- Modal header 承接标题，不在 body 内再渲染一套页面标题。
- Modal footer 承接确认、取消、提交、审核等主操作。
- body 内部通过 `TrueAdminScrollShadow` 滚动，header/footer 保持可见。
- 默认宽度为 `min(1440px, calc(100vw - 48px))`，高度超过视口时上下保留间距。
- body 背景跟随页面背景色，暗色模式使用暗色页面背景。
- 弹窗内容可以复用表单页/详情页里的 body 组件，但不要在 Modal body 内再嵌套完整 `TrueAdminPage`。

## TrueAdminPageSection

`TrueAdminPageSection` 是页面内区块容器，适合详情块、表格块、表单块、抽屉/弹窗中的局部区域。

- `surface` 只用于确实需要独立面板边界的区域。
- 不要把卡片再套卡片；如果内部已经是 Ant Design `Card`，外层 section 通常不需要 `surface`。
- 区块级加载优先放在 `TrueAdminPageSection` 或 `TrueAdminLoadingContainer`，不要让整页 loading 覆盖局部刷新。
- `fullHeight` 只让区块在父级 flex 布局中填满剩余空间，区块 body 是否滚动由业务内容决定。

## 标题与操作区标准

- 页面级标题只出现一次。AppShell 已有面包屑和标签栏时，普通页面默认不再渲染页内标题。
- CRUD 标题卡片负责列表页标题；Form/Detail 固定页头负责工作流页面标题；Modal header 负责弹窗标题。
- 页面级主操作放在页面标题右侧，例如新增、提交、审核、打开弹窗。
- 表格通用操作放在表格 toolbar 右侧，例如搜索、筛选、导入导出、刷新。
- 表格上下文操作放在 toolbar 左侧，例如状态筛选、批量操作。
- 区块内局部操作放在 `TrueAdminPageSection.extra`，不要提升为页面操作。

## 滚动标准

- AppShell 的 content 滚动只用于自然内容页。
- 工作区页面使用 `layout="workspace"`，由页面容器吃满可用高度，并把滚动下放到内部区域。
- CRUD 表格滚动由 `TrueAdminCrudTable` 管理。
- 复杂表单/详情滚动由 `TrueAdminFormPage` / `TrueAdminDetailPage` 的 content 管理。
- 弹窗滚动由 `TrueAdminPageModal` body 管理。
- 页面切换动效不应该改变外层 content 的滚动条状态。

## 版权显示标准

- 普通自然页跟随全局或路由级 `layout.showFooter`。
- CRUD 工作区页通常不依赖版权区，页面高度由 AppShell workspace 计算。
- 复杂表单、复杂详情、编辑器、流程页建议关闭版权：`layout: { showFooter: false }`。
- 固定页头或底部操作区不应遮挡版权；如果页面需要固定操作区，优先关闭版权，而不是让业务页自行补间距。

## 导入规范

框架容器能力通过公开出口导入，业务页不要深层引用具体文件：

```ts
import { TrueAdminPage, TrueAdminPageSection } from '@core/page';
import { TrueAdminCrudPage, type CrudColumns } from '@core/crud';
import { TrueAdminPageModal } from '@core/modal';
```

历史代码中的 `@/core/page/TrueAdminPage` 等路径可以逐步迁移，不要求一次性全量替换。

## 通用组件补充

框架级通用组件只沉淀无领域归属的交互模式，组件 API 参考 Ant Design：优先透传原生组件 props，补充 `className`、`style`、`classNames`、`styles` 和 render/trigger 扩展点。

- `TrueAdminActionBar`：由 `@trueadmin/web-antd/action` 提供，统一页面标题、详情页、弹窗 footer 和表格上下文操作。支持 `actions`、`max`、确认操作、成功/失败反馈、更多下拉和 `children` 混排。
- `TrueAdminPermissionButton`：按钮级权限封装。基于 `TrueAdminPermission` 能力，支持无权限隐藏或禁用、tooltip、confirm 和 AntD Button props。
- `TrueAdminResultState`：页面、区块、弹窗内统一结果态。支持 `empty`、`403`、`404`、`500`、`error`、`success` 等 AntD Result 状态，并提供紧凑模式和重试入口。
- `TrueAdminUploadPreview`：附件预览弹窗。图片和 PDF 直接预览，其他文件提供下载兜底；支持受控/非受控 open 和 trigger。
- `TrueAdminAuditPanel`：审计/审批信息面板。复用 `TrueAdminAuditTimeline`，补充标题、描述、当前状态和操作区。
- `downloadFile` / `useTrueAdminDownload`：统一文件下载能力。业务只需要传入 URL 和可选文件名，框架负责 fetch、Blob、Content-Disposition 文件名解析和临时链接触发下载；React 场景通过 hook 默认展示“已开始下载/下载失败”反馈，降低浏览器拦截或静默失败带来的困惑。

业务域组件，例如用户选择器、部门选择器、商品选择器，不放进这些框架通用组件目录，应继续由所属模块或插件通过公开出口提供。

## Demo

开发模式菜单中提供 `/examples/page-container`，用于验证标准页头、区块加载和左右分栏固定高度。

复杂表单示例使用 `TrueAdminFormPage`；复杂详情示例使用 `TrueAdminDetailPage`；CRUD 示例和用户管理使用 `TrueAdminCrudPage`。新增页面容器能力时，优先在对应 demo 中补一个最小可观察案例。
