# TrueAdmin 项目记忆

本文档记录 TrueAdmin 的目标、已完成事项、关键决策和当前上下文。它用于帮助开发者和 AI 在长时间、多轮协作中快速恢复现场。

## 项目目标

TrueAdmin 要成为一个面向 AI 协作开发的企业级后台管理脚手架。

它参考 MineAdmin 一类项目的功能形态，但不是复制 MineAdmin 技术栈。TrueAdmin 更强调：

- 企业后台基础能力完整。
- 后续可扩展企业中台能力。
- 代码结构对 AI 友好。
- 开发流程对 AI 友好。
- 文档、接口契约、模块边界和任务模板可持续沉淀。

## 产品定位

- 项目名称：TrueAdmin。
- 定位：开源框架型项目模板。
- 文档语言：中文为主。
- 开源协议：MIT。
- 仓库形态：Monorepo。

## 已确认技术栈

- 后端：PHP + Hyperf。
- Web 管理端：React + Umi Max + TypeScript + Ant Design Pro + Ant Design。
- 移动端：uni-app + Vue 3 + TypeScript + Wot UI。
- 数据库：PostgreSQL 优先，MySQL 兼容。
- 缓存：Redis。
- 认证：JWT / Token。
- 接口契约：RESTful API + OpenAPI/Swagger。
- 本地基础设施：Docker Compose。

## 已确认架构决策

- 后端采用 `kernel + app/Foundation + app/Infrastructure + app/Module` 分层：kernel 放 Composer 核心原语，Foundation 放项目级可改基础行为，Infrastructure 放技术适配，Module 放业务和系统能力。业务模块内部使用 `Http/Admin`、`Http/Client`、`Service`、`Repository`、`Model`、`Library`。
- 第一版不做多租户。
- 权限模型采用企业后台完整组织体系。
- 后台用户、用户端用户和开放平台主体分域建模，不默认共用用户表。
- API 版本主要隔离对外入口契约，不复制整套业务系统；Admin 后台端代码目录默认不拆版本，Client/Open 的 Controller/Request/Vo 按版本隔离，Service/Repository/Model 默认复用。
- 移动端定位为轻量管理端。
- 第一阶段聚焦后台基础版。
- 后续扩展消息、待办、流程审批。
- 第一版预留传统后台 CRUD 代码生成能力。
- 第一版直接抽 `packages/kernel`，但不把所有通用代码都放进 Composer 包：错误码、业务异常、基础抽象等稳定原语进入 kernel，统一响应、异常处理、健康检查、OpenAPI 入口、CRUD 默认行为、密码策略等项目默认实现进入 `backend/app/Foundation`，外部技术适配进入 `backend/app/Infrastructure`，菜单权限、部门岗位、数据权限规则、操作日志入库等后台业务能力留在模块内。
- API 错误码使用字符串契约，不使用数字号段。后端响应 `code` 是稳定机器码，例如 `SUCCESS`、`KERNEL.AUTH.UNAUTHORIZED`、`SYSTEM.AUTH.INVALID_CREDENTIALS`、`PLUGIN.ACME.CMS.BANNER_NOT_FOUND`；`message` 来自 Hyperf 官方 `hyperf/constants` 的 `#[Message]` 翻译 key，并通过 `hyperf/translation` 根据 `Accept-Language` 返回本地化文案。前端通常直接展示 `message`，同时根据 `code` 做特殊交互处理。
- 错误码归属按层级维护：kernel 只保留 `SUCCESS` 和 `KERNEL.*` 通用错误码，业务模块在自己的 `Constant/*ErrorCode.php` 中声明 `enum XxxErrorCode: string implements ErrorCodeInterface` 并 `use ErrorCodeTrait`；插件使用 `PLUGIN.{VENDOR}.{PACKAGE}.{ERROR}`。错误码是运行时异常响应契约，第一版不做错误码收集、注册、同步和扫描命令，也不要求模块或插件维护 `error_codes.php`。业务抛错只传错误码 enum、HTTP 状态和可选 params，不兼容裸字符串错误码。错误文案继续使用 Hyperf 官方 `hyperf/constants` 的 `#[Message]` 和 `hyperf/translation`。
- 后端多语言按资产归属维护：`app/Foundation/resources/lang` 放框架通用文案，模块放 `Module/Xxx/resources/lang`，插件放 `resources/lang` 并通过 `extra.trueadmin.assets.lang` 声明，项目根级 `resources/lang` 只作为最终覆盖层。普通业务翻译直接使用 Hyperf 官方 `trans()` 或 `__()`，TrueAdmin 不额外封装全局 `t()` helper，只补充模块和插件语言包加载能力。

