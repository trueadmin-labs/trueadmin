# TrueAdmin Backend

后端目录用于承载 Hyperf 应用。

## 技术选择

- PHP。
- Hyperf。
- PostgreSQL。
- Redis。
- JWT。
- OpenAPI/Swagger。

## 架构方式

后端采用单体模块化架构。

推荐模块：

```text
app/Module/Auth
app/Module/System
app/Module/Permission
app/Module/Organization
app/Module/Dictionary
app/Module/Log
app/Module/File
app/Module/Generator
```

## 分层约定

每个模块优先保持以下结构：

```text
Controller/
Request/
Service/
Repository/
Model/
DTO/
Policy/
Event/
Listener/
Test/
```

## 第一阶段后端能力

- JWT 登录认证。
- 用户、角色、菜单、按钮权限、接口权限。
- 部门、岗位和组织树。
- 字典、日志、文件上传。
- OpenAPI 接口契约。
- CRUD 代码生成模块预留。

## AI 开发提醒

新增后端能力前，先确认：

- 模块归属。
- API 路径。
- Request 校验规则。
- 权限点。
- 数据表和字段。
- OpenAPI 契约。

