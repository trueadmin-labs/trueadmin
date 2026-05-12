<?php

declare(strict_types=1);

namespace App\Module\System\Service;

use App\Module\System\Repository\AdminOperationLogRepository;
use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Pagination\PageResult;
use TrueAdmin\Kernel\Service\AbstractService;

final class AdminOperationLogService extends AbstractService
{
    public function __construct(private readonly AdminOperationLogRepository $logs)
    {
    }

    public function paginate(CrudQuery $query): PageResult
    {
        return $this->logs->paginate($query);
    }

    public function detail(int $id): array
    {
        $log = $this->logs->findById($id);
        if ($log === null) {
            throw $this->notFound('admin_operation_log', $id);
        }

        return $this->logs->toArray($log);
    }
}
