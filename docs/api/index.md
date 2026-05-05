# API 文档

TrueAdmin 使用 RESTful API + OpenAPI/Swagger。API 文档同时服务后端实现、Web 管理端、移动端、外部开放平台和 AI 代码生成。

## API 分区

```text
/api/admin   后台管理端 API
/api/v1/client  用户端 API
/api/v1/open    外部开放平台 API
```

Admin 默认不在代码目录中拆 `V1/V2`，因为后台系统通常由同一团队维护，版本兼容压力较低。Client 和 Open 面向 App、小程序、H5 或第三方系统，Controller、Request、Vo 按版本组织，Service、Repository、Model 默认在模块内复用。

## 身份边界

TrueAdmin 默认采用三套身份体系：

```text
admin_*   后台管理身份和权限体系
client_*  用户端身份和业务用户体系
open_*    外部开放平台应用和调用体系
```

后台用户和用户端用户默认不共用一张表。Client 端通常只做登录鉴权和业务级授权，不套后台菜单权限、按钮权限和数据权限。

## 响应结构

成功响应：

```json
{
  "code": "SUCCESS",
  "message": "success",
  "data": {}
}
```

分页响应：

```json
{
  "code": "SUCCESS",
  "message": "success",
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 0
  }
}
```

## 专题文档

- [API 规范](api-conventions.md)
- [API 边界设计](api-boundaries.md)
- [身份与权限边界](identity-and-permissions.md)
- [API 版本与复用边界](versioning-and-reuse.md)
