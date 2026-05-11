<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Module\System\Repository\AdminLoginLogRepository;
use App\Module\System\Repository\AdminOperationLogRepository;

final class AdminLogService
{
    public function __construct(
        private readonly AdminLoginLogRepository $loginLogs,
        private readonly AdminOperationLogRepository $operationLogs,
    ) {
    }

    public function loginLogs(AdminQuery $query): PageResult
    {
        return $this->loginLogs->paginate($query);
    }

    public function operationLogs(AdminQuery $query): PageResult
    {
        return $this->operationLogs->paginate($query);
    }
}
