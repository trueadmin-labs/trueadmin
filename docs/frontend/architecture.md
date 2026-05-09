# 前端总体架构

TrueAdmin Web 管理端采用自研模块化前端底座，复用 Ant Design v6 和 ProComponents 3 的成熟后台组件能力。Ant Design Pro v6 是布局、主题、交互和产品体验参考，不作为工程底座；MineAdmin 是模块化、插件化、CRUD 工作流和后台工作区体验参考。

## 技术栈

第一版使用 Vite、React、TypeScript、React Router、Ant Design v6、ProComponents 3、TanStack Query、alova、Zustand、MSW、Tailwind v4、antd-style、Biome 和 Vitest。

技术边界：React Router 负责路由；Ant Design / ProComponents 负责后台组件和布局；TanStack Query 负责服务端状态；alova 负责 HTTP 请求和响应解包；Zustand 负责前端 UI 状态；MSW 只用于最小开发 Mock；Tailwind 只做布局工具；antd-style 用于消费 Ant Design token 的框架样式。

## 目录结构

```text
web/
  config/
    app.ts
    layout.ts
    theme.ts
    request.ts
    crud.ts
    plugin.ts
    env.ts
    index.ts
  src/
    main.tsx
    app/
      App.tsx
      providers/
      router/
      layout/
      styles/
    core/
      module/
      plugin/
      http/
      query/
      auth/
      menu/
      icon/
      dict/
      store/
      layout/
      page/
      crud/
      i18n/
      error/
    shared/
      components/
      hooks/
      utils/
    generated/
      .gitkeep
      openapi/
    modules/
      system/
        manifest.ts
        pages/
        services/
        components/
        hooks/
        types/
        locales/
    plugins/      # 插件 Web 运行时目录，由安装器复制生成；Vite 只扫描这里
```

`generated` 是生成代码目录，架构上保留，第一版可以为空或只保留 `.gitkeep`。业务代码原则上不手改 `generated`。OpenAPI 生成能力完善后，输出到 `src/generated/openapi`。

## core 与 shared

`core` 是 TrueAdmin 前端框架能力，放置模块系统、插件系统、请求、权限、菜单、图标、布局、页面、CRUD、国际化和错误处理。

`shared` 是普通跨模块复用工具和 UI，放置不承载框架规则的组件、Hooks 和工具函数。

禁止把 `crud`、`permission`、`menu`、`request/http`、`module registry`、`plugin registry`、`layout viewport`、`i18n runtime` 放进 `shared`。模块私有组件放在 `modules/<module>/components`，只有两个以上模块真实复用才提升到 `shared`。

## 导入路径和公开出口

前端默认路径别名：

- `@` 指向 `src`，用于兼容和少量就近导入。
- `@core` 指向 `src/core`，用于框架能力导入。
- `@modules` 指向 `src/modules`，用于内置模块和项目模块导入。
- `@plugins` 指向 `src/plugins`，用于编译期插件导入。
- `@config` 指向 `web/config`，用于项目配置导入。

跨模块和跨插件复用必须优先走公开出口，不要深层引用对方内部文件。每个模块和插件都应提供 `index.ts` 作为公开 API 出口，允许导出的内容包括稳定组件、Hook、类型和必要的领域服务；不应导出 `pages` 内部页面实现，也不应把模块私有工具暴露给外部。

推荐：

```ts
import { TrueAdminUserSelect } from '@modules/system';
```

不推荐：

```ts
import { TrueAdminUserSelect } from '@/modules/system/components/TrueAdminUserSelect';
```

`core` 只放无领域归属的框架通用能力。用户选择器、部门选择器、客户选择器、商品选择器等带明确业务领域的组件，应保留在所属模块或插件中，并通过公开出口给其他模块使用。第一阶段不要求在 `manifest.ts` 中声明模块依赖；依赖关系由静态 import 和 TypeScript 编译直接约束。

页面容器、CRUD 和页面型弹窗属于框架稳定 API，应通过 `@core/page`、`@core/crud`、`@core/modal` 公开出口导入。容器选择、标题/操作区、滚动区和版权显示规范见 [页面容器分层规范](./page-container.md)。

## 配置体系

前端使用 `web/config` 作为唯一项目级配置入口。配置文件内部读取 `import.meta.env`，业务代码禁止直接读取 `import.meta.env`。

