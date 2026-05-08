<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */
$enabledPluginSourcePaths = static function (): array {
    $configFile = BASE_PATH . '/config/autoload/plugins.php';
    $config = is_file($configFile) ? require $configFile : [];
    $patterns = is_array($config['paths'] ?? null) ? $config['paths'] : [];
    $enabled = array_values(array_filter($config['enabled'] ?? [], 'is_string'));
    $disabled = array_values(array_filter($config['disabled'] ?? [], 'is_string'));
    $paths = [];

    foreach ($patterns as $pattern) {
        if (! is_string($pattern)) {
            continue;
        }

        foreach (glob($pattern, GLOB_ONLYDIR) ?: [] as $pluginPath) {
            $manifestPath = $pluginPath . '/plugin.json';
            if (! is_file($manifestPath)) {
                continue;
            }

            $manifest = json_decode(file_get_contents($manifestPath) ?: '', true);
            $name = is_array($manifest) ? ($manifest['id'] ?? null) : null;
            if (! is_string($name) || $name === '') {
                throw new RuntimeException(sprintf('插件 plugin.json 缺少 id: %s', $manifestPath));
            }
            if (! is_array($manifest)) {
                throw new RuntimeException(sprintf('插件 plugin.json 必须是对象: %s', $manifestPath));
            }

            $isEnabled = (bool) ($manifest['enabled'] ?? true);
            if ($enabled !== []) {
                $isEnabled = in_array($name, $enabled, true);
            }
            if (in_array($name, $disabled, true)) {
                $isEnabled = false;
            }
            if (! $isEnabled) {
                continue;
            }

            $sourcePath = $pluginPath . '/src';
            if (is_dir($sourcePath)) {
                $paths[] = $sourcePath;
            }
        }
    }

    sort($paths);

    return array_values(array_unique($paths));
};

$appEnv = getenv('APP_ENV') ?: ($_ENV['APP_ENV'] ?? $_SERVER['APP_ENV'] ?? '');

return [
    'scan' => [
        'paths' => array_values(array_filter([
            BASE_PATH . '/app',
            $appEnv === 'testing' ? BASE_PATH . '/test/Support/Controller' : null,
            BASE_PATH . '/../packages/kernel/src',
            ...$enabledPluginSourcePaths(),
        ])),
        'ignore_annotations' => [
            'mixin',
        ],
    ],
];
