<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace App\Module\Auth\Http\Admin\Vo;

final readonly class AuthUser
{
    public function __construct(
        public int $id,
        public string $username,
        public string $nickname,
        public string $avatar,
        public array $roles,
        public array $roleIds,
        public array $permissions,
        public ?int $primaryDeptId,
        public array $deptIds,
        public array $preferences,
        public array $positions = [],
        public array $directRoles = [],
        public array $directRoleIds = [],
        public array $positionRoleBindings = [],
    ) {
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'nickname' => $this->nickname,
            'avatar' => $this->avatar,
            'roles' => $this->roles,
            'roleIds' => $this->roleIds,
            'permissions' => $this->permissions,
            'primaryDeptId' => $this->primaryDeptId,
            'deptIds' => $this->deptIds,
            'preferences' => $this->preferences,
            'positions' => $this->positions,
            'directRoles' => $this->directRoles,
            'directRoleIds' => $this->directRoleIds,
            'positionRoleBindings' => $this->positionRoleBindings,
        ];
    }
}
