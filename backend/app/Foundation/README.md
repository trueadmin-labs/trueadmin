# Foundation

项目级可改基础层。

这里放承接 `trueadmin-kernel` 的项目默认实现，例如项目级 Controller 基类、CRUD 默认行为、异常映射、响应格式、Actor 解析策略和 OpenAPI 定制。

不要把具体业务规则放到这里；业务规则应进入 `app/Module`。
