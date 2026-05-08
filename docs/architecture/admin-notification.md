# Admin 站内消息通知方案

本文档沉淀 TrueAdmin Admin 后台站内消息通知能力的产品和技术方案。该能力只面向 `web` 管理端和后台管理员，不覆盖 client 用户端。

站内消息属于 Admin 底层能力：核心提供消息存储、消息流、已读归档、铃铛入口、实时同步、管理后台和模块/插件发送接口；具体业务模块只负责在合适时机发送什么消息。

## 范围

第一版支持两类内容：

- 个人通知：系统、模块或插件投递给后台管理员。
- 系统公告：独立建模，支持全员或指定后台角色可见。

第一版不做：

- client 端消息。
- 浏览器 Notification API。
- 声音提醒。
- 用户订阅/免打扰设置。
- 自动清理或归档任务。
- 多渠道通知中心，例如邮件、短信、企业微信。

## 架构位置

前端底层能力放在 `core/notification`，系统页面放在 `modules/system`。

```text
web/src/core/notification/
  types.ts
  registry.ts
  service.ts
  store.ts
  adapters/
    polling.ts
    sse.ts
  components/
    TrueAdminNotificationBell.tsx
    TrueAdminNotificationPopover.tsx
    TrueAdminMessageList.tsx
    TrueAdminMessageDetailModal.tsx

web/src/modules/system/pages/notifications/
  MessageCenterPage.tsx
  NotificationManagePage.tsx
  AnnouncementManagePage.tsx
```

Markdown 是通用基础能力，不写死在通知模块中。

```text
web/src/core/markdown/
  TrueAdminMarkdown.tsx
  TrueAdminMarkdownEditor.tsx
  types.ts
```

后端放系统模块，和后台管理员、角色、权限、公告管理保持同一上下文。其他模块和插件通过系统通知服务或契约调用。

```text
backend/app/Module/System/Notification/
  Contract/
  DTO/
  Enum/
  Event/
  Model/
  Service/
  Repository/
  Realtime/

backend/app/Module/System/Http/Admin/Controller/Notification/
  MessageCenterController
  NotificationManageController
  AnnouncementManageController
```

## 数据表

表名明确使用 `admin_` 前缀，避免未来与 client 端消息混淆。

```text
admin_notification_batches
admin_notification_deliveries
admin_announcements
admin_announcement_reads
```

消息相关表使用自增整数 ID。

### admin_notification_batches

通知批次记录一次发送行为。批次负责保存发送定义、来源、操作人、去重策略和整体状态。

建议字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 自增 ID |
| `type` | 业务类型，例如 `system`、`alert`、插件自定义类型 |
| `level` | `info`、`success`、`warning`、`error` |
| `source` | 来源字符串，例如 `system`、`plugin.true-admin.examples` |
| `targets` | 原始投递目标 JSON |
| `template_key` | 模板 key，可空 |
| `template_variables` | 模板变量 JSON，可空 |
| `fallback_title` | 兜底标题，可空 |
| `fallback_content` | 兜底 Markdown 内容，可空 |
| `payload` | 扩展 JSON，可空 |
| `attachments` | 附件 JSON 列表，可空 |
| `target_url` | 默认跳转地址，可空 |
| `dedupe_key` | 去重 key，可空 |
| `dedupe_ttl_seconds` | 去重有效期秒数，可空；为空表示永久去重 |
| `expires_at` | 通知有效期，可空 |
| `status` | `draft`、`sending`、`completed`、`partial_failed`、`failed` |
| `operator_type` | `admin`、`system`、`plugin` |
| `operator_id` | 操作主体 ID，可空 |
| `operator_name` | 操作主体名称，可空 |
| `impersonator_id` | 代操作管理员 ID，可空 |
| `error_message` | 批次错误信息，可空 |
| `created_at` | 创建时间 |

### admin_notification_deliveries

通知投递记录保存每个接收管理员实际看到的消息内容和个人状态。

