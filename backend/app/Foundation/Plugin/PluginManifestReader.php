<?php

declare(strict_types=1);

namespace App\Foundation\Plugin;

use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Exception\BusinessException;

final class PluginManifestReader
{
    public const MANIFEST = 'plugin.json';

    public function read(string $pluginPath): ?Plugin
    {
        $manifestPath = $pluginPath . '/' . self::MANIFEST;
        if (! is_file($manifestPath)) {
            return null;
        }

        $content = file_get_contents($manifestPath);
        if ($content === false) {
            throw new BusinessException(ErrorCode::SERVER_ERROR, 500, ['manifestPath' => $manifestPath, 'reason' => 'read_failed']);
        }

        $manifest = json_decode($content, true);
        if (! is_array($manifest)) {
            throw new BusinessException(ErrorCode::SERVER_ERROR, 500, ['manifestPath' => $manifestPath, 'reason' => 'invalid_json']);
        }

        $name = $manifest['id'] ?? null;
        if (! is_string($name) || $name === '') {
            throw new BusinessException(ErrorCode::SERVER_ERROR, 500, ['manifestPath' => $manifestPath, 'reason' => 'missing_id']);
        }

        return new Plugin(
            name: $name,
            path: $pluginPath,
            manifestPath: $manifestPath,
            manifest: $manifest,
            enabled: (bool) ($manifest['enabled'] ?? true),
        );
    }
}
