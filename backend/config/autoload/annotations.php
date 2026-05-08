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
    $installed = is_array($config['installed'] ?? null) ? $config['installed'] : [];
    $disabled = array_values(array_filter($config['disabled'] ?? [], 'is_string'));
    $paths = [];

    foreach ($installed as $name => $definition) {
        if (! is_string($name) || ! is_array($definition)) {
            continue;
        }

        $pluginPath = $definition['path'] ?? null;
        if (! is_string($pluginPath) || $pluginPath === '') {
            continue;
        }

        $isEnabled = (bool) ($definition['enabled'] ?? true);
        if (in_array($name, $disabled, true)) {
            $isEnabled = false;
        }
        if (! $isEnabled) {
            continue;
        }

        foreach (['Http', 'Service', 'Repository', 'Model', 'Request', 'Vo', 'Event', 'Listener', 'Library'] as $directory) {
            $sourcePath = rtrim($pluginPath, '/') . '/' . $directory;
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
