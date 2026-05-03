<?php

declare(strict_types=1);

namespace App\Module\Client\Service;

final class ProfileService
{
    public function currentProfile(): array
    {
        return [
            'id' => 10001,
            'nickname' => 'Client User',
            'avatar' => null,
            'mobile' => '13800000000',
            'scopes' => ['profile:read'],
        ];
    }
}

