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
#[AdminController(path: '/api/admin/organization/users')]
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
GET /api/admin/organization/users?page=1&pageSize=20&keyword=admin
GET /api/admin/organization/users?filter={"status":"enabled"}&op={"status":"="}
GET /api/admin/organization/users?sort=created_at&order=desc
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

## 附件字段契约

业务表中的附件字段使用 JSON/JSONB 数组保存附件快照，而不是保存前端上传组件的临时对象，也不是只保存文件 ID。快照只保留业务展示和再次访问所需的必要字段：

```json
[
  {
    "id": 10001,
    "name": "销售合同-客户已盖章",
    "url": "https://admin.example.com/uploads/admin/announcement/2026/05/xxx.pdf",
    "relativeUrl": "/uploads/admin/announcement/2026/05/xxx.pdf",
    "absoluteUrl": "https://admin.example.com/uploads/admin/announcement/2026/05/xxx.pdf",
    "extension": "pdf",
    "size": 245760,
    "mimeType": "application/pdf"
  }
]
```

字段含义：

- `id`：文件表主键，必填，用于后端校验文件是否存在、是否可关联到当前业务数据。
- `name`：业务展示名，必填，不含扩展名，允许前端在业务表单中编辑。
- `url`：文件实际访问地址，必填。拿到 URL 就代表业务允许访问文件本体，文件访问不再额外叠加后台数据权限判断。
- `relativeUrl`：相对访问路径，例如 `/uploads/...`，推荐返回。
- `absoluteUrl`：带站点或 OSS 域名的完整访问地址，推荐返回；`url` 默认与它保持一致。
- `extension`：扩展名，不含点，推荐返回。
- `size`：文件大小，单位 byte，推荐返回。
- `mimeType`：文件 MIME 类型，推荐返回。

后端保存业务数据时，应使用 `id` 回查文件表并规范化 `url`、`relativeUrl`、`absoluteUrl`、`extension`、`size`、`mimeType` 等可信字段；`name` 作为业务展示名保留前端传入值，但需要做长度、空值和安全字符校验。文件存储内部字段，例如磁盘、hash、路径、上传人、上传时间、存储桶等，不应复制进业务表附件 JSON。

文件表记录 `scope`、`owner_type`、`owner_id`、`owner_dept_id`、`category`、`visibility`、`status` 等字段，用于审计和后台文件管理列表的数据权限控制。这个权限边界只作用在文件记录管理接口上，不作用在文件 URL 本体访问上。业务模块保存了文件 URL 后，前端或外部页面可直接按 URL 访问。

上传接口第一阶段由系统模块提供：`POST /api/admin/files/upload` 用于本地上传，返回文件记录快照；`POST /api/admin/files/presign` 和 `POST /api/admin/files/complete` 用于 OSS 前端直传；`POST /api/admin/files/remote-url` 用于把远程 HTTP/HTTPS 文件转存到当前文件存储。OSS 直传必须返回真实签名 URL，不能用公开访问地址假装上传地址。

后端业务代码生成的报表、合同、PDF、图片等文件，不应该模拟 HTTP 上传，而应调用文件服务的 `storeFromContents()` 或 `storeFromStream()`。这些方法会复用同一套存储、URL、hash、文件记录和附件快照规则。`mimeType` 默认自动识别：优先根据真实文件内容识别，其次根据文件名扩展名兜底，最后才使用 `application/octet-stream`；业务方只有在明确需要覆盖时才传入 MIME。

远程 URL 转存必须由后端统一处理安全边界：只允许 `http`/`https`，禁止 localhost、内网和保留地址，限制重定向次数、连接超时、下载超时和最大文件大小，并在每次重定向后重新校验目标地址。

## 常用接口示例

```text
POST   /api/admin/auth/login
POST   /api/admin/auth/logout
GET    /api/admin/auth/me
GET    /api/admin/organization/users
POST   /api/admin/organization/users
GET    /api/admin/organization/users/{id}
PUT    /api/admin/organization/users/{id}
DELETE /api/admin/organization/users/{id}
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
