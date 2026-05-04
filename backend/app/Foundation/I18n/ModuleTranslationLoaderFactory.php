<?php

declare(strict_types=1);

namespace App\Foundation\I18n;

use App\Foundation\Plugin\PluginRepository;
use Hyperf\Contract\ConfigInterface;
use Hyperf\Support\Filesystem\Filesystem;
use Psr\Container\ContainerInterface;

use function Hyperf\Support\make;

final class ModuleTranslationLoaderFactory
{
    public function __invoke(ContainerInterface $container): ModuleTranslationLoader
    {
        $config = $container->get(ConfigInterface::class);
        $files = $container->get(Filesystem::class);
        $plugins = $container->has(PluginRepository::class) ? $container->get(PluginRepository::class) : null;
        $paths = $config->get('translation.paths', []);

        return make(ModuleTranslationLoader::class, [
            'files' => $files,
            'paths' => is_array($paths) ? $paths : [],
            'plugins' => $plugins,
        ]);
    }
}