## 第一阶段范围

第一阶段要先完成通用后台基础版：

- 登录认证。
- 用户管理。
- 角色管理。
- 菜单与按钮权限。
- 接口权限。
- 数据权限设计。
- 部门管理。
- 岗位管理。
- 字典管理。
- 操作日志。
- 登录日志。
- 文件上传。
- 个人中心。
- 基础仪表盘。
- CRUD 代码生成能力预留。

## 第二阶段范围

第二阶段扩展企业增强能力：

- 消息中心。
- 站内通知。
- 待办中心。
- 流程定义。
- 流程发起。
- 审批流转。

## 第三阶段范围

第三阶段建设移动轻量管理端：

- 登录。
- 消息。
- 待办。
- 审批。
- 个人中心。

## AI 友好基建目标

TrueAdmin 第一版的 AI 基建按标准版建设，包含：

- README。
- 目录规范。
- 模块说明。
- 接口约定。
- 编码规范。
- AI 开发指南。
- 任务拆分模板。
- 模块 Prompt 模板。
- 接口示例。
- 测试约定。
- 根级 `llms.txt`。

## 已完成事项

- 创建 `TrueAdmin` 仓库目录。
- 初始化 Git 仓库。
- 添加 MIT License。
- 添加 README、ROADMAP、CONTRIBUTING。
- 添加 `backend/`、`web/`、`mobile/`、`deploy/`、`docs/`、`scripts/` 目录。
- 添加架构设计文档。
- 添加模块规划文档。
- 添加技术栈说明。
- 添加 API 规范。
- 添加 AI 开发指南、任务模板、模块 Prompt 模板和测试约定。
- 添加 PostgreSQL + Redis 的 Docker Compose 文件。
- 添加根级 `llms.txt`。
- 初始化 `backend/` Hyperf 3.1 应用骨架。
- 接入 PostgreSQL、Redis、JWT 基础配置。
- 参考 MineAdmin 接入 Hyperf 官方 `hyperf/database-pgsql`，使用 `DB_DRIVER=pgsql` 作为默认数据库驱动，并保留 `DB_DRIVER=mysql` 兼容路径。
- 建立统一 API 响应、字符串错误码和业务异常处理。
- 实现后台认证最小闭环：登录、退出、当前用户。
- 预留 API 分区：`admin`、`client`、`open`。
- 添加第一版 OpenAPI JSON 文档入口。
- 调整后端为 `kernel + app/Foundation + app/Infrastructure + app/Module` 分层；核心包 `packages/kernel` 仅保留可复用基础原语，项目级默认实现和技术适配留在 `backend/app`。
- 新增后端设计理念：参考 MineAdmin/FastAdmin 的效率优先路线，TrueAdmin 采用低门槛起步、渐进式架构、代码生成和插件化长期演进。
- 新增后端注解驱动设计：参考 MineAdmin 使用 Attribute/AOP 实现数据权限，使用 Event + `#[Listener]` 实现操作日志、登录日志和业务副作用解耦。

## Git 状态

首次提交：

```text
ce09fcd chore: initialize TrueAdmin scaffold
```

当前新增的项目记忆文档应在下一次提交中记录。

后端初始化阶段提交后，应记录新的提交号。

## 推荐下一步

后端 Hyperf 应用骨架已经初始化完成。下一步建议建设系统权限基础模块。

推荐顺序：

1. 设计用户、角色、菜单、部门、岗位数据表。
2. 添加数据库迁移和种子数据。
3. 将内置管理员账号切换为数据库用户。已完成第一版。
4. 实现权限点和菜单查询接口。
5. 扩展 OpenAPI 文档。
6. 为 Web 管理端初始化提供稳定接口。

## API 边界

TrueAdmin 第一阶段已经预留三类 API：

- `/api/admin`：后台管理端 API。
- `/api/v1/client`：用户端 v1 API；未来用户端 v2 直接新增 `/api/v2/client`。
- Controller 路由注解 `path` 使用完整控制器资源路径，框架不再隐式追加端类型或版本 base path。
- `/api/v1/open`：未来外部开放平台 API。

开放 API 不应直接复用后台管理接口。相关说明见 `docs/api/api-boundaries.md`。

身份与权限边界采用：

- `admin_*`：后台管理身份和权限体系。
- `client_*`：未来用户端身份和业务用户体系的推荐表名前缀，第一版不内置用户端身份表。
- `open_*`：外部开放平台应用和调用体系。

