<?php

declare(strict_types=1);

namespace App\Foundation\Plugin;

use Hyperf\Contract\ConfigInterface;

final class PluginRepository
{
    public function __construct(
        private readonly ConfigInterface $config,
        private readonly PluginManifestReader $reader,
    ) {
    }

    /**
     * @return list<Plugin>
     */
    public function all(): array
    {
        $plugins = [];

        foreach ($this->pluginPaths() as $pluginPath) {
            $plugin = $this->reader->read($pluginPath);
            if ($plugin === null) {
                continue;
            }

            $plugins[] = $this->withRuntimeEnabled($plugin);
        }

        usort($plugins, static fn (Plugin $a, Plugin $b): int => $a->name <=> $b->name);

        return $plugins;
    }

    /**
     * @return list<Plugin>
     */
    public function enabled(): array
    {
        return array_values(array_filter($this->all(), static fn (Plugin $plugin): bool => $plugin->enabled));
    }

    /**
     * @return list<string>
     */
    public function migrationPaths(): array
    {
        $paths = [];

        foreach ($this->enabled() as $plugin) {
            $paths = [...$paths, ...$plugin->migrationPaths()];
        }

        sort($paths);

        return array_values(array_unique($paths));
    }

    /**
     * @return list<string>
     */
    public function seederPaths(): array
    {
        $paths = [];

        foreach ($this->enabled() as $plugin) {
            $paths = [...$paths, ...$plugin->seederPaths()];
        }

        sort($paths);

        return array_values(array_unique($paths));
    }

    /**
     * @return list<string>
     */
    private function pluginPaths(): array
    {
        $paths = [];
        $patterns = $this->config->get('plugins.paths', []);

        foreach (is_array($patterns) ? $patterns : [] as $pattern) {
            if (! is_string($pattern)) {
                continue;
            }

            $paths = [...$paths, ...glob($pattern, GLOB_ONLYDIR) ?: []];
        }

        sort($paths);

        return array_values(array_unique($paths));
    }

    private function withRuntimeEnabled(Plugin $plugin): Plugin
    {
        $enabled = $this->stringList('plugins.enabled');
        $disabled = $this->stringList('plugins.disabled');

        $isEnabled = $plugin->enabled;
        if ($enabled !== []) {
            $isEnabled = in_array($plugin->name, $enabled, true);
        }
        if (in_array($plugin->name, $disabled, true)) {
            $isEnabled = false;
        }

        return new Plugin(
            name: $plugin->name,
            path: $plugin->path,
            manifestPath: $plugin->manifestPath,
            manifest: $plugin->manifest,
            enabled: $isEnabled,
        );
    }

    /**
     * @return list<string>
     */
    private function stringList(string $key): array
    {
        $value = $this->config->get($key, []);
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_filter($value, static fn ($item): bool => is_string($item) && $item !== ''));
    }
}
