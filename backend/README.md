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

当前后端使用 `Kernel + Module` 结构：

```text
app/Kernel   框架层、横切能力和基础设施
app/Module   业务模块
```

`Kernel` 可以放统一响应、错误码、异常处理、中间件、基础模型、框架级 Listener、全局 Crontab。

业务代码必须放进具体模块。不要在 `app/` 外层继续新增 `Controller`、`Model`、`Listener`、`Crontab`。

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
Crontab/
Test/
```

## 第一阶段后端能力

- JWT 登录认证。
- 后台管理 API 分区：`/api/v1/admin`。
- 用户端 API 预留：`/api/v1/client`。
- 外部开放 API 预留：`/api/v1/open`。
- 用户、角色、菜单、按钮权限、接口权限。
- 部门、岗位和组织树。
- 字典、日志、文件上传。
- OpenAPI 接口契约。
- CRUD 代码生成模块预留。

## 本地启动

安装依赖：

```bash
composer install
```

启动服务：

```bash
composer start
```

默认管理员账号用于第一阶段认证闭环：

```text
username: admin
password: trueadmin
```

## 当前接口

```text
GET  /
POST /api/v1/admin/auth/login
POST /api/v1/admin/auth/logout
GET  /api/v1/admin/auth/me
GET  /api/v1/open/openapi.json
```

## AI 开发提醒

新增后端能力前，先确认：

- 模块归属。
- API 路径。
- Request 校验规则。
- 权限点。
- 数据表和字段。
- OpenAPI 契约。
