# 前端架构

本目录是 TrueAdmin Web 管理端的主文档入口。前端当前处于架构定稿阶段，`web/` 目录可以为空，后续实现必须优先遵守本文档中的架构约定。

## 阅读路径

1. [前端总体架构](architecture.md)
2. [总体架构](../architecture/index.md)
3. [技术栈说明](../overview/tech-stack.md)
4. [API 规范](../api/index.md)
5. [AI 开发指南](../ai/ai-development-guide.md)

## 核心结论

- Web 管理端自研模块化前端底座，不直接使用 Ant Design Pro v6 官方工程作为项目底座。
- 技术栈使用 Vite、React、TypeScript、React Router、Ant Design v6、ProComponents 3、TanStack Query、alova、Zustand、MSW、Tailwind v4、antd-style、Biome、Vitest。
- Ant Design Pro v6 作为布局、主题、交互和产品体验参考，不把官方示例页面放入主干。
- MineAdmin 作为模块化、插件化、菜单、权限、CRUD 工作流和后台工作区体验参考。
- 前端模块和插件都通过 `manifest.ts` 暴露前端能力，菜单、权限、按钮、OpenAPI 元数据以后端为事实来源。
- 第一版落地范围是“框架 + System/admin-users 黄金 CRUD 闭环”。

## 维护原则

- 前端架构决策必须先写入文档，再进入实现。
- `web/` 代码生成后如果与本文档冲突，以本文档为准修正代码。
- 新增模块、插件、CRUD、布局能力、配置项、测试策略时，必须同步更新本文档。
