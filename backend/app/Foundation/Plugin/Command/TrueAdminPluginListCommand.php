<?php

declare(strict_types=1);

namespace App\Foundation\Plugin\Command;

use App\Foundation\Plugin\PluginRepository;
use Hyperf\Command\Command;

final class TrueAdminPluginListCommand extends Command
{
    public function __construct(private readonly PluginRepository $plugins)
    {
        parent::__construct('trueadmin:plugin:list');
        $this->setDescription('List TrueAdmin local plugins');
    }

    public function handle(): int
    {
        $this->line('Plugins:');

        foreach ($this->plugins->all() as $plugin) {
            $status = $plugin->enabled ? 'enabled' : 'disabled';
            $version = is_string($plugin->manifest['version'] ?? null) ? $plugin->manifest['version'] : 'unknown';
            $this->line(sprintf(' - %s:%s [%s] %s', $plugin->name, $version, $status, $plugin->path));
        }

        return self::SUCCESS;
    }
}
