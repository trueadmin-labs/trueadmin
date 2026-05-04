<?php

declare(strict_types=1);

namespace App\Foundation\Http\Command;

use App\Foundation\Http\Routing\AttributeRouteRegistrar;
use Hyperf\Command\Command;

final class TrueAdminRoutesCommand extends Command
{
    public function __construct(private readonly AttributeRouteRegistrar $registrar)
    {
        parent::__construct('trueadmin:routes');
        $this->setDescription('List TrueAdmin attribute routes');
    }

    public function handle(): int
    {
        $this->line('Attribute routes:');

        foreach ($this->registrar->routes() as $route) {
            $this->line(sprintf(
                ' - %-10s %-32s %s',
                implode('|', $route['methods']),
                $route['path'],
                $route['action']
            ));
        }

        return self::SUCCESS;
    }
}
