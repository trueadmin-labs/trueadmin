# 后端层级边界规范

本文档定义 TrueAdmin 后端在 `packages/kernel`、`backend/app/Foundation`、`backend/app/Infrastructure` 和 `backend/app/Module` 之间的职责边界。

它解决的问题是：有些能力需要独立沉淀，但不适合放进 Composer 包；有些能力也不是具体业务模块，不应该塞进 `Module/System` 或某个业务模块里。

## 总体分层

TrueAdmin 后端采用四层组织：

```text
packages/kernel
  可作为 Composer 包发布的框架原语。

backend/app/Foundation
  项目级可改基础层，承接 kernel 的默认实现和项目定制。

backend/app/Infrastructure
  项目级技术适配层，承接外部服务、存储、队列、缓存等实现。

backend/app/Module
  业务模块和系统业务能力。
```

一句话判断：

```text
Kernel 提供稳定原语。
Foundation 提供项目默认行为。
Infrastructure 提供技术适配。
Module 承载业务能力。
```

## 推荐目录结构

```text
backend/
  app/
    Foundation/
      Http/
        Controller/
        Middleware/
        Request/
      Auth/
        Guard/
        ActorResolver/
      Exception/
      OpenApi/
      Crud/
      Support/

    Infrastructure/
      Cache/
      Lock/
      Storage/
      Queue/
      Sms/
      Mail/
      Payment/

    Module/
      Auth/
      System/
      User/
      Product/
      Order/
      Workflow/
      Message/
```

第一版不要求创建所有目录。只在出现明确能力时创建对应目录。

## packages/kernel 边界

`packages/kernel` 是 TrueAdmin 的 Composer 核心包。

它应该放真正稳定、跨项目复用、不依赖具体业务表和项目规则的框架原语。

适合放入 kernel：

```text
错误码原语
业务异常基类
基础 Controller 抽象
基础 Model 抽象
框架级监听器
Actor / ActorContext 原语
接口元数据 Attribute 契约
数据权限 Attribute / Context / AOP 原语
操作日志 Attribute / Event / AOP 原语
通用工具原语
```

不适合放入 kernel：

```text
项目自己的响应字段命名偏好
项目自己的异常映射规则
项目自己的管理员身份解析
项目自己的权限表结构
项目自己的数据权限规则和落库实现
项目自己的操作日志落库规则
项目自己的对象存储供应商
项目自己的短信、邮件、支付实现
项目自己的后台业务生成器规则
```

判断标准：如果一个能力放进 Composer 包后，使用者大概率需要 fork 或修改包源码才能适配项目，那它不应该先进 `packages/kernel`。

## backend/app/Foundation 边界

`Foundation` 是项目级可改基础层。

它承接 `packages/kernel` 的默认实现，也承载项目自己的全局行为。它不作为 Composer 包发布，开发者可以直接修改。

适合放入 Foundation：

```text
项目级 Controller 基类
项目级 CRUD 默认行为
项目级 Request 基类
项目级 Middleware 组合
项目级异常映射
项目级响应格式定制
项目级 Actor 解析策略
Admin / Client / Open 的身份解析适配
OpenAPI 输出定制
全局辅助函数或项目工具
```

示例：

```text
backend/app/Foundation/Http/Controller/AdminController.php
backend/app/Foundation/Http/Controller/ClientController.php
backend/app/Foundation/Crud/AbstractCrudController.php
backend/app/Foundation/Auth/ActorResolver/AdminActorResolver.php
backend/app/Foundation/Exception/ExceptionMapper.php
backend/app/Foundation/OpenApi/OpenApiCustomizer.php
```

Foundation 可以依赖 kernel。

Foundation 不应该依赖具体业务模块。如果某个能力需要依赖 `Module/System` 的角色、菜单、部门、岗位表，它通常不再是 Foundation，而应该进入 `Module/System` 或由 Foundation 定义接口、System 提供实现。

## backend/app/Infrastructure 边界

`Infrastructure` 是项目级技术适配层。

它放外部技术、供应商和运行时资源的适配，不承载业务规则。

适合放入 Infrastructure：