建议字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 自增 ID |
| `batch_id` | 通知批次 ID |
| `receiver_id` | 接收管理员 ID |
| `receiver_name` | 接收管理员名称快照 |
| `locale` | 渲染语言 |
| `title` | 最终展示标题 |
| `content` | 最终展示 Markdown 内容 |
| `payload` | 扩展 JSON |
| `attachments` | 附件 JSON 列表 |
| `target_url` | 跳转地址，可空 |
| `status` | `pending`、`sent`、`failed`、`skipped` |
| `skip_reason` | 跳过原因，例如 `disabled_admin`、`missing_admin`、`duplicated` |
| `read_at` | 已读时间，可空 |
| `archived_at` | 用户归档时间，可空 |
| `expires_at` | 过期时间，可空 |
| `sent_at` | 投递成功时间，可空 |
| `error_message` | 投递错误信息，可空 |
| `created_at` | 创建时间 |

### admin_announcements

公告独立建模，不在发布时复制通知投递记录。用户侧消息流动态聚合公告和个人通知。

建议字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 自增 ID |
| `title` | 标题，纯文本 |
| `content` | Markdown 内容 |
| `level` | `info`、`success`、`warning`、`error` |
| `type` | 默认 `announcement`，也可扩展 |
| `source` | 来源字符串，默认 `system` |
| `scope` | `all` 或 `roles` |
| `role_ids` | 角色 ID JSON，`scope=roles` 时必填 |
| `payload` | 扩展 JSON |
| `attachments` | 附件 JSON 列表 |
| `status` | `draft`、`scheduled`、`active`、`expired`、`offline` |
| `pinned` | 是否置顶 |
| `publish_at` | 发布时间，发布时必填 |
| `expire_at` | 过期时间，可空；为空表示长期有效 |
| `operator_type` | `admin`、`system`、`plugin` |
| `operator_id` | 操作主体 ID |
| `operator_name` | 操作主体名称 |
| `created_at` | 创建时间 |
| `updated_at` | 更新时间 |

公告发布后允许调整有效期、置顶和状态，不允许修改正文和附件。公告不做单独版本记录。

### admin_announcement_reads

公告已读表保存管理员对公告的个人状态。

| 字段 | 说明 |
| --- | --- |
| `id` | 自增 ID |
| `announcement_id` | 公告 ID |
| `admin_id` | 管理员 ID |
| `read_at` | 已读时间，可空 |
| `archived_at` | 用户归档时间，可空 |
| `created_at` | 创建时间 |

## 统一消息流

用户侧消息中心只面对统一消息流接口，不由前端分别请求通知和公告后自行合并。

```ts
type AdminMessageKind = 'notification' | 'announcement';

type AdminMessageLevel = 'info' | 'success' | 'warning' | 'error';

type AdminMessageItem = {
  id: number;
  kind: AdminMessageKind;
  title: string;
  content?: string;
  level: AdminMessageLevel;
  type: string;
  source?: string;
  targetUrl?: string;
  payload?: Record<string, unknown>;
  attachments?: AttachmentValue[];
  readAt?: string | null;
  archivedAt?: string | null;
  pinned?: boolean;
  createdAt: string;
};
```

排序规则：

1. 有效置顶公告。
2. 其他公告和通知按发布时间或创建时间倒序。
3. 通知等级只影响视觉，不影响排序。

未读数口径：个人未读通知 + 可见且未读公告。过期通知和过期公告不计入未读数。

归档规则：

- 默认列表不显示归档消息。
- 状态筛选支持 `全部 / 未读 / 已读 / 归档`。
- `全部` 表示未归档的全部消息。
- 归档筛选中支持恢复。

## API 设计

用户侧消息流：

```text
GET    /api/admin/messages
GET    /api/admin/messages/unread-count
GET    /api/admin/messages/{kind}/{id}
POST   /api/admin/messages/read
POST   /api/admin/messages/archive
POST   /api/admin/messages/restore
POST   /api/admin/messages/read-all
GET    /api/admin/messages/stream
```

通知管理：

```text
GET    /api/admin/notifications
GET    /api/admin/notifications/{id}
POST   /api/admin/notifications/{id}/resend
GET    /api/admin/notifications/{id}/deliveries
GET    /api/admin/notifications/export
```

公告管理：

```text
GET    /api/admin/announcements
POST   /api/admin/announcements
PUT    /api/admin/announcements/{id}
POST   /api/admin/announcements/{id}/publish
POST   /api/admin/announcements/{id}/offline
GET    /api/admin/announcements/export
```

## 前端体验

### 铃铛入口

右上角铃铛放在 Admin Layout 右侧区域，使用 Popover。

