# 插件系统规范

TrueAdmin 插件是前后端一体的扩展包。插件包根目录使用 `plugin.json` 作为包级清单，只描述插件身份、版本、插件依赖和 TrueAdmin 兼容性。各端 runtime 的依赖由各端目录自己管理：Web 使用 `web/package.json`，PHP 后端使用 `backend/php/composer.json`，Mobile 后续使用自己的 package 文件。

## 设计目标

- 本地插件、官方插件、市场插件和私有插件使用同一包结构。
- 插件可以携带后端代码、数据库迁移、种子数据、菜单、权限、OpenAPI、Web 页面、Mobile 页面、文档和 AI 上下文。
- 插件安装、升级、启用、禁用、卸载发生在开发期或部署期，不提供生产运行时动态下载并执行插件代码。
- 根 `plugin.json` 不承载 npm、Composer 或其他 runtime 依赖；安装器读取各端依赖文件生成安装计划。
- 根目录 `plugins/` 只作为插件包仓库和安装源，不参与宿主项目代码扫描。
- 插件生命周期可审计、可回滚、可灰度。

## 目录结构

插件包源统一放在项目根目录 `plugins/<vendor>/<name>`，与 `backend/`、`web/`、`mobile/` 同级。

```text
plugins/{vendor}/{name}/
  plugin.json
  backend/
    php/
      composer.json
      Http/
        Admin/
          Controller/
        Client/
          Controller/
        Open/
          Controller/
      Service/
      Repository/
      Model/
      Request/
      Vo/
      Event/
      Listener/
      Library/
      Database/
        Migrations/
        Seeders/
      resources/
        lang/
        menus.php
        permissions.php
        openapi.json
        metadata.json
  web/
    package.json
    manifest.ts
    pages/
    components/
    hooks/
    services/
    types/
    locales/
    index.ts
  mobile/
  docs/
  llms.txt
```

`backend/php/composer.json` 只描述 PHP runtime 自己的依赖和 autoload，不是 TrueAdmin 插件包清单。插件后端目录必须和 `backend/app/Module/*` 模块目录保持同构，业务类目录直接放在 `backend/php` 根下，不再额外包一层 `src/`。`web/package.json` 只描述 Web runtime 自己额外需要的 npm 依赖。Web runtime 不允许再放自己的 `plugin.json`；`web/manifest.ts` 只负责前端运行时注册。安装器复制 runtime 到各端运行时目录，Windows 下不使用软链。

## plugin.json 标准

插件根目录必须提供 `plugin.json`。示例：

```json
{
  "id": "true-admin.examples",
  "vendor": "true-admin",
  "name": "examples",
  "displayName": "Development Examples",
  "description": "Official TrueAdmin examples.",
  "official": true,
  "version": "0.1.0",
  "enabled": true,
  "dependencies": {
    "plugins": []
  },
  "compatibility": {
    "trueadmin": ">=0.1.0"
  },
  "lifecycle": {
    "install": "Acme\\Plugin\\Installer::install",
    "uninstall": "Acme\\Plugin\\Installer::uninstall",
    "upgrade": "Acme\\Plugin\\Installer::upgrade"
  }
}
```

字段规则：

- `id` 使用 `<vendor>.<name>`，例如 `true-admin.examples`。
- `vendor` 和 `name` 对应目录 `plugins/<vendor>/<name>`。
- `dependencies.plugins` 声明依赖的其他 TrueAdmin 插件 id。
- `compatibility.trueadmin` 声明兼容的 TrueAdmin 版本范围。
- `enabled` 是安装时默认启用建议；安装器最终会写入宿主项目 `backend/config/autoload/plugins.php`。
- 根 `plugin.json` 不声明 npm、Composer、Mobile 依赖，也不声明 runtime 路径。

## 各端依赖

Web runtime 依赖写在插件 `web/package.json`：

```json
{
  "name": "@true-admin/plugin-examples-web",
  "private": true,
  "dependencies": {
    "@ant-design/charts": "^2.6.7"
  }
}
```

PHP 后端 runtime 依赖和 autoload 写在插件 `backend/php/composer.json`：

```json
{
  "name": "true-admin/examples-backend",
  "type": "trueadmin-plugin-runtime",
  "autoload": {
    "psr-4": {
      "Plugin\\TrueAdmin\\Examples\\": ""
    }
  },
  "require": {}
}
```

安装器负责读取这些 runtime 依赖文件，合并到宿主项目安装计划。根 `plugin.json` 只校验插件包级依赖。


## 后端目录同构

插件后端 runtime 与普通业务模块保持同构。模块代码：

```text
backend/app/Module/System/Http/Admin/Controller
backend/app/Module/System/Service
backend/app/Module/System/Repository
```

