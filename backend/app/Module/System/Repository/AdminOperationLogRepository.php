<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Pagination\PageResult;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminOperationLog;

/**
 * @extends AbstractRepository<AdminOperationLog>
 */
final class AdminOperationLogRepository extends AbstractRepository
{
    protected ?string $modelClass = AdminOperationLog::class;

    protected array $keywordFields = ['module', 'action', 'remark', 'principal_id', 'operator_id'];

    protected array $filterable = [
        'id' => ['eq', 'in'],
        'module' => ['eq', 'like', 'in'],
        'action' => ['eq', 'like', 'in'],
        'remark' => ['eq', 'like'],
        'principalType' => ['eq', 'in'],
        'principalId' => ['eq', 'like'],
        'operatorType' => ['eq', 'in'],
        'operatorId' => ['eq', 'like'],
        'operationDeptId' => ['eq', 'in'],
        'createdAt' => ['between', 'gte', 'lte'],
    ];

    protected array $sortable = ['id', 'createdAt'];

    protected array $defaultSort = ['id' => 'desc'];

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): AdminOperationLog
    {
        /** @var AdminOperationLog $log */
        $log = $this->createModel($payload);

        return $log;
    }

    public function paginate(CrudQuery $adminQuery): PageResult
    {
        return $this->pageQuery(
            AdminOperationLog::query(),
            $adminQuery,
            fn (AdminOperationLog $log): array => $this->toArray($log),
        );
    }

    public function findById(int $id): ?AdminOperationLog
    {
        /** @var null|AdminOperationLog $log */
        $log = $this->findModelById($id);

        return $log;
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