`web/config/app.ts` 管应用名称、Logo、默认语言、默认首页；`layout.ts` 管 ProLayout 默认配置、工作区 feature 和尺寸策略；`theme.ts` 管 Ant Design 主题；`request.ts` 管 API baseURL、超时、Mock 和错误策略；`crud.ts` 管 CRUD 默认分页和交互；`plugin.ts` 管插件启用和项目覆盖配置；`env.ts` 管 env 类型转换；`index.ts` 聚合配置。

插件默认配置在插件 `manifest.ts` 中，项目启用和覆盖配置在 `web/config/plugin.ts` 中。第一版不设计 `web/config/plugins/*.ts` 自动扫描。

Env 遵循 Vite 官方规则：`.env` 是所有环境基础默认值，`.env.local` 是本地私有覆盖，`.env.[mode]` 是指定环境覆盖，`.env.[mode].local` 是指定环境本地私有覆盖。优先级是 `.env.[mode].local > .env.[mode] > .env.local > .env`。命令必须显式指定 mode。前端 env 只使用 `VITE_` 前缀变量，不放真正密钥。

## 模块系统

前端内置模块和项目业务模块放在 `src/modules/<module>`。模块入口统一使用 `manifest.ts`，框架通过 `import.meta.glob` 自动扫描。

模块 manifest 负责声明前端页面路由、模块语言包和前端扩展能力，不声明菜单和权限事实来源。

```ts
export default defineModule({
  id: 'system',
  routes: [
    {
      path: '/system/admin-users',
      component: lazy(() => import('./pages/admin-users')),
      meta: { title: 'system.adminUsers.title', auth: true },
    },
  ],
  locales: {
    'zh-CN': () => import('./locales/zh-CN'),
    'en-US': () => import('./locales/en-US'),
  },
});
```

模块内部统一使用 `manifest.ts`、`pages`、`services`、`components`、`hooks`、`types`、`locales`。页面目录使用 kebab-case，React 组件名使用 PascalCase，service 文件使用 `resource.api.ts`，type 文件使用 `resource.ts`。

## 插件系统

插件包源采用项目根目录 `plugins/<vendor>/<plugin>`，插件 ID 使用 `<vendor>.<plugin>`。官方插件 vendor 使用 `true-admin`，例如 `plugins/true-admin/examples` 和 `true-admin.examples`；项目私有插件 vendor 为 `local` 或公司/项目代号，第三方插件 vendor 为插件市场作者或组织名。

根目录 `plugins/` 是插件包仓库和安装源，不参与 Vite、TypeScript、Biome 或其他 Web 代码扫描。插件安装时，安装器把 `plugins/<vendor>/<plugin>/web` 复制到 `web/src/plugins/<vendor>/<plugin>`。Windows 下不使用软链，避免权限和文件监听兼容问题。

插件包根目录的 `plugin.json` 是唯一包级插件清单，只声明插件身份、版本、插件依赖和兼容性。前端只扫描安装后的 `web/src/plugins/<vendor>/<plugin>/manifest.ts`，不在 `plugins/<vendor>/<plugin>/web` 或 `web/src/plugins/<vendor>/<plugin>` 中放置 `plugin.json`。

TrueAdmin 第一阶段不做运行期动态插件。安装插件的含义是开发期把插件包放入 `plugins/<vendor>/<plugin>`，再由安装器复制 Web runtime 到 `web/src/plugins/<vendor>/<plugin>`，随后与主应用一起编译、类型检查和打包。插件组件、Hook 和类型可以被其他模块或插件静态 import，但必须通过安装后 runtime 的公开出口导入。不存在“生产运行中下载插件并动态注册组件”的机制。

插件包依赖写在根目录 `plugin.json` 的 `dependencies.plugins`，不写在前端 `manifest.ts`。Web runtime 自己额外使用的 npm 依赖写在插件 `web/package.json`，由安装器合并到宿主 Web 安装计划。插件源码不得假设宿主项目已经安装了自己额外使用的 npm 包。

```json
{
  "id": "acme.cms",
  "dependencies": {
    "plugins": ["system"]
  }
}
```