用户端默认不使用后台菜单权限、按钮权限和数据权限，主要做登录鉴权和业务级授权。详细规则见 `docs/api/identity-and-permissions.md`。

## 后端结构边界

后端当前采用：

```text
packages/kernel/src
backend/app/Foundation
backend/app/Infrastructure
backend/app/Module
```

`packages/kernel` 放框架层和基础原语，并以 `trueadmin/kernel` 作为 Composer 包雏形。`backend/app/Foundation` 放项目级可改基础行为，`backend/app/Infrastructure` 放项目级技术适配。业务代码必须归属到 `backend/app/Module` 下的具体模块，模块内部采用 MineAdmin 分层。

Command、Listener 和 Crontab 也按职责归属：框架级放 `Kernel`，项目级基础能力放 `Foundation` 的具体能力目录，技术适配类任务放 `Infrastructure`，业务级放模块内。第一版不保留 `backend/app/Command`、`backend/app/Listener`、`backend/app/Crontab` 这类全局默认落点。

数据库迁移只扫描模块和插件目录。第一版不保留 `backend/database/migrations` 根级迁移目录；系统基础表归属 `Module/System`。用户端身份表不作为第一版内置表，项目需要时按业务语义归属 `Member`、`Customer` 等对应业务模块；用户端认证入口归属 `Module/Auth/Http/Client`，不要新增泛化 `Module/User`。

后端主入口见 `docs/backend/index.md`。层级边界见 `docs/backend/layer-boundaries.md`，数据库迁移规范见 `docs/backend/database-migrations.md`，初始化和迁移统一使用 Hyperf 原生命令，开发环境优先 `migrate:fresh --seed`，正常升级使用 `migrate --seed`，模块/插件路径由启动监听器注册，模块 Seeder 目录由启动监听器注册到 Hyperf 原生 `db:seed`，命名空间 Seeder 由 `NamespacedSeed` 适配执行。后端完整架构见 `docs/backend/architecture.md`，注解驱动设计见 `docs/backend/annotation-driven.md`。API 版本和多端复用边界见 `docs/backend/module-architecture.md` 与 `docs/api/versioning-and-reuse.md`。当前阶段使用 `kernel + Foundation + Infrastructure + Module` 作为后端主结构，并在业务模块内部采用 MineAdmin 分层。

文档结构已整理为 `overview`、`architecture`、`backend`、`api`、`development`、`ai`、`research` 七个主分区。`docs/README.md` 是文档中心入口，旧的散点文档已迁移到对应分区，重复的后端设计理念文档已合并到后端主文档。

配置模式与注解模式边界见 `docs/backend/configuration-vs-attribute.md`。当前原则是：框架本身优先配置模式，业务开发优先注解模式。路由默认使用 Controller Attribute 自动注册，模块内不再维护 `routes.php`；全局 `backend/config/routes.php` 只保留框架入口、OpenAPI 入口和注解路由注册器。可用 `php bin/hyperf.php trueadmin:routes` 查看扫描结果。

接口元数据体系见 `docs/backend/interface-metadata.md`。当前已提供并启用 `AdminController`、`AdminGet/AdminPost/AdminPut/AdminDelete`、`Client*`、`Open*`、`Permission`、`MenuButton`、`OpenApi` 等 Attribute。路由注解已参与运行时注册，Controller 注解 `path` 即完整控制器资源路径；接口元数据可通过 `trueadmin:metadata` 查看，菜单和权限默认元数据可通过 `trueadmin:metadata-sync` 同步，OpenAPI 可通过 `/api/v1/open/openapi.json` 输出。

接口元数据 Attribute、DataScope Attribute/Context/AOP、OperationLog Attribute/Event/AOP 已按最终标准进入 `packages/kernel`。`Module/System` 后续只承载权限表、菜单表、部门表、数据权限策略和操作日志落库等系统业务实现。

## 完整架构方案

已整理 `docs/backend/architecture.md`，作为 TrueAdmin 后端完整架构设计总纲。ActorContext、CRUD 基类、数据权限、操作日志、插件化和生成器的第一版规范已开始落地；后续演进应继续以该文档为准。

## MineAdmin 分析

已新增 `docs/research/mineadmin-backend-analysis.md`，用于记录 MineAdmin 后端结构、设计理念、优势、问题和 TrueAdmin 优化方向。后续涉及后端架构调整，应先参考该文档，避免在目录结构上来回摇摆。

## 重要提醒

当项目目标、技术栈、阶段范围、模块边界或路线图发生变化时，必须更新本文档。
