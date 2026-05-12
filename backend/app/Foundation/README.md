# Foundation

项目级可改基础层。

这里只保留尚未进入 `trueadmin-kernel`、且仍属于模板项目默认行为的基础实现。

当前保留：

- `Http/Controller/HealthController.php`：模板健康检查入口。
- `Repository/AbstractRepository.php`：模板 Repository 组合层和项目可覆盖查询钩子。

不要在这里重新复制已经进入 `trueadmin-kernel` 的能力，例如 Controller 基类、异常处理、权限中间件、ActorFactory、Model 基类、密码 helper、树 helper、Service helper、AfterCommit callbacks 或 kernel 语言包。

不要把具体业务规则放到这里；业务规则应进入 `app/Module`。