插件代码：

```text
backend/plugins/true-admin/examples/Http/Admin/Controller
backend/plugins/true-admin/examples/Service
backend/plugins/true-admin/examples/Repository
```

这样模块迁移为插件或插件回迁为项目模块时，业务代码组织方式不变。插件只多了包级 `plugin.json`、各端依赖文件和安装流程，不改变后端业务代码目录习惯。

后端插件注解扫描只扫描以下类目录：

```text
Http
Service
Repository
Model
Request
Vo
Event
Listener
Library
```

`resources`、`Database`、`docs` 等资源目录不进入注解扫描，分别由语言包、迁移、菜单权限同步等机制处理。

## 当前第一版已落地能力

当前 Foundation 已提供本地插件运行时发现能力：

```text
backend/app/Foundation/Plugin/Plugin.php
backend/app/Foundation/Plugin/PluginConfigRepository.php
backend/app/Foundation/Plugin/PluginRepository.php
backend/config/autoload/plugins.php
```

已接入的运行能力：

- 读取 `backend/config/autoload/plugins.php` 的 `installed` 注册表。
- 通过 `installed.<plugin>.enabled` 和 `disabled` 控制插件是否参与本次应用启动。
- 通过 `installed.<plugin>.defaults` 和 `config.<plugin>` 合并插件默认配置和宿主覆盖配置。
- 启用插件的 `backend/plugins/<vendor>/<name>/Http`、`Service`、`Repository`、`Model`、`Request`、`Vo`、`Event`、`Listener`、`Library` 类目录会加入 Hyperf 注解扫描路径，插件路由通过 Controller Attribute 自动注册。
- 插件错误码按代码契约声明，不进入框架级收集；如需文案多语言，继续使用 Hyperf `#[Message]` 和插件 runtime 语言包。
- 插件 `backend/plugins/<vendor>/<name>/resources/lang` 自动加入后端多语言加载路径。
- 插件 `backend/plugins/<vendor>/<name>/Database/Migrations` 自动加入 Hyperf 原生迁移扫描。
- 插件 `backend/plugins/<vendor>/<name>/Database/Seeders` 自动加入种子路径查看。
- `php bin/hyperf.php trueadmin:plugin:list` 查看本地已安装插件。

## 代码化启停

第一版插件主要面向开发者，不做后台动态插件管理，也不设计插件状态表。插件是否启用由安装器写入的宿主项目配置决定，变更后通过正常发布流程上线。

```php
return [
    'installed' => [
        'true-admin.examples' => [
            'path' => BASE_PATH . '/plugins/true-admin/examples',
            'version' => '0.1.0',
            'enabled' => true,
            'defaults' => [],
        ],
    ],
    'disabled' => [],
    'config' => [],
];
```

规则：

- `installed` 是宿主项目已安装后端插件 runtime 注册表。
- `installed.<plugin>.path` 指向安装后的后端 runtime 目录，不指向根目录插件包源。
- `installed.<plugin>.enabled` 控制默认启用状态。
- `disabled` 优先级最高，用于强制禁用插件。
- 修改启停配置后需要重新部署或重启应用，不追求运行时热切换。

## 插件配置覆盖

插件必须把可变行为设计为配置项，而不是要求开发者修改插件源码。这样插件升级时，开发者只需要保留项目配置覆盖即可。

配置分两层：

```text
backend/config/autoload/plugins.php installed.<plugin>.defaults  插件安装后的默认配置。
backend/config/autoload/plugins.php config.<plugin>              项目覆盖配置，归宿主项目维护。
```

项目覆盖示例：

```php
return [
    'installed' => [
        'true-admin.examples' => [
            'path' => BASE_PATH . '/plugins/true-admin/examples',
            'version' => '0.1.0',
            'enabled' => true,
            'defaults' => [
                'features' => [
                    'crudDemo' => true,
                ],
            ],
        ],
    ],
    'config' => [
        'true-admin.examples' => [
            'features' => [
                'crudDemo' => false,
            ],
        ],
    ],
];
```

插件代码读取配置时，应通过 `PluginConfigRepository` 获取合并后的配置：

```php
$config = $pluginConfig->get('true-admin.examples');
$enabled = $pluginConfig->value('true-admin.examples', 'features.crudDemo', true);
```

配置原则：

- 插件包源的 `plugin.json` 不保存 runtime 默认配置。
- 安装器可以从插件包中的模板或约定文件读取默认配置，再写入宿主项目 `installed.<plugin>.defaults`。
- 项目差异写在宿主项目 `backend/config/autoload/plugins.php` 的 `config`。
- 不把项目私有配置写回插件包源目录。
- 配置结构必须向后兼容，插件升级不能随意删除已有配置键。
- 敏感配置不直接写死在插件包中，应支持从宿主项目 env/config 注入。

