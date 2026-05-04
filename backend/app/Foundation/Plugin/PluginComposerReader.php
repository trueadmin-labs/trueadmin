<?php

declare(strict_types=1);

namespace App\Foundation\Plugin;

use TrueAdmin\Kernel\Exception\BusinessException;
use TrueAdmin\Kernel\Constant\ErrorCode;

final class PluginComposerReader
{
    public const MANIFEST = 'composer.json';

    public function read(string $pluginPath): ?Plugin
    {
        $composerPath = $pluginPath . '/' . self::MANIFEST;
        if (! is_file($composerPath)) {
            return null;
        }

        $content = file_get_contents($composerPath);
        if ($content === false) {
            throw new BusinessException(ErrorCode::SERVER_ERROR, sprintf('插件 composer.json 读取失败: %s', $composerPath));
        }

        $composer = json_decode($content, true);
        if (! is_array($composer)) {
            throw new BusinessException(ErrorCode::SERVER_ERROR, sprintf('插件 composer.json 无效: %s', $composerPath));
        }

        if (($composer['type'] ?? null) !== 'trueadmin-plugin') {
            return null;
        }

        $name = $composer['name'] ?? null;
        if (! is_string($name) || $name === '') {
            throw new BusinessException(ErrorCode::SERVER_ERROR, sprintf('插件 composer.json 缺少 name: %s', $composerPath));
        }

        $metadata = $composer['extra']['trueadmin'] ?? [];
        if (! is_array($metadata)) {
            throw new BusinessException(ErrorCode::SERVER_ERROR, sprintf('插件 extra.trueadmin 必须是对象: %s', $composerPath));
        }

        return new Plugin(
            name: $name,
            path: $pluginPath,
            composerPath: $composerPath,
            composer: $composer,
            metadata: $metadata,
            enabled: (bool) ($metadata['enabled'] ?? true),
        );
    }
}
