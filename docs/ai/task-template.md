# AI 任务拆分模板

复制此模板描述一次具体开发任务。

## 任务名称

示例：新增用户管理列表页

## 背景

说明为什么要做这个任务，以及它属于哪个模块。

## 目标

说明本次任务完成后应具备的能力。

## 修改范围

允许修改的目录或文件：

- `backend/...`
- `web/...`
- `docs/...`

## 非目标

明确这次不做的内容，减少 AI 扩写范围。

## 业务规则

列出关键规则。

## API 契约

列出涉及接口。

```text
GET /api/v1/system/users
POST /api/v1/system/users
```

## 权限点

列出涉及权限。

```text
system:user:list
system:user:create
system:user:update
system:user:delete
```

## 数据结构

说明涉及表、字段或 DTO。

## 页面要求

说明 Web 或移动端页面结构。

## 验收标准

- 功能行为符合业务规则。
- 接口响应符合 API 规范。
- 权限控制生效。
- 相关文档已更新。
- 测试或验证结果已说明。

## 备注

放置额外上下文或限制。

