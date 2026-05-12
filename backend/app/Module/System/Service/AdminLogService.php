<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use TrueAdmin\Kernel\Pagination\PageResult;
use TrueAdmin\Kernel\Crud\CrudQuery;
use App\Module\System\Repository\AdminLoginLogRepository;
use App\Module\System\Repository\AdminOperationLogRepository;

final class AdminLogService
{
    public function __construct(
        private readonly AdminLoginLogRepository $loginLogs,
        private readonly AdminOperationLogRepository $operationLogs,
    ) {
    }

    public function loginLogs(CrudQuery $query): PageResult
    {
        return $this->loginLogs->paginate($query);
    }

    public function operationLogs(CrudQuery $query): PageResult
    {
        return $this->operationLogs->paginate($query);
    }
}
