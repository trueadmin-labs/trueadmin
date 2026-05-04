<?php

declare(strict_types=1);

namespace App\Foundation\Http\Routing;

use App\Foundation\Plugin\PluginRepository;

final class ModuleRouteRegistrar
{
    public function __construct(private readonly ?PluginRepository $plugins = null)
    {
    }

    /**
     * @return list<string>
     */
    public function routeFiles(): array
    {
        $files = [
            ...glob(BASE_PATH . '/app/Module/*/routes.php') ?: [],
            ...($this->plugins?->routeFiles() ?? []),
        ];

        sort($files);

        return array_values(array_unique($files));
    }

    public function register(): void
    {
        foreach ($this->routeFiles() as $routeFile) {
            require $routeFile;
        }
    }
}
