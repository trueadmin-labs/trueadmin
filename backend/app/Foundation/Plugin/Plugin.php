<?php

declare(strict_types=1);

namespace App\Foundation\Plugin;

final class Plugin
{
    /**
     * @param array<string, mixed> $composer
     * @param array<string, mixed> $metadata
     */
    public function __construct(
        public readonly string $name,
        public readonly string $path,
        public readonly string $composerPath,
        public readonly array $composer,
        public readonly array $metadata,
        public readonly bool $enabled,
    ) {
    }

    public function id(): string
    {
        return $this->name;
    }

    public function sourcePath(): ?string
    {
        $sourcePath = $this->assetPath('source', 'src');

        return $sourcePath !== null && is_dir($sourcePath) ? $sourcePath : null;
    }

    public function languagePath(): ?string
    {
        $languagePath = $this->assetPath('lang', 'resources/lang');

        return $languagePath !== null && is_dir($languagePath) ? $languagePath : null;
    }

    /**
     * @return list<string>
     */
    public function migrationPaths(): array
    {
        return $this->existingDirectories([
            $this->assetPath('migrations', 'Database/Migrations'),
        ]);
    }

    /**
     * @return list<string>
     */
    public function seederPaths(): array
    {
        return $this->existingDirectories([
            $this->assetPath('seeders', 'Database/Seeders'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function defaultConfig(): array
    {
        $config = $this->metadata['config']['defaults'] ?? [];

        return is_array($config) ? $config : [];
    }

    private function assetPath(string $key, string $default): ?string
    {
        $assets = $this->metadata['assets'] ?? [];
        $relative = is_array($assets) && is_string($assets[$key] ?? null) ? $assets[$key] : $default;
        if ($relative === '') {
            return null;
        }

        return $this->path . '/' . ltrim($relative, '/');
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
