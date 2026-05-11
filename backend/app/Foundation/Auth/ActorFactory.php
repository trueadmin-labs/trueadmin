<?php

declare(strict_types=1);

namespace App\Foundation\Auth;

use TrueAdmin\Kernel\Context\Actor;

final class ActorFactory
{
    public static function fromAdmin(
        int $id,
        string $username,
        string $nickname = '',
        array $roles = [],
        array $roleIds = [],
        array $permissions = [],
        ?int $primaryDeptId = null,
        array $deptIds = [],
        ?int $operationDeptId = null,
        string $avatar = '',
        array $preferences = [],
    ): Actor {
        $operationDeptId ??= $primaryDeptId;

        return new Actor(
            type: 'admin',
            id: $id,
            name: $username,
            source: 'http',
            claims: [
                'nickname' => $nickname,
                'avatar' => $avatar,
                'roles' => $roles,
                'roleIds' => $roleIds,
                'permissions' => $permissions,
                'primaryDeptId' => $primaryDeptId,
                'deptIds' => $deptIds,
                'operationDeptId' => $operationDeptId,
                'preferences' => $preferences,
            ],
        );
    }

    public static function fromClient(int $id, string $name = 'Client User', array $claims = []): Actor
    {
        return new Actor(
            type: 'client',
            id: $id,
            name: $name,
            source: 'http',
            claims: $claims,
        );
    }
}