```json
{
  "name": "@acme/plugin-cms-web",
  "private": true,
  "dependencies": {
    "@ant-design/charts": "^2.6.7"
  }
}
```

`dependencies.plugins` 使用插件或内置模块的稳定 id。第一阶段只做开发期/安装期约束，不做运行期动态加载和依赖解析。`web/package.json` 使用 npm 包名到 semver range 的映射；如果多个插件声明同一 npm 包，安装器应按 pnpm/semver 规则合并或提示冲突。

安装后的插件 `web/src/plugins/<vendor>/<plugin>/manifest.ts` 声明 Web runtime 能力；插件启用和项目级配置覆盖由根插件清单和后端配置负责，`web/config/plugin.ts` 只保留前端侧覆盖开关。

```ts
export default {
  'acme.cms': {
    enabled: true,
    config: { uploadMaxSize: 20 },
  },
};
```

插件命名规则：插件目录为 `plugins/<vendor>/<plugin>`，插件 id 为 `<vendor>.<plugin>`，`source_id`、权限码前缀、配置 key 默认使用 `<vendor>.<plugin>`。前端不负责定义或改写数据库表名；插件数据表命名由后端插件规范和上架/安装校验约束。

## 菜单、路由和权限

菜单、权限、按钮和接口元数据由后端注册和运行时配置。前端 manifest 只做 `path -> component` 映射。第一版使用 `path` 作为菜单和前端组件的绑定键。菜单层级、名称、图标、排序、状态可以在数据库调整；`path` 属于前后端契约，不建议后台随意修改。

权限最佳实践是后端注册权限、后端校验权限、前端消费权限。当前用户权限由 `/api/admin/auth/me` 返回。前端只用 `permissions` 控制按钮和区域显示，后端 `PermissionMiddleware` 是最终安全边界。

```tsx
<Permission code="system.user.create">
  <Button type="primary">新增</Button>
</Permission>
```

CRUD 组件支持按 `resource` 推导常见权限，例如 `system.user.create`、`system.user.update`、`system.user.delete`、`system.user.export`。

## 国际化

菜单 i18n key 前端翻译，错误 message 后端翻译，页面静态文案前端翻译。后端 menu-tree 返回 `i18n` key 和 fallback `title`，前端菜单优先使用 i18n key，找不到翻译时使用 title。切换语言不需要重新请求 menu-tree，也不需要刷新页面。

模块和插件在 `manifest.ts` 中声明 locales，框架按当前语言加载已启用模块和插件的语言包。语言状态由 Zustand 管理，I18nProvider 负责加载语言包。HTTP 拦截器从 locale store 读取语言并注入 `Accept-Language`。

## 图标体系

前端维护 icon registry，后端菜单下发 icon key。目录为 `src/core/icon`，包含 `iconRegistry.tsx`、`defaultIcons.tsx`、`IconRenderer.tsx` 和 `types.ts`。模块和插件可以通过 manifest 注册图标，找不到图标时使用 fallback 图标。

## 请求与状态

请求层使用 alova + TanStack Query。alova 负责 HTTP 客户端、接口方法定义、响应解包、错误转换和拦截器；TanStack Query 负责服务端状态缓存、列表刷新、mutation 状态和失效策略。

状态管理使用 TanStack Query + Zustand。TanStack Query 管所有来自后端 API 的服务端状态，包括当前用户、菜单树、权限列表、列表数据、详情数据、字典选项和插件后端配置。Zustand 管纯前端 UI 状态和本地偏好，包括布局设置、主题设置、侧栏折叠、语言偏好、内容区全屏、工作区 UI 状态和本地持久化偏好。禁止把 API 返回的列表数据、详情数据、菜单树长期复制到 Zustand。

## 错误处理

错误处理采用核心错误体系统一处理，页面可局部覆盖。HTTP error 由 `core/http` 转换为 ApiError；业务 error 使用后端 `code + message`；Query error 由 TanStack Query 默认错误处理；Page error 由 TrueAdminPage ErrorBoundary 兜底；Route error 由 React Router errorElement 兜底；权限不足显示 403；菜单 path 有但前端模块未安装时显示 ModuleMissing。

前端默认展示后端 `message`，也可以按 `code` 做特殊交互。

## 弹窗生命周期

