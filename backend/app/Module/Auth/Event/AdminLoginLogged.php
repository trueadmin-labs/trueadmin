<?php

declare(strict_types=1);

namespace App\Module\Auth\Event;

final class AdminLoginLogged
{
    public function __construct(
        public readonly string $username,
        public readonly string $status,
        public readonly ?int $adminUserId = null,
        public readonly string $ip = '',
        public readonly string $userAgent = '',
        public readonly string $reason = '',
    ) {
    }
}
