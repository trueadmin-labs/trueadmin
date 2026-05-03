# 贡献指南

感谢你关注 TrueAdmin。

TrueAdmin 是一个面向 AI 协作开发的企业级后台管理脚手架。贡献代码时，请优先保持项目结构、接口契约和文档约定的一致性。

## 贡献前请阅读

- `README.md`
- `docs/architecture.md`
- `docs/api/api-conventions.md`
- `docs/ai/ai-development-guide.md`

## 开发原则

- 先明确模块边界，再写代码。
- 新增接口必须补充 OpenAPI 契约。
- 新增按钮或接口权限必须登记权限点。
- 新增模块必须补充模块说明和测试要点。
- 修改业务规则必须同步更新文档。

## 提交建议

提交信息建议使用简洁动词开头：

```text
docs: add architecture draft
feat: add user module scaffold
fix: correct api response contract
```

## AI 协作

如果使用 AI 参与开发，请把任务背景、修改范围、非目标、API 契约、权限点和验收标准写清楚。推荐使用 `docs/ai/task-template.md`。

