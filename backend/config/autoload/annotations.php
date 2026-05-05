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
            $composerPath = $pluginPath . '/composer.json';
            if (! is_file($composerPath)) {
                continue;
            }

            $composer = json_decode(file_get_contents($composerPath) ?: '', true);
            if (! is_array($composer) || ($composer['type'] ?? null) !== 'trueadmin-plugin') {
                continue;
            }

            $name = $composer['name'] ?? null;
            if (! is_string($name) || $name === '') {
                throw new RuntimeException(sprintf('插件 composer.json 缺少 name: %s', $composerPath));
            }

            $metadata = $composer['extra']['trueadmin'] ?? [];
            if (! is_array($metadata)) {
                throw new RuntimeException(sprintf('插件 extra.trueadmin 必须是对象: %s', $composerPath));
            }

            $isEnabled = (bool) ($metadata['enabled'] ?? true);
            if ($enabled !== []) {
                $isEnabled = in_array($name, $enabled, true);
            }
            if (in_array($name, $disabled, true)) {
                $isEnabled = false;
            }
            if (! $isEnabled) {
                continue;
            }

            $assets = $metadata['assets'] ?? [];
            $source = is_array($assets) && is_string($assets['source'] ?? null) ? $assets['source'] : 'src';
            $sourcePath = $pluginPath . '/' . ltrim($source, '/');
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
