# 模块 Prompt 模板

该模板用于让 AI 按 TrueAdmin 约定生成一个后台模块。

```text
你正在为 TrueAdmin 开发一个后台模块。

请先阅读：
- README.md
- docs/architecture.md
- docs/api/api-conventions.md
- docs/ai/ai-development-guide.md

模块名称：

模块职责：

技术范围：
- 后端：Hyperf
- Web：React + Vite + Ant Design
- 移动端：本次是否涉及

主要实体：

数据字段：

API 列表：

权限点：

页面入口：

本次只允许修改：

本次不做：

验收标准：

请先输出实现计划，再按计划修改文件。新增接口必须同步 OpenAPI 说明，新增权限必须登记权限点，完成后给出验证结果。
```

