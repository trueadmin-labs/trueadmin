<?php

declare(strict_types=1);

namespace App\Module\Auth\DTO;

final readonly class AuthUser
{
    public function __construct(
        public int $id,
        public string $username,
        public string $nickname,
        public array $roles,
        public array $permissions,
    ) {
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'nickname' => $this->nickname,
            'roles' => $this->roles,
            'permissions' => $this->permissions,
        ];
    }
}

