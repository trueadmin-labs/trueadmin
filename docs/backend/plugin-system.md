# 插件系统规范

TrueAdmin 第一版就预留插件系统基线。插件系统采用 Composer 作为唯一包清单：`composer.json` 负责插件名称、版本、依赖、冲突、autoload 和仓库来源；`extra.trueadmin` 负责 TrueAdmin 的插件元数据、资产路径和生命周期。

不再单独设计 `plugin.json` 或 `trueadmin.plugin.json`。如果后续需要运行时缓存，可以从 `composer.json` 导出缓存文件，但源文件仍以 `composer.json` 为准。

## 设计目标

- 本地插件、市场插件和未来私有插件使用同一标准。
- 插件通过代码、Composer 和配置完成安装、卸载、升级、启用、禁用，不提供后台运行时动态维护。
- 插件可以携带后端路由、迁移、种子数据、菜单、权限、OpenAPI、Web 页面、Mobile 页面和 AI 上下文。
- 插件生命周期可审计、可回滚、可灰度。
- 尽量复用 Composer 生态，不自研包管理器。

## 目录结构

本地插件统一放在后端应用目录下：

```text
backend/plugin/{vendor}/{name}/
  composer.json
  routes.php
  src/
  Database/
    Migrations/
    Seeders/
  resources/
    menus.php
    permissions.php
    openapi.json
    metadata.json
  web/
  mobile/
  docs/
  llms.txt
```

插件内部后端代码仍采用模块内 MineAdmin 分层：

```text
src/
  Http/Admin/Controller
  Http/Client/Controller/V1
  Http/Open/Controller/V1
  Service
  Repository
  Model
  Event
  Listener
  Library
```

## composer.json 标准

插件包必须满足：

- `type` 必须是 `trueadmin-plugin`。
- `name` 使用 Composer 包名格式，例如 `trueadmin/product`。
- PHP 依赖、TrueAdmin 依赖、第三方库依赖必须写在 `require`。
- PHP autoload 必须写在 `autoload`。
- TrueAdmin 插件元数据必须写在 `extra.trueadmin`。

示例：

```json
{
  "name": "trueadmin/product",
  "type": "trueadmin-plugin",
  "description": "TrueAdmin product plugin.",
  "version": "1.0.0",
  "license": "MIT",
  "require": {
    "php": ">=8.1",
    "trueadmin/kernel": "^1.0"
  },
  "autoload": {
    "psr-4": {
      "TrueAdmin\\Product\\": "src/"
    }
  },
  "extra": {
    "trueadmin": {
      "displayName": "商品管理",
      "enabled": true,
      "config": {
        "defaults": {
          "features": {
            "export": true,
            "import": false
          },
          "pageSize": 20
        }
      },
      "assets": {
        "source": "src",
        "routes": "routes.php",
        "migrations": "Database/Migrations",
        "seeders": "Database/Seeders",
        "menus": "resources/menus.php",
        "permissions": "resources/permissions.php",
        "openapi": "resources/openapi.json",
        "metadata": "resources/metadata.json",
        "web": "web",
        "mobile": "mobile",
        "llms": "llms.txt"
      },
      "lifecycle": {
        "install": "TrueAdmin\\Product\\Plugin\\Installer::install",
        "uninstall": "TrueAdmin\\Product\\Plugin\\Installer::uninstall",
        "upgrade": "TrueAdmin\\Product\\Plugin\\Installer::upgrade"
      }
    }
  }
}
```

## 当前第一版已落地能力

当前 Foundation 已提供本地插件发现能力：

```text
backend/app/Foundation/Plugin/Plugin.php
backend/app/Foundation/Plugin/PluginComposerReader.php
backend/app/Foundation/Plugin/PluginConfigRepository.php
backend/app/Foundation/Plugin/PluginRepository.php
backend/config/autoload/plugins.php
```

已接入的运行能力：

- 扫描 `backend/plugin/*/*/composer.json`。
- 只识别 `type=trueadmin-plugin` 的包。
- 读取 `extra.trueadmin` 作为插件元数据。
- 读取 `extra.trueadmin.config.defaults` 作为插件默认配置。
- 通过 `config/autoload/plugins.php` 覆盖插件配置，避免修改插件源码。
- `enabled` / `disabled` 配置控制插件是否参与本次应用启动。
- 插件 `routes.php` 自动加入路由扫描。
- 插件 `Database/Migrations` 自动加入 Hyperf 原生迁移扫描。
- 插件 `Database/Seeders` 自动加入种子路径查看。
- 插件目录加入 Composer classmap 兜底 autoload。
- 只有启用插件的 `src/` 会加入 Hyperf 注解扫描路径。
- `php bin/hyperf.php trueadmin:plugin:list` 查看本地插件。

