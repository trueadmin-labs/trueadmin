# 项目概览

TrueAdmin 是一个面向 AI 协作开发的企业级后台管理脚手架。它参考 MineAdmin 一类后台系统的功能形态，但不复制其目录和实现，而是在 Hyperf、React、uni-app 的技术栈上重新整理出更适合开源框架、模块化和长期 AI 协作的工程基座。

第一阶段目标不是一次性做完整业务中台，而是先建立稳定的后台基础版：认证、权限、菜单、组织、日志、文件、OpenAPI、模块生成和清晰的开发规范。

## 定位

- 项目名称：TrueAdmin。
- 项目形态：开源框架型 Monorepo 项目模板。
- 主要场景：企业后台、中后台、内部管理系统和业务中台。
- 文档语言：中文优先。
- 开源协议：MIT。
- 设计重点：模块化、AI 友好、接口契约明确、可持续演进。

## 技术栈

- 后端：PHP、Hyperf、PostgreSQL、MySQL 兼容、Redis、JWT、OpenAPI。
- Web 管理端：React、Vite、TypeScript、Ant Design。
- 移动端：uni-app、Vue 3、TypeScript、Wot UI。
- 本地基础设施：Docker Compose、PostgreSQL、Redis。
- 接口风格：RESTful API + OpenAPI/Swagger。

详细技术选择见 [技术栈说明](tech-stack.md)。

## 阶段范围

第一阶段聚焦后台基础版：登录认证、用户、角色、菜单、按钮权限、接口权限、数据权限、部门、岗位、字典、操作日志、登录日志、文件上传、个人中心、基础仪表盘和 CRUD 代码生成预留。

第二阶段扩展企业增强能力：消息中心、站内通知、待办中心、流程定义、流程发起和审批流转。

第三阶段建设移动轻量管理端：登录、消息、待办、审批和个人中心。

模块规划见 [模块规划](modules.md)，演化路径见 [演化路径](evolution-path.md)。

## 当前架构关键词

```text
Monorepo
Hyperf backend
React admin web
uni-app mobile
packages/kernel
backend/app/Foundation
backend/app/Infrastructure
backend/app/Module
Module/Xxx + MineAdmin-style internal layers
Attribute + AOP + Event + Listener
PostgreSQL first, MySQL compatible
```

总体架构见 [总体架构](../architecture/index.md)，后端细节见 [后端架构](../backend/index.md)。