所有基于 Ant Design `Modal`、`Drawer` 或 ProComponents `ModalForm`、`DrawerForm` 的弹层，都必须把 `open` 状态和业务数据状态分离。关闭弹窗时只允许先把 `open` 设置为 `false`，等待组件关闭动画完成后，再在 `afterOpenChange(false)`、`afterOpenChange` 等动画结束回调中清理业务数据。

禁止使用 `{open && <Modal />}` 或关闭时立即 `setPayload(null)` 导致弹窗组件被 React 直接卸载。提前卸载会跳过 Ant Design 内置的 `zoom/fade` leave 动画，表现为弹窗打开有动画、关闭瞬间消失。

推荐模式：

```tsx
const [open, setOpen] = useState(false);
const [payload, setPayload] = useState<Payload | null>(null);

const showModal = (nextPayload: Payload) => {
  setPayload(nextPayload);
  setOpen(true);
};

<Modal
  open={open}
  onCancel={() => setOpen(false)}
  afterOpenChange={(nextOpen) => {
    if (!nextOpen) {
      setPayload(null);
    }
  }}
>
  {payload ? <ModalContent payload={payload} /> : null}
</Modal>;
```

如果需要关闭后销毁复杂内容，优先使用 Ant Design 的 `destroyOnHidden`，让 Ant Design 在隐藏完成后销毁子内容，不要由外层条件渲染提前卸载整个弹窗。错误弹窗、表单弹窗、详情弹窗、确认弹窗和模块自定义弹窗都必须遵守这一规则。

复发问题记录：通知管理、公告管理这类详情弹窗禁止用 `setDetail(undefined)` 直接关闭。正确做法是 `setDetail(record); setDetailOpen(true)` 打开，关闭时只 `setDetailOpen(false)`，并在 `afterOpenChange(false)` 中清理 `detail`。否则详情弹窗会被 React 立即卸载，关闭过渡动画会消失。

## 权限展示分层

权限相关展示分为页面级、局部组件级和接口级三层，不要混用。

页面级无权限使用标准 403 页面。当前 `/403` 路由提供全页 `ForbiddenPage`，适合路由守卫或后端菜单确认当前用户不可进入某个页面时使用。

局部组件级无权限使用 `Permission`。按钮和表格操作默认无权限时不渲染；抽屉、详情区、卡片内容等需要占位说明的场景使用 `fallback="block"`：

```tsx
<Permission code="system.department.view" fallback="block">
  <DepartmentDrawerContent />
</Permission>
```

接口级无权限继续走全局错误弹窗。当前用户打开组件后接口返回 `403` 或 `KERNEL.AUTH.FORBIDDEN`，说明后端权限兜底触发、权限状态变化或前端权限判断不完整，应由错误弹窗解释原因和建议，不要静默替换成页面 403。

## 前端固定路由和菜单

模块可以通过 `manifest.routes` 注册前端固定路由，通过 `manifest.menus` 注册前端菜单。前端菜单会与后端菜单树合并，适合开发示例、前端工具页、调试页和不由后端业务菜单控制的固定入口。

合并规则：

- `parentPath` 命中后端或前端菜单节点时，菜单会追加到该节点的 `children`。
- 没有 `parentPath` 或未命中时，菜单追加到根级底部。
- 同级菜单按 `sort` 升序排列；未设置 `sort` 时默认为 `0`。
- `devOnly: true` 的菜单仅在 dev/test 模式显示，但路由仍可注册，方便直接访问调试页。

示例：

```ts
export default defineModule({
  id: 'true-admin.examples',
  routes: [{ path: '/examples/permission', component: PermissionExamplePage }],
  menus: [
    {
      code: 'true-admin.examples.permission',
      title: 'Permission Demo',
      path: '/examples/permission',
      parentPath: '/examples',
      sort: 10,
      devOnly: true,
    },
  ],
});
```

## 布局、页面和工作区

布局采用 Ant Design Pro 基础布局 + 可插拔工作区增强。默认基础能力包括 ProLayout、RightContent、AvatarDropdown、Footer、SettingDrawer 和 PageContainer。可选工作区增强包括 RouteTabs、KeepAlive、PageRefresh、Fullscreen 和 Breadcrumb 增强。第一版默认不实现 KeepAlive，不默认开启 RouteTabs。

