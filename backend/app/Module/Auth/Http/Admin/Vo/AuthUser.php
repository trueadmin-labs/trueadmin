<?php

declare(strict_types=1);

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
        ];
    }
}
