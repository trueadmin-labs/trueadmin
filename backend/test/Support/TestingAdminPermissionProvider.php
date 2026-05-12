<?php

declare(strict_types=1);

namespace HyperfTest\Support;

use TrueAdmin\Kernel\Http\PermissionProviderInterface;
use TrueAdmin\Kernel\Context\Actor;

final class TestingAdminPermissionProvider implements PermissionProviderInterface
{
    public function can(Actor $actor, string $permission): bool
    {
        $permissions = $actor->claims['permissions'] ?? [];

        return is_array($permissions)
            && (in_array('*', $permissions, true) || in_array($permission, $permissions, true));
    }
}
