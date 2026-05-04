<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Module\System\Model\AdminOperationLog;

final class AdminOperationLogRepository
{
    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): AdminOperationLog
    {
        return AdminOperationLog::query()->create($payload);
    }
}
