<?php

declare(strict_types=1);

namespace App\Module\System\Contract;

use TrueAdmin\Kernel\Context\Actor;

interface AdminPermissionProviderInterface
{
    public function can(Actor $actor, string $permission): bool;

    public function menuTree(): array;

    public function permissionCodes(): array;
}