## 依赖安装

TrueAdmin 插件安装器负责读取根 `plugin.json` 校验包级信息，并读取各端依赖文件生成依赖安装计划。

安装器同时负责复制 runtime 资产：

```text
plugins/<vendor>/<name>/web
  -> web/src/plugins/<vendor>/<name>

plugins/<vendor>/<name>/backend/php
  -> backend/plugins/<vendor>/<name>
```

复制目标是宿主项目唯一会参与运行时扫描的插件代码目录；根目录 `plugins/` 不进入 TypeScript、Vite、Biome、PHPStan 或 Hyperf 注解扫描。后端安装副本采用模块同构结构，注解扫描只扫描类目录，不扫描 `resources` 和 `Database`。

- `plugin.json.dependencies.plugins` 用于校验插件依赖是否存在且版本兼容。
- `web/package.json` 由安装器合并到 `web/package.json` 或生成 pnpm 安装计划，再统一执行 `pnpm --dir web install`。
- `backend/php/composer.json` 由安装器合并到 PHP runtime 的 Composer 安装计划，再统一执行 Composer。
- 第一版可以先只做人工或脚本提示，不要求自动修改宿主 `package.json` / `composer.json`。

## 生命周期

插件生命周期分为包层和应用层。

包层生命周期：

```text
download
verify checksum/signature
validate plugin.json
install runtime dependencies
copy web assets into web/src/plugins
copy backend assets into backend/plugins
write backend installed registry
```

应用层生命周期：

```text
install
migrate
seed
sync menus
sync permissions
sync openapi
enable
disable
upgrade
rollback
uninstall
```

第一版建议只实现开发者/部署期命令，不实现后台 UI 动态维护：

```bash
php bin/hyperf.php trueadmin:plugin:list
php bin/hyperf.php trueadmin:plugin:install vendor/name
php bin/hyperf.php trueadmin:plugin:upgrade vendor/name
php bin/hyperf.php trueadmin:plugin:uninstall vendor/name
```

当前只落地 `trueadmin:plugin:list`。安装、卸载、升级命令应基于本规范继续实现；启用和禁用优先通过 `backend/config/autoload/plugins.php` 修改代码配置完成。

## 插件市场

插件市场不直接执行远程代码。市场只提供索引、版本、下载地址、校验信息和兼容性信息。

市场索引最小信息：

```json
{
  "plugins": {
    "true-admin.examples": {
      "versions": {
        "0.1.0": {
          "dist": {
            "type": "zip",
            "url": "https://plugins.trueadmin.dev/true-admin/examples/0.1.0.zip",
            "shasum": "..."
          },
          "require": {
            "trueadmin": ">=1.0.0"
          }
        }
      }
    }
  }
}
```

安全要求：

- 下载包必须校验 hash，后续支持签名。
- 安装前必须校验 `plugin.json`。
- 升级前必须记录当前版本、迁移状态和资产同步状态。
- 卸载默认不删除业务数据，只移除代码接入并提示是否清理数据。
- 生产环境不建议直接从未知市场安装插件。

## Web 和 Mobile runtime

Web 插件资产源放在插件包的 `web/` 目录。安装器复制 `plugins/<vendor>/<name>/web` 到 `web/src/plugins/<vendor>/<name>`，当前第一阶段由 Vite 只扫描安装后的目录：

```text
web/src/plugins/*/*/manifest.ts
```

安装后的 `web/src/plugins/<vendor>/<name>/manifest.ts` 只负责 Web runtime 注册：路由、前端菜单、locales、图标、错误解释和其他前端扩展能力。它不声明插件名称、版本、依赖、启停或安装生命周期。

Mobile 插件资产预留在 `mobile/` 目录。Mobile 初始化后，再实现插件页面合并、菜单同步和类型生成。

## 禁止事项

- 不允许插件安装器之外的代码直接修改 `backend/app`、`web/src` 或 `mobile` 源码。
- 不允许 Web runtime 目录放置自己的 `plugin.json`。
- 不允许插件绕过根 `plugin.json` 直接写全局配置。
- 不允许根 `plugin.json` 声明 npm、Composer 或其他 runtime 依赖。
- 不允许后端 runtime 依赖 `plugin.json` 才能被扫描。
- 不允许插件卸载时默认硬删业务表。
- 不允许插件市场下载后不校验直接执行。
- 不允许插件依赖未声明的其他插件内部实现。
- 不允许生产环境通过后台页面动态安装未知插件。