- Tab：全部 / 通知 / 公告。
- 每个 Tab 最近 5 条。
- 点击消息打开详情弹窗。
- 详情弹窗打开时自动标记已读。
- Popover 中提供“全部已读”和“查看全部”。
- 不做浏览器系统通知和声音提醒。

### 消息中心页面

个人消息中心从铃铛进入，不进入主菜单。

页面形态：上方筛选 + 消息列表 + 普通分页。

筛选能力：

- 状态：全部 / 未读 / 已读 / 归档。
- 内容来源：全部 / 通知 / 公告。
- 等级。
- 业务类型。
- 时间范围。
- 关键词。

列表能力：

- 展示标题、纯文本摘要、等级图标、业务类型、来源、时间、未读状态和附件标识。
- 支持勾选后批量已读、批量归档。
- 归档筛选里支持恢复。
- 不支持用户侧物理删除。

### 消息详情弹窗

通知和公告都通过详情弹窗承接，铃铛和消息中心行为一致。

- 使用 `TrueAdminModal`。
- 默认宽度 860-960。
- 支持全屏。
- 展示 Markdown 内容、附件、来源、时间、操作主体、payload。
- 有 `targetUrl` 时展示“前往处理”按钮。
- 不支持上一条/下一条。
- 打开通知详情自动标记通知已读。
- 打开公告详情自动写入公告已读记录。

### 管理后台

通知管理和公告管理放在系统管理下。

通知管理：

- 批次列表使用标准 CRUD 表格。
- 投递明细通过抽屉或详情表格承接。
- 支持状态、来源、类型、等级、时间等筛选。
- 支持手动重发。
- 支持按当前筛选条件导出批次和投递明细。
- 不允许管理后台代用户标记已读或归档。
- 详情中以 JSON 只读展示 payload。

公告管理：

- 标准 CRUD 表格 + 表单弹窗。
- 支持草稿、定时发布、发布、下线。
- 支持全员或指定角色范围。
- 角色范围使用现有角色下拉多选。
- 支持 Markdown 编辑/预览切换。
- 发布后允许调整有效期、置顶和状态，不允许改正文和附件。

## 前端类型注册

前端提供标准消息结构和类型注册能力，但不开放完整自定义消息卡片，避免插件破坏通知中心 UI 一致性。

```ts
type AdminMessageTypeConfig = {
  label?: string;
  icon?: React.ReactNode;
  color?: string;
  onClick?: (message: AdminMessageItem, context: AdminMessageClickContext) => void | Promise<void>;
};
```

规则：

- 后端只保存 `type` 字符串。
- 前端核心注册基础类型：`system / announcement / alert`。
- 插件或模块可注册自己的类型，例如 `approval / order / workflow`。
- 未注册类型使用默认图标、默认颜色，并显示原始 `type`。

## 通知发送服务

模块和插件可以直接调用通知服务，也可以通过事件驱动发送。第一版先实现服务调用，事件监听作为扩展规范保留。

发送参数建议：

```ts
type AdminNotificationSendInput = {
  receiverIds?: number[];
  roleIds?: number[];
  roleCodes?: string[];
  targets?: Array<{ type: 'admin' | 'role'; value: number | string }>;
  type: string;
  level: 'info' | 'success' | 'warning' | 'error';
  source: string;
  title?: string;
  content?: string;
  templateKey?: string;
  variables?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  attachments?: AttachmentValue[];
  targetUrl?: string;
  dedupeKey?: string;
  dedupeTtlSeconds?: number;
  expiresAt?: string;
  afterCommit?: boolean;
};
```

发送规则：

- 接收人支持管理员 ID、角色 ID、角色 code 和统一 targets 数组。
- 服务层统一归一化 targets，再解析后台管理员 ID。
- 同一管理员由多个来源命中时自动去重，只投递一条。
- 接收人不存在或被禁用时跳过，记录 `skipped` 状态和原因。
- 支持可选 `dedupeKey`。
- 传入 `dedupeTtlSeconds` 时，在 TTL 窗口内按 `dedupeKey + receiverId` 去重。
- 未传 TTL 时永久去重。
- 重复投递记录为 `skipped: duplicated`。
- 支持 `afterCommit`，事务提交后再投递。
- payload 必须是 JSON object，只限制大小，不做业务 schema 校验。

模板规则：

