<?php

declare(strict_types=1);

namespace App\Foundation\Auth;

use App\Module\Auth\Http\Admin\Vo\AuthUser;
use TrueAdmin\Kernel\Context\Actor;

final class ActorFactory
{
    public static function fromAdmin(AuthUser $user, ?int $operationDeptId = null): Actor
    {
        $operationDeptId ??= $user->primaryDeptId;

        return new Actor(
            type: 'admin',
            id: $user->id,
            name: $user->username,
            source: 'http',
            claims: [
                'nickname' => $user->nickname,
                'roles' => $user->roles,
                'permissions' => $user->permissions,
                'primaryDeptId' => $user->primaryDeptId,
                'deptIds' => $user->deptIds,
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
