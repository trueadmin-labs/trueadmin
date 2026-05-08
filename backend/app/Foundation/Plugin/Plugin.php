<?php

declare(strict_types=1);

namespace App\Foundation\Plugin;

final class Plugin
{
    /**
     * @param array<string, mixed> $manifest
     */
    public function __construct(
        public readonly string $name,
        public readonly string $path,
        public readonly string $manifestPath,
        public readonly array $manifest,
        public readonly bool $enabled,
    ) {
    }

    public function id(): string
    {
        return $this->name;
    }

    public function sourcePath(): ?string
    {
        $sourcePath = $this->path . '/src';

        return is_dir($sourcePath) ? $sourcePath : null;
    }

    public function languagePath(): ?string
    {
        $languagePath = $this->path . '/resources/lang';

        return is_dir($languagePath) ? $languagePath : null;
    }

    /**
     * @return list<string>
     */
    public function migrationPaths(): array
    {
        return $this->existingDirectories([
            $this->path . '/Database/Migrations',
        ]);
    }

    /**
     * @return list<string>
     */
    public function seederPaths(): array
    {
        return $this->existingDirectories([
            $this->path . '/Database/Seeders',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function defaultConfig(): array
    {
        $config = $this->manifest['config']['defaults'] ?? [];

        return is_array($config) ? $config : [];
    }

    /**
     * @param list<string|null> $paths
     * @return list<string>
     */
    private function existingDirectories(array $paths): array
    {
        return array_values(array_filter($paths, static fn (?string $path): bool => $path !== null && is_dir($path)));
    }
}
