# API 规范

## 风格

TrueAdmin 使用 RESTful API，并通过 OpenAPI/Swagger 描述接口契约。

TrueAdmin 路由路径由 Controller 注解显式声明。注解里的 `path` 是完整控制器资源路径，不再由框架隐式追加 `/api/admin`、`/api/v1/client` 等 base path。方法注解的 `path` 只表示资源内子路径，例如空字符串、`{id}`、`{id}/enable`。

TrueAdmin 按调用方划分 API 边界：

```text
/api/admin
/api/v1/client
/api/v1/open
```

详细说明见 [API 边界设计](api-boundaries.md) 和 [API 版本与复用边界](versioning-and-reuse.md)。

示例：

```php
#[AdminController(path: '/api/admin/system/users')]
final class AdminUserController extends AdminController
{
}

#[ClientController(path: '/api/v1/client/products')]
final class ProductController extends ClientController
{
}

#[ClientController(path: '/api/v2/client/products')]
final class ProductController extends ClientController
{
}
```

## 认证

认证方式使用 JWT Token。

请求头：

```http
Authorization: Bearer <token>
```

## 响应结构

成功响应：

```json
{
  "code": "SUCCESS",
  "message": "success",
  "data": {}
}
```

失败响应：

```json
{
  "code": "KERNEL.REQUEST.VALIDATION_FAILED",
  "message": "参数校验失败",
  "data": {
    "errors": [
      {
        "field": "username",
        "code": "REQUIRED",
        "message": "用户名不能为空",
        "params": {}
      }
    ]
  }
}
```

`code` 是稳定的机器契约，前端、SDK 和自动化测试都应优先依赖 `code`。`message` 由后端根据请求语言返回本地化后的展示文案，前端通常可以直接展示；前端仍可根据 `code` 做特殊交互，例如跳转登录、标记表单字段、弹出确认框或触发重试。

后端默认读取 `Accept-Language` 请求头设置语言，例如 `zh-CN`、`zh_CN`、`en-US`、`en`。未传语言时使用默认 `zh_CN`，找不到翻译时回退 `en`。

插件错误码必须带插件命名空间，不使用数字号段，避免插件市场和第三方扩展冲突：

```json
{
  "code": "PLUGIN.ACME.CMS.BANNER_NOT_FOUND",
  "message": "Banner 不存在",
  "data": {
    "params": {
      "id": 10001
    }
  }
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

后台管理列表查询使用统一参数协议：

```http
GET /api/admin/system/users?page=1&pageSize=20&keyword=admin
GET /api/admin/system/users?filter={"status":"enabled"}&op={"status":"="}
GET /api/admin/system/users?sort=created_at&order=desc
```

`filter` 和 `op` 为 JSON 对象字符串，后端只会应用 Repository 白名单中允许的字段和操作符。常用操作符包括 `=`、`<>`、`>`、`>=`、`<`、`<=`、`like`、`in`、`between`。

## HTTP 方法

- `GET`：查询列表或详情。
- `POST`：创建资源或执行明确动作。
- `PUT`：整体更新资源。
- `PATCH`：局部更新资源。
- `DELETE`：删除资源。

## 命名约定

- 路径使用小写短横线。
- JSON 字段使用 camelCase。
- 数据库字段使用 snake_case。
- 权限标识使用模块加动作，例如 `system:user:create`。

## 常用接口示例

```text
POST   /api/admin/auth/login
POST   /api/admin/auth/logout
GET    /api/admin/auth/me
GET    /api/admin/system/users
POST   /api/admin/system/users
GET    /api/admin/system/users/{id}
PUT    /api/admin/system/users/{id}
DELETE /api/admin/system/users/{id}
```

## 错误码规范

错误码统一使用大写字符串，不使用数字号段。

- `SUCCESS`：成功。
- `KERNEL.*`：框架、请求、认证、权限、资源和服务端通用错误。
- `SYSTEM.*`：系统模块错误，例如后台认证、角色、菜单、权限点。
- `{MODULE}.{DOMAIN}.{ERROR}`：业务模块错误，例如 `PRODUCT.ADMIN.SKU_DUPLICATED`。
- `PLUGIN.{VENDOR}.{PACKAGE}.{ERROR}`：插件错误，例如 `PLUGIN.ACME.CMS.BANNER_NOT_FOUND`。

后端异常响应必须包含 `code`、`message`、`data`。`message` 来自错误码 enum 上的 `#[Message]` 翻译 key，并通过 `hyperf/translation` 返回当前语言文案，但不作为前端逻辑判断依据。需要插值展示的信息放入 `data.params` 或具体业务字段中，禁止把动态变量拼进 `code` 或在业务抛错时临时拼接 `message`。

错误码是运行时异常响应契约，不是框架资产清单。第一版不做错误码收集、注册、同步和扫描命令，也不要求每个模块维护 `error_codes.php`。开发者新增错误码时，只需要在对应模块的 `Constant/*ErrorCode.php` 中声明 string backed enum，并使用 `TrueAdmin\Kernel\Constant\ErrorCodeTrait` 复用 Hyperf 官方 `hyperf/constants` 的 `EnumConstantsTrait`、`code()` 和 `message()` 默认实现。错误文案应通过 `#[Message]` 放在对应模块的 `resources/lang/{locale}/errors.php` 中；`app/Foundation/resources/lang` 只维护 `KERNEL.*` 通用文案，项目根级 `resources/lang` 作为最终覆盖层。`packages/kernel` 只保留 `SUCCESS` 和 `KERNEL.*` 通用错误码，业务模块和插件不得把自己的业务错误码放进 kernel。

是否需要错误码清单、重复检查、OpenAPI 错误响应导出，留到后续确有明确场景时再设计。若以后需要，也应优先基于专门的错误码 Attribute 或独立构建期检查，而不是复用 `#[Constants]` 这个通用枚举注解。

普通业务多语言不再封装 TrueAdmin 自定义 `t()` 或 `ta_trans()` 函数，优先直接使用 Hyperf 官方 `hyperf/translation` 提供的 `trans()` 或 `__()`。TrueAdmin 只补充模块、插件、项目覆盖层的语言包加载能力，不改变 Hyperf 的翻译调用方式。这样开发者查文档、排查行为和升级依赖时都能直接对齐 Hyperf 官方语义。

```php
use function Hyperf\Translation\trans;

$title = trans('messages.product.created');
```

```php
<?php

declare(strict_types=1);

namespace App\Module\Product\Constant;

use Hyperf\Constants\Annotation\Constants;
use Hyperf\Constants\Annotation\Message;
use TrueAdmin\Kernel\Constant\ErrorCodeInterface;
use TrueAdmin\Kernel\Constant\ErrorCodeTrait;

#[Constants]
enum ProductErrorCode: string implements ErrorCodeInterface
{
    use ErrorCodeTrait;

    #[Message('errors.product.admin.not_found')]
    case NOT_FOUND = 'PRODUCT.ADMIN.NOT_FOUND';
}
```

业务抛错只传 enum、HTTP 状态和可选参数：

```php
throw new BusinessException(ProductErrorCode::NOT_FOUND, 404, ['id' => $id]);
```

## OpenAPI 要求

新增接口必须包含：

- 路径。
- 方法。
- 摘要。
- 权限点。
- 请求参数。
- 响应结构。
- 错误响应。
- 至少一个示例。

AI 生成后端或前端代码时，应优先参考 OpenAPI 契约，而不是仅根据页面描述猜测字段。
