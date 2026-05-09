# 身份与权限边界规范

TrueAdmin 同时考虑后台管理端、用户端和外部开放平台。三类调用方的身份模型、权限模型和数据生命周期不同，默认不共用一张用户表。

## 核心决策

TrueAdmin 默认采用三套身份边界：

```text
admin_*   后台管理身份和权限体系
client_*  用户端基础账号和未来用户端业务体系
open_*    外部开放平台应用和调用体系
```

后台用户和用户端用户不共用一张表。

第一版内置 `client_users`，它属于 `Module/System` 的系统基础账号资源，不创建泛化 `Module/User`。`Module/Auth` 不拥有用户表，只负责 Admin、Client、Open 的登录、Token、当前身份等认证流程。

## 后台身份体系

后台身份体系服务 Web 管理端、运营人员、企业内部管理人员。

推荐表名前缀：

```text
admin_users
admin_roles
admin_menus
admin_permissions
admin_user_roles
admin_role_permissions
admin_departments
admin_user_departments
admin_positions
```

后台体系默认支持：

- 菜单权限。
- 按钮权限。
- 接口权限。
- 数据权限。
- 角色层级和子角色授权边界。
- 多部门、主部门、部门岗位。
- 操作日志。
- 登录日志。
- 后台审计。

角色层级用于控制授权边界，而不是默认继承权限。子角色的权限范围必须是父角色权限范围的子集：

```text
admin_roles.parent_id
admin_roles.level
admin_roles.path
admin_roles.sort
```

父角色拥有的菜单、按钮、接口权限和数据权限，是子角色可被授权的上限。普通管理员只能管理自己可管理角色树内的角色，不能创建或授权超过自身权限范围的角色。`super-admin` 是根级特殊角色，可以绕过角色层级约束，但仍应保留操作日志。

后台管理员第一版按多部门设计：

```text
admin_departments.parent_id       父部门
admin_departments.level           部门层级
admin_departments.path            祖先链
admin_users.primary_dept_id       默认操作部门
admin_user_departments.user_id    管理员 ID
admin_user_departments.dept_id    所属部门 ID
admin_user_departments.is_primary 是否主部门
```

`admin_departments` 是标准部门资源，由后台部门管理接口维护。主部门用于默认操作部门和写入归属，不等同于唯一可见部门。数据权限应基于当前 operator 的可见部门集合计算：用户所属部门集合、所属部门及子部门、角色自定义部门集合等都可以成为数据范围。

如果用户属于多个部门，前端可以提供“当前操作部门”切换能力，但只能切换到该用户所属部门集合内。未显式切换时，当前操作部门等于主部门。操作日志和审计信息应记录本次操作部门，方便还原当时是以哪个部门身份执行操作。

后台 Token 应使用：

```text
aud = admin
```

## 后台菜单和链接资源

后台菜单权限基于 `admin_menus` 和 `admin_role_menu`。菜单表保存的是后台资源树，不是前端动态页面定义。

资源类型固定为：

```text
directory  目录分组
menu       内部页面入口
button     按钮或接口权限点
link       外部链接入口
```

`menu` 和 `button` 必须来自代码元数据同步，属于 `source=code`。模块或插件通过 Controller Attribute 声明内部页面和按钮权限，前端通过 manifest 提供对应路由组件。后台管理页面可以调整代码资源的名称、图标、排序、父级和状态，但不能把代码资源改成别的类型，也不能把 `path`、`permission` 当成普通配置项随意改写。

后台自定义资源属于 `source=custom`，只允许创建 `directory` 和 `link`。`link` 可参与角色授权，建议为链接生成或填写独立权限点；没有权限点的目录只作为可见容器，由子节点权限决定实际可见性。

链接打开方式：

```text
blank   新标签页
self    当前窗口
iframe  系统内 iframe 承载
```

`iframe` 只是显示策略，不改变权限模型。用户能否看到链接仍取决于角色是否被授权对应菜单资源。

## 用户端身份体系

用户端身份体系服务 App、小程序、H5、会员端、员工轻量工作台或其他用户端应用。

推荐表名前缀：

```text
client_users              第一版内置，归属 Module/System
client_profiles           未来按业务需要归属 Member/Customer 等模块
client_identities         未来第三方身份绑定，可归属 Auth 或业务身份模块
client_sessions           未来会话或设备管理，可归属 Auth
```

`client_users` 只表示用户端基础认证主体，适合存放账号、手机号、邮箱、密码、状态、注册渠道、最后登录时间和轻量展示字段。它不承载会员等级、积分余额、客户画像、业务标签等扩展资料。用户端登录、刷新 Token、获取当前身份这类认证入口归属 `Module/Auth/Http/Client`；会员资料、客户资料、订单等业务接口归属对应业务模块的 `Http/Client`。

用户端默认只做：

- 登录鉴权。
- 用户身份上下文。
- 个人资料。
- 第三方身份绑定。
- 业务接口访问控制。

用户端默认不做：

- 后台菜单权限。
- 后台按钮权限。
- 后台数据权限。
- 后台组织岗位权限。

用户端 Token 应使用：

```text
aud = client
```

## 用户端授权方式

用户端授权通常是业务级授权，不套后台 RBAC。

常见判断方式：

- 是否已登录。
- 资源是否属于当前 `client_user`。
- 当前用户是否满足业务状态。
- 当前用户是否具备某个轻量 scope。
- 当前用户是否处于某个业务关系中。

示例：

```text
GET /api/v1/client/orders/{id}
```

应该判断订单是否属于当前用户，而不是判断用户是否拥有 `order:view` 菜单权限。

如果确实需要用户端能力控制，可以引入轻量 scope：

```text
client_user_scopes
```

但它不等同于后台菜单和数据权限。

## 开放平台身份体系

开放平台体系服务第三方系统、外部开发者和系统集成。

推荐表名前缀：

```text
open_apps
open_app_secrets
open_access_tokens
open_call_logs
```

开放平台默认应支持：

- App Key / Secret。
- 请求签名。
- 时间戳和防重放。
- 限流。
- 调用审计。
- 独立错误码。

开放平台不复用后台管理员 Token，也不复用用户端 Token。

## 同一自然人的关联

如果同一个自然人既有后台账号，又有用户端账号，不通过共用主表解决。

推荐使用关联表：

```text
admin_client_links
```

示例字段：

```text
id
admin_user_id
client_user_id
link_type
created_at
```

这样可以关联身份，又不污染两套模型。

## 第一阶段迁移建议

第一阶段优先建设后台管理体系：

```text
admin_users
admin_roles
admin_menus
admin_permissions
admin_user_roles
admin_role_permissions
admin_departments
admin_positions
```

用户端第一版内置最小基础账号表：

```text
Module/System/Model/ClientUser.php
Module/System/Database/Migrations/*_create_client_users_table.php
Module/System/Http/Admin/Controller/ClientUserController.php
```

项目真正需要 App、小程序、H5 或会员端业务资料时，再按业务语义新增模块，例如 `Member` 或 `Customer`，并通过 `client_user_id` 关联 `client_users`。

开放平台先预留设计，不急于落表。

## AI 开发提醒

AI 生成代码时必须先判断接口属于哪类调用方：

- `admin`：使用后台身份和 RBAC 权限。
- `client`：使用用户端身份和业务授权。
- `open`：使用开放平台认证和签名。

不要把后台用户表、用户端用户表和开放平台应用表混用。
