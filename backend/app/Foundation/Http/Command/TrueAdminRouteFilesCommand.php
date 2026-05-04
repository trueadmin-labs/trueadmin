<?php

declare(strict_types=1);

namespace App\Foundation\Http\Command;

use App\Foundation\Http\Routing\ModuleRouteRegistrar;
use Hyperf\Command\Command;

final class TrueAdminRouteFilesCommand extends Command
{
    public function __construct(private readonly ModuleRouteRegistrar $registrar)
    {
        parent::__construct('trueadmin:route-files');
        $this->setDescription('List TrueAdmin module route files');
    }

    public function handle(): int
    {
        $this->line('Module route files:');

        foreach ($this->registrar->routeFiles() as $routeFile) {
            $this->line(' - ' . $routeFile);
        }

        return self::SUCCESS;
    }
}
