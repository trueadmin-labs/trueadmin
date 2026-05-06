<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Module\System\Model\AdminLoginLog;

final class AdminLoginLogRepository
{
    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): AdminLoginLog
    {
        return AdminLoginLog::query()->create($payload);
    }
}