- 发送时可以直接传 `title/content`。
- 也可以传 `templateKey + variables`。
- 模板第一版由代码注册，不做模板管理后台。
- 模板按接收管理员当前语言分别渲染。
- 批次表保存模板和变量，投递表保存最终 `title/content/locale`。
- 历史消息不因模板后续修改而变化。

公告第一版不做多语言字段。

## 内容、Markdown 和附件

标题为纯文本，建议 120 字以内。内容使用 Markdown 原文存储。

Markdown 规则：

- 不允许原始 HTML。
- 列表和铃铛只展示纯文本摘要。
- 详情弹窗中渲染 Markdown。
- Markdown 不支持内嵌图片。
- 公告编辑需要编辑/预览切换。

附件规则：

- 通知和公告都支持附件。
- 附件字段沿用现有附件 JSON 必要字段，例如 `id / name / url / size / mimeType / extension`。
- 列表卡片不直接展开附件，只展示附件标识。
- 详情弹窗展示附件列表。
- 预览和下载复用现有附件只读能力。
- 上传限制复用系统上传配置，不在通知模块重复定义。

## 实时同步

实时通道使用适配器设计，默认 `auto`。

- 优先 SSE。
- SSE 成功后停止轮询。
- SSE 失败或连续断开后降级轮询。
- 降级期间定期尝试恢复 SSE。
- 后端不支持 SSE 时，系统仍可正常轮询。

轮询策略：

- 页面可见：30 秒。
- 页面隐藏：180 秒。
- 页面恢复可见时立即刷新。

SSE 策略：

- 复用当前 Admin 登录态 Cookie/Header。
- 心跳 30 秒。
- 每个后台管理员最多 3 个 SSE 连接。
- 第一版 SSE 只推 `sync_required`，不推完整消息。

SSE 事件示例：

```text
event: sync_required
data: {"reason":"notification_created"}
```

前端收到后重新拉取未读数和当前列表。

变更事件建议：

```text
AdminMessageChangedEvent
```

触发场景：

- 通知投递成功。
- 公告发布、下线或状态变化。
- 用户标记已读。
- 用户归档或恢复。
- 批量已读或批量归档。

实时模块监听该事件后给相关管理员推送 `sync_required`。

## 权限

第一版按后台 RBAC 权限点控制，不做来源模块隔离。`source` 字段用于筛选和审计，后续可扩展来源隔离。

建议权限点：

```text
system.message.view
system.notification.view
system.notification.resend
system.notification.export
system.announcement.view
system.announcement.create
system.announcement.update
system.announcement.publish
system.announcement.offline
system.announcement.export
```

## 状态枚举

通知等级：

```text
info / success / warning / error
```

内置消息类型：

```text
system / announcement / alert
```

批次状态：

```text
draft / sending / completed / partial_failed / failed
```

投递状态：

```text
pending / sent / failed / skipped
```

公告状态：

```text
draft / scheduled / active / expired / offline
```

公告范围：

```text
all / roles
```

公告发布规则：

- 草稿时 `publish_at / expire_at` 可为空。
- 发布或定时发布时 `publish_at` 必填。
- `expire_at` 可空，表示长期有效。
- `expire_at` 必须晚于 `publish_at`。
- `scope=roles` 时必须选择至少一个角色。

## 实施步骤

1. 封装 `core/markdown`，包含只读渲染和编辑/预览切换。
2. 后端新增迁移、模型、枚举和 Repository。
3. 实现通知发送服务、接收人解析、模板渲染、去重、投递记录和 `afterCommit`。
4. 实现公告服务、公告发布范围、公告已读、公告归档和恢复。
5. 实现统一消息流、未读数、详情、已读、归档、恢复和全部已读接口。
6. 实现 `core/notification` 的类型、注册表、服务、store、轮询适配器和 SSE 适配器。
7. 接入右上角铃铛和 Popover。
8. 实现消息中心页面。
9. 实现通知管理和公告管理页面。
10. 补充开发示例：发送通知、发布公告、实时同步状态展示。

## 设计结论

- 站内消息是 Admin 底层能力，不作为普通插件实现。
- 公告独立建模，用户侧通过统一消息流聚合。
- 个人通知使用批次 + 投递记录，支持排查、重发、去重和多语言渲染。
- 前端统一标准消息 UI，插件只注册类型图标、颜色和点击行为。
- 实时通道默认 auto，SSE 只做变化通知，轮询兜底。
- 详情弹窗是通知和公告的统一承接方式。
