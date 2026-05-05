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
        array $permissions = [],
        ?int $primaryDeptId = null,
        array $deptIds = [],
        ?int $operationDeptId = null,
    ): Actor {
        $operationDeptId ??= $primaryDeptId;

        return new Actor(
            type: 'admin',
            id: $id,
            name: $username,
            source: 'http',
            claims: [
                'nickname' => $nickname,
                'roles' => $roles,
                'permissions' => $permissions,
                'primaryDeptId' => $primaryDeptId,
                'deptIds' => $deptIds,
                'operationDeptId' => $operationDeptId,
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
