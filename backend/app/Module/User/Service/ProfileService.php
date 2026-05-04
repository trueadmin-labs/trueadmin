<?php

declare(strict_types=1);

namespace App\Module\User\Service;

use TrueAdmin\Kernel\Context\ActorContext;

final class ProfileService
{
    public function currentProfile(): array
    {
        $operator = ActorContext::requireOperator();

        return [
            'id' => (int) $operator->id,
            'nickname' => $operator->name,
            'avatar' => null,
            'mobile' => '13800000000',
            'scopes' => $operator->claims['scopes'] ?? ['profile:read'],
        ];
    }
}
