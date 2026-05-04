<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use App\Module\System\Contract\AdminPermissionProviderInterface;
use App\Module\System\Repository\AdminMenuRepository;
use TrueAdmin\Kernel\Context\Actor;

final class AdminPermissionService implements AdminPermissionProviderInterface
{
    public function __construct(private readonly AdminMenuRepository $menus)
    {
    }

    public function can(Actor $actor, string $permission): bool
    {
        if ($permission === '' || $actor->type !== 'admin') {
            return false;
        }

        $permissions = $actor->claims['permissions'] ?? [];
        if (! is_array($permissions)) {
            return false;
        }

        return in_array('*', $permissions, true) || in_array($permission, $permissions, true);
    }

    public function menuTree(): array
    {
        return $this->menus->allEnabled();
    }

    public function permissionCodes(): array
    {
        return $this->menus->permissionCodes();
    }
}
