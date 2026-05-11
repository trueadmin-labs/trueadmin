<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminOperationLog;

final class AdminOperationLogRepository extends AbstractRepository
{
    protected ?string $modelClass = AdminOperationLog::class;

    protected array $keywordFields = ['module', 'action', 'remark', 'principal_id', 'operator_id'];

    protected array $filterable = [
        'id' => ['=', 'in'],
        'module' => ['=', 'like', 'in'],
        'action' => ['=', 'like', 'in'],
        'remark' => ['=', 'like'],
        'principal_type' => ['=', 'in'],
        'principal_id' => ['=', 'like'],
        'operator_type' => ['=', 'in'],
        'operator_id' => ['=', 'like'],
        'operation_dept_id' => ['=', 'in'],
        'created_at' => ['between', '>=', '<='],
    ];

    protected array $sortable = ['id', 'created_at'];

    protected array $defaultSort = ['id' => 'desc'];

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): AdminOperationLog
    {
        return AdminOperationLog::query()->create($payload);
    }

    public function paginate(AdminQuery $adminQuery): PageResult
    {
        return $this->pageQuery(
            AdminOperationLog::query(),
            $adminQuery,
            fn (AdminOperationLog $log): array => $this->toArray($log),
        );
    }

    public function toArray(AdminOperationLog $log): array
    {
        return [
            'id' => (int) $log->getAttribute('id'),
            'module' => (string) $log->getAttribute('module'),
            'action' => (string) $log->getAttribute('action'),
            'remark' => (string) $log->getAttribute('remark'),
            'principalType' => (string) $log->getAttribute('principal_type'),
            'principalId' => (string) $log->getAttribute('principal_id'),
            'operatorType' => (string) $log->getAttribute('operator_type'),
            'operatorId' => (string) $log->getAttribute('operator_id'),
            'operationDeptId' => $log->getAttribute('operation_dept_id') === null ? null : (int) $log->getAttribute('operation_dept_id'),
            'context' => $log->getAttribute('context') ?? [],
            'createdAt' => (string) $log->getAttribute('created_at'),
            'updatedAt' => (string) $log->getAttribute('updated_at'),
        ];
    }
}