框架提供 WorkspaceViewport 尺寸系统，统一支撑内容高度、内容区全屏、弹窗全屏、Drawer/Form 滚动区域等布局场景。WorkspaceViewport 必须响应 window resize、orientation change、侧栏折叠、Header 固定切换、RouteTabs 开关、Footer 显示隐藏、SettingDrawer 改布局配置、内容区全屏和弹窗全屏。实现策略为 ResizeObserver + requestAnimationFrame + Context。标准 CRUD 的表格高度由 `TrueAdminCrudTable` 自己测量表格主区域实际高度后传给 AntD Table `scroll.y`，避免搜索区、工具栏、批量提示或分页变化时依赖固定估算。

前端不维护独立的路由页面类型字符串。页面类型由实际使用的标准组件表达：列表页使用 `TrueAdminCrudPage` / `TrueAdminCrudTable`，表单页使用 `TrueAdminFormPage`，分栏页使用 `TrueAdminSplitPage`，普通页面使用 `TrueAdminPage`。路由 `meta` 只保留真实参与运行时行为的字段，例如 `title`、`auth`、`icon`、`layout` 和 `tab`。页面容器规范见 `docs/frontend/page-container.md`。

## CRUD 架构

标准 CRUD 使用 `TrueAdminCrudPage` 做页面级封装，核心表格能力由可独立复用的 `TrueAdminCrudTable` 承载，底层使用 Ant Design 基础组件组合，不依赖 ProTable。复杂页面可以直接使用 `TrueAdminCrudTable`、AntD Table / Form 或继续在业务内自行选择更高阶组件。标准能力包括分页、搜索、响应解包、列表结果、增删改查、批量操作、权限按钮、Drawer / Modal、错误提示和 escape hatch。标准 CRUD 的快速搜索、复杂筛选、分页和排序状态必须由 URL 驱动，筛选字段使用独立 filter schema，不依赖 columns search 配置；规范见 `docs/frontend/crud-search-filter.md`。

表单校验采用前端基础体验校验 + 后端最终校验。前端负责必填、长度、格式和基础范围；后端负责业务规则、唯一性、权限、数据权限和状态机。后端 validation error 要能映射回 ProForm 字段。

## 字典、数据权限和审计

字典/枚举分两类：代码枚举前端本地维护，业务字典后端接口提供。数据权限在前端只消费后端返回的可操作范围，前端不计算数据权限，不根据角色和部门自行推导可操作范围，最终提交仍由后端校验。

操作日志由后端落库，前端只提供 trace/context 辅助。请求头包括 `X-Request-Id`、`X-Page-Path`、`X-Client-Version` 和 `Accept-Language`。

## OpenAPI 与生成代码

OpenAPI 采用生成基础类型 + 手写模块 service 封装。后端导出 OpenAPI，前端生成 DTO / schema / operation 类型，业务页面不直接依赖原始生成 request，模块 service 封装业务友好的 API 方法，CRUD 组件消费模块 service。第一版可以先保留 `src/generated` 目录，不实现完整生成链路。没有生成器前，模块可先在自己的 `types/` 中维护 DTO。

## 流式响应

前端提供 `src/core/stream` 作为通用流式响应底座，默认消费后端 OpenAI 风格 SSE data 块。它不依赖浏览器 `EventSource`，而是使用 `fetch + ReadableStream`，因此可以支持 `POST` 请求、鉴权头、请求体和 `AbortController`。

后端约定：

```text
data: {"type":"progress","message":"正在处理","percent":30}

data: {"type":"result","message":"success","response":{"code":"SUCCESS","message":"success","data":{}}}

data: {"type":"completed","message":"处理完成"}

data: [DONE]
```

前端调用使用 `streamRequest()`，它最终返回值和普通接口一样来自 `ApiResponse.data`：

```ts
const result = await streamRequest<Result>('/admin/example/run', {
  method: 'POST',
  body: payload,
  signal: abortController.signal,
  onEvent: (event) => {
    // append event to component state
  },
});
```

如果一个业务调用需要在普通请求和流式请求之间切换，可以使用 `requestMaybeStream()`。`stream: false` 时走普通 alova JSON 请求，`stream: true` 时走 SSE，但最终都返回同一份业务数据。

