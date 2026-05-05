<?php

declare(strict_types=1);

namespace HyperfTest\Support;

use App\Foundation\Contract\AdminPermissionProviderInterface;
use TrueAdmin\Kernel\Context\Actor;

final class TestingAdminPermissionProvider implements AdminPermissionProviderInterface
{
    public function can(Actor $actor, string $permission): bool
    {
        $permissions = $actor->claims['permissions'] ?? [];

        return is_array($permissions)
            && (in_array('*', $permissions, true) || in_array($permission, $permissions, true));
    }

    public function menuTree(): array
    {
        return [
            ['id' => 1, 'name' => '系统管理', 'path' => '/system', 'permission' => '', 'type' => 'directory'],
        ];
    }

    public function permissionCodes(): array
    {
        return ['system:menu:list', 'system:permission:list'];
    }
}