```text
Redis 缓存封装
分布式锁
对象存储适配
队列投递适配
短信供应商适配
邮件供应商适配
支付供应商适配
第三方 HTTP Client
文件扫描、图片处理等技术服务
```

示例：

```text
backend/app/Infrastructure/Storage/StorageManager.php
backend/app/Infrastructure/Sms/SmsSender.php
backend/app/Infrastructure/Mail/MailSender.php
backend/app/Infrastructure/Lock/RedisLock.php
backend/app/Infrastructure/Queue/QueueDispatcher.php
```

Infrastructure 可以依赖 kernel。

Infrastructure 不应该直接依赖业务模块。如果业务模块需要发送短信，应由模块 Service 调用 Infrastructure 的接口或服务，而不是让 Infrastructure 反向调用业务模块。

## backend/app/Module 边界

`Module` 是业务能力主目录。

适合放入 Module：

```text
认证登录
管理员
用户端用户
角色
菜单
权限
部门
岗位
字典
配置
操作日志
登录日志
商品
订单
审批
消息
文件业务规则
```

`Module/System` 是系统业务模块，不是框架层。

适合放入 `Module/System`：

```text
菜单权限
角色权限
部门岗位
数据权限具体规则
操作日志入库
登录日志
字典配置
系统参数
系统级业务事件
```

注意：`DataScope`、`OperationLog` 这类 Attribute 和 AOP 原语进入 kernel；基于后台权限表、部门表、日志表的具体策略和落库实现留在 `Module/System`。

不应该因为想复用基类，就让所有模块依赖 `Module/System`。基类进入 kernel 或 Foundation，系统业务能力才进入 `Module/System`。

## Command / Listener / Crontab 边界

第一版不在 `backend/app` 下保留全局 `Command`、`Listener`、`Crontab` 入口目录，避免全局代码成为默认落点。

归属规则：

```text
框架级生命周期监听器进入 packages/kernel。
项目级基础能力命令或监听器进入 backend/app/Foundation 的具体能力目录。
技术适配类维护任务进入 backend/app/Infrastructure 的具体适配目录。
业务命令、业务监听器、业务定时任务进入对应 Module。
```

示例：

```text
backend/app/Foundation/Database/Command/TrueAdminMigrationPathsCommand.php
backend/app/Foundation/Database/Listener/RegisterMigrationPathsListener.php
backend/app/Module/Message/Crontab/DispatchScheduledMessageCrontab.php
backend/app/Module/Order/Listener/IncreaseProductSalesListener.php
```

定时任务类只做调度入口，复杂业务规则应下沉到对应 Service。

## 依赖方向

推荐依赖方向：

```text
Module -> Foundation -> Kernel
Module -> Infrastructure -> Kernel
Foundation -> Kernel
Infrastructure -> Kernel
```

禁止或谨慎的依赖方向：

```text
Kernel -> backend/app/*
Foundation -> Module
Infrastructure -> Module
Module/A -> Module/B 的内部实现
```

如果模块之间需要协作，优先通过以下方式：

```text
直接调用对方公开 Service 方法。
通过 Event / Listener 做副作用解耦。
后续复杂后再抽 Contract 或插件能力契约。
```

第一版不强制过度契约化。大部分后台项目可以保持简单直接，但必须避免跨模块访问对方 Controller、Model 私有细节或 Repository 内部查询。

## 命名禁忌

不要新增 `Common` 作为根目录。

原因是 `Common` 太容易变成垃圾桶，长期会失去边界。

推荐命名：

```text
Foundation   项目级基础行为
Infrastructure 项目级技术适配
Module       业务模块
```

模块内部可以保留 `Http/Common`，但它只表示模块内 HTTP 相关的共用入口，不代表全局公共层。

## AI 放置规则

AI 新增文件前应先判断：

- 如果是跨项目稳定原语，放 `packages/kernel`。
- 如果是项目可改默认行为，放 `backend/app/Foundation`。
- 如果是外部技术或供应商适配，放 `backend/app/Infrastructure`。
- 如果是业务规则或系统业务能力，放 `backend/app/Module`。
- 如果只是某个模块私有工具，放该模块自己的 `Library` 或 `Service` 附近。

不能判断时，优先放更靠近业务、更容易修改的位置；等稳定后再向 Foundation 或 kernel 沉淀。