展示层使用 `StreamProgressPanel`。组件必须同时支持确定进度和不确定进度：有 `percent` 时显示百分比进度条，没有 `percent` 时显示 active 状态和步骤列表。

异常规则：收到 `type=error` 时优先从 `error.response` 按普通 `ApiEnvelope` 生成 `ApiError`；连接结束但没有收到 `[DONE]` 时按网络中断处理；用户主动 `abort()` 时按取消处理；收到 `[DONE]` 但没有 `result` 或 `completed` 时按协议异常处理。流式响应不进入普通 alova JSON 解包链路，但最终结果解包规则必须与普通请求一致。

## 样式与主题

主题系统以 Ant Design ThemeConfig 为核心，项目只做薄封装。Ant Design v6 token 是主题事实来源，`web/config/theme.ts` 只配置品牌色、圆角、算法、CSS variable、motion token，不自建和 antd 并行的主题变量系统。ProLayout navTheme 和 ConfigProvider algorithm 必须同步。

样式分工：Ant Design / ProComponents 负责后台组件；antd-style 负责框架组件和需要消费 antd token 的定制样式；Tailwind 负责页面结构布局、flex/grid、间距、响应式和快速排版；CSS Modules 是补充方案。Tailwind 是布局工具，不是设计系统。禁止用 Tailwind 重写 antd Button、Table、Form、Modal、Menu，也不要用 Tailwind 维护另一套主题色。

## Mock、测试和质量

Mock 只保留最小开发 Mock，默认优先真实后端。Mock 技术使用 MSW，只在 development/test 环境按配置启用，production 禁止启用。最小接口包括 login、me、logout 和 menu-tree。

前端测试采用框架核心做单元测试，业务页面轻测试。重点测试 manifest 收集、plugin config 合并、permission rule、menu adapter、icon registry、i18n locale 合并、http response unwrap、error normalize、crud query params 转换和 WorkspaceViewport 纯计算函数。工具使用 Vitest 和 React Testing Library。

包管理器固定 pnpm，前端依赖在 `web` 目录内自包含管理，只提交 `web/pnpm-lock.yaml`，禁止提交 `package-lock.json` 和 `yarn.lock`。代码规范工具使用 Biome 为主 + TypeScript typecheck。第一版 `pnpm --dir web check` 包含 `pnpm --dir web lint`、`pnpm --dir web typecheck` 和 `pnpm --dir web build`，有测试后再加入 `pnpm --dir web test:run`。

## 第一版落地范围

第一版目标是“框架 + System/admin-users 黄金 CRUD 闭环”。必须完成工程底座、配置体系、module/plugin manifest 扫描、plugin enabled 配置、ProLayout、后端 menu-tree 驱动菜单、auth/me、Permission 组件、alova + TanStack Query、Zustand、i18n、icon registry、TrueAdminPage、WorkspaceViewport、TrueAdminCrudPage、System/admin-users 黄金 CRUD、最小 MSW mock、错误处理和 `pnpm --dir web check`。

第一版不强制完成完整 System 所有页面、RouteTabs、KeepAlive、插件市场、OpenAPI 生成器、完整代码生成器和 E2E 测试。System 模块作为第一版黄金模块，`system/admin-users` 作为黄金 CRUD 页面。后续 roles、menus、departments、client-users 都基于黄金 CRUD 模板扩展。

## 代码生成规划

第一版规划生成器契约，先写文档和模板，不急着实现完整生成器。后续命令规划为 `pnpm trueadmin gen:module system` 和 `pnpm trueadmin gen:crud system admin-user`。生成内容包括页面、columns、form、service、types、locales 和 manifest route entry。

## Ant Design Pro 与 MineAdmin 的关系

Ant Design Pro v6 不进入 TrueAdmin Web 主干作为工程底座。TrueAdmin 参考它的 ProLayout、RightContent、AvatarDropdown、Footer、SettingDrawer、PageContainer、global style 和主题体验。

MineAdmin 不进入 TrueAdmin Web 主干作为代码底座。TrueAdmin 参考它的模块化、插件化、CRUD 工作流、菜单权限和工作区体验。

Ant Design Pro 示例页面不进入主干，包括 Welcome、Dashboard demo、Form demo、List demo、Chatbot demo、PWA/service-worker、示例 Mock、多语言样例和官网链接。
