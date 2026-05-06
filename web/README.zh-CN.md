# TrueAdmin Web

TrueAdmin Web 是基于 Ant Design Pro / Umi Max 初始化的后台管理端，作为 TrueAdmin 开源框架的 Web 控制台基础。

## 技术栈

- React 19
- TypeScript 6
- Ant Design 6
- Ant Design Pro Components 3
- Umi Max 4
- pnpm workspace


## Ant Design Pro v6 基线

项目已对齐 Ant Design Pro v6 的核心技术栈：React 19、Ant Design 6、ProComponents 3、Umi Max 4 和 utoopack。官方 Pro v6 模板只作为依赖和配置参考，不直接整包覆盖本项目。

原因是官方完整模板和 simple 精简模板仍包含大量演示资产，例如 Welcome/Admin/table-list/chatbot/PWA/service-worker、多语言示例、Pro 官网链接和示例 Mock。TrueAdmin Web 要保持框架产品的最小可维护面，所以保留当前 `core + modules + locales` 结构，只吸收官方模板中必要的依赖、构建配置和运行时实践。

## 目录规范

`web` 是纯后台管理端，不在内部再划分 `admin` / `client`。用户端前端如果未来需要独立建设，应新建独立应用目录。

当前采用 `core + modules + locales` 组织：

```text
src/
  core/
    auth/                 token、权限判断
    request/              API 响应、分页类型
    menu/                 后端菜单转换
    app/                  Umi 运行时装配
    layout/               布局组件
    exception/            403、404、500
    router/               路由类型
  modules/
    auth/
      pages/Login/
      routes.ts
      services/auth.api.ts
      locales/zh-CN.ts
      locales/en-US.ts
      types.ts
    dashboard/
      pages/Dashboard/
      routes.ts
      locales/
    system/
      routes.ts
      pages/Users/
      pages/Roles/
      pages/Menus/
      pages/Departments/
      pages/ClientUsers/
      services/*.api.ts
      types/
      locales/
      components/
      hooks/
  locales/                Umi 国际化源码目录，纳入 git
    framework/            框架级语言包
    loadModuleLocale.ts   模块语言按需加载
    useModuleLocale.ts    模块语言加载 Hook
  generated/openapi/      OpenAPI 生成代码预留
```

约定：业务模块自己维护页面、手写 API、类型、多语言、模块内组件和 Hooks；应用核心能力放入 `core`；OpenAPI 生成代码后续统一放入 `src/generated/openapi`，不和手写模块 API 混放。

多语言规则：`src/locales` 是 Umi 约定的国际化源码目录，整体纳入 git；框架级 key 放在 `src/locales/framework`，入口文件是 `src/locales/zh-CN.ts`、`src/locales/en-US.ts`。模块业务 key 仍放在 `src/modules/<module>/locales/<locale>.ts`，由 `src/locales/loadModuleLocale.ts` 通过 `import.meta.glob` 直接扫描并按需加载。新增模块时只需要新增模块自己的语言文件。

路由规则：模块路由放在 `src/modules/<module>/routes.ts`，由模块自己维护页面路径、菜单名、图标和重定向。`config/routes.ts` 在 Umi 配置阶段直接扫描模块路由，只补根路径跳转和 404。新增模块时不修改 `config/routes.ts`，也不需要生成路由聚合文件。

不保留官方模板中的 `src/pages` 示例目录、PWA 入口和模板服务代码。新增页面必须落在 `src/modules/<module>/pages` 或 `src/core/exception`。

## 常用命令

```bash
pnpm install
pnpm dev
pnpm tsc
pnpm build
```

开发环境默认将 `/api/` 代理到 `http://127.0.0.1:9501`。

## 登录

默认后端种子账号：

- 用户名：`admin`
- 密码：`trueadmin`
