# API 版本与复用边界规范

TrueAdmin 使用 `app/Module + 模块内 MineAdmin 分层`。

API 版本主要隔离对外契约，不是复制整个模块。Admin 后台端默认不在代码目录中拆 `V1`、`V2`，Client 和 Open 这类面向用户端或外部调用方的入口才按版本组织。

## 路径规划

```text
/api/v1/admin   后台管理端 API
/api/v1/client  用户端 API
/api/v1/open    外部开放平台 API
```

## 代码路径

Admin Controller（不按版本拆目录）：

```text
Module/Product/Http/Admin/Controller/ProductController.php
```

Client Controller（按版本拆入口契约）：

```text
Module/Product/Http/Client/Controller/V1/ProductController.php
```

Service、Repository、Model 默认在模块内复用：

```text
Module/Product/Service/ProductQueryService.php
Module/Product/Repository/ProductRepository.php
Module/Product/Model/Product.php
```

## 版本组织

Client 或 Open 新增 `v2` 时，优先新增入口契约：

```text
Module/Product/Http/Client/Controller/V2/ProductController.php
Module/Product/Http/Client/Request/V2/ProductRequest.php
Module/Product/Http/Client/Vo/V2/ProductResource.php
```

不要复制整个 `Product` 模块。

## Service 是否复用

如果后台和用户端流程相似，可以复用模块内 Service。

如果差异明显，可以在同一模块内拆分：

```text
Module/Product/Service/ProductQueryService.php
Module/Product/Service/ClientProductQueryService.php
```

## Repository 与 Model

Repository 和 Model 默认按模块复用，不按端和版本复制。

```text
Module/Product/Repository/ProductRepository.php
Module/Product/Model/Product.php
```

## AI 开发提醒

AI 新增接口前必须先判断：

- 属于哪个模块。
- 调用端是 `admin`、`client` 还是 `open`。
- 如果调用端是 `client` 或 `open`，确认 API 版本是 `v1` 还是 `v2`；`admin` 默认不拆代码版本目录。
- 是否需要新增 Controller、Request、Vo。
- 是否可以复用模块内 Service、Repository、Model。
- 是否需要 `DataScope`、操作日志、事件监听。