## 代码化启停

第一版插件主要面向开发者，不做后台动态插件管理，也不设计插件状态表。插件是否启用由代码、Composer lock 和配置共同决定，变更后通过正常发布流程上线。

```php
return [
    'paths' => [
        BASE_PATH . '/plugin/*/*',
    ],
    'enabled' => [],
    'disabled' => [],
];
```

规则：

- `enabled` 为空时，默认启用 `extra.trueadmin.enabled=true` 的插件。
- `enabled` 非空时，作为插件白名单。
- `disabled` 优先级最高，用于强制禁用插件。
- 修改启停配置后需要重新部署或重启应用，不追求运行时热切换。

## 插件配置覆盖

插件必须把可变行为设计为配置项，而不是要求开发者修改插件源码。这样插件升级时，开发者只需要保留项目配置覆盖即可。

配置分两层：

```text
extra.trueadmin.config.defaults  插件出厂默认配置，随插件升级。
config/autoload/plugins.php      项目覆盖配置，归宿主项目维护。
```

项目覆盖示例：

```php
return [
    'config' => [
        'trueadmin/product' => [
            'features' => [
                'export' => false,
            ],
            'pageSize' => 50,
        ],
    ],
];
```

插件代码读取配置时，应通过 `PluginConfigRepository` 获取合并后的配置：

```php
$config = $pluginConfig->get('trueadmin/product');
$pageSize = $pluginConfig->value('trueadmin/product', 'pageSize', 20);
```

配置原则：

- 插件默认配置写在插件 `composer.json` 的 `extra.trueadmin.config.defaults`。
- 项目差异写在宿主项目 `config/autoload/plugins.php` 的 `config`。
- 不把项目私有配置写回插件目录。
- 配置结构必须向后兼容，插件升级不能随意删除已有配置键。
- 敏感配置不直接写死在 `composer.json`，应支持从宿主项目 env/config 注入。

## 生命周期

插件生命周期分为包层和应用层。

包层生命周期：

```text
download
verify checksum/signature
composer require or path repository install
composer dump-autoload
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

当前只落地 `trueadmin:plugin:list`。安装、卸载、升级命令应基于本规范继续实现；启用和禁用优先通过 `config/autoload/plugins.php` 修改代码配置完成。

## 插件市场

插件市场不直接执行远程代码。市场只提供索引、版本、下载地址、校验信息和兼容性信息。优先兼容 Composer repository、Satis、私有 Composer 仓库，也可以提供 TrueAdmin 官方市场索引作为 UI 展示层。

市场索引最小信息：

```json
{
  "packages": {
    "trueadmin/product": {
      "versions": {
        "1.0.0": {
          "dist": {
            "type": "zip",
            "url": "https://plugins.trueadmin.dev/trueadmin/product/1.0.0.zip",
            "shasum": "..."
          },
          "require": {
            "trueadmin": ">=1.0.0",
            "php": ">=8.1"
          }
        }
      }
    }
  }
}
```

安全要求：

- 下载包必须校验 hash，后续支持签名。
- 安装前必须校验 `composer.json`、`type` 和 `extra.trueadmin`。
- 升级前必须记录当前版本、迁移状态和资产同步状态。
- 卸载默认不删除业务数据，只移除代码接入并提示是否清理数据。
- 生产环境不建议直接从未知市场安装插件。

## 前端和移动端预留

Web 和 Mobile 还未初始化，但插件清单必须提前预留资产入口。

Web 插件资产建议：

```text
web/
  package.json
  src/routes.ts
  src/menu.ts
  src/pages/
  src/api/
```

Mobile 插件资产建议：

```text
mobile/
  pages.json
  src/pages/
  src/api/
```

第一版后端只记录资产路径，不执行前端构建。Web/Mobile 初始化后，再实现插件资产发布、路由合并、菜单同步和类型生成。

## 禁止事项

- 不允许插件直接修改 `backend/app` 源码。
- 不允许插件绕过 `composer.json` 和 `extra.trueadmin` 直接写全局配置。
- 不允许插件卸载时默认硬删业务表。
- 不允许插件市场下载后不校验直接执行。
- 不允许插件依赖未声明的其他插件内部实现。
- 不允许生产环境通过后台页面动态安装未知插件。
