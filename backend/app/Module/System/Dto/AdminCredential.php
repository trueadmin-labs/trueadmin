<?php

declare(strict_types=1);

namespace App\Module\System\Dto;

use App\Module\Auth\Http\Admin\Vo\AuthUser;

final readonly class AdminCredential
{
    public function __construct(
        public AuthUser $user,
        public string $passwordHash,
    ) {
    }
}
