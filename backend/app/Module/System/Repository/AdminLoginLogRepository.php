<?php

declare(strict_types=1);

namespace App\Module\System\Repository;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminLoginLog;

final class AdminLoginLogRepository extends AbstractRepository
{
    protected ?string $modelClass = AdminLoginLog::class;

    protected array $keywordFields = ['username', 'ip', 'user_agent', 'reason'];

    protected array $filterable = [
        'id' => ['=', 'in'],
        'admin_user_id' => ['=', 'in'],
        'username' => ['=', 'like'],
        'ip' => ['=', 'like'],
        'status' => ['=', 'in'],
        'reason' => ['=', 'like'],
        'created_at' => ['between', '>=', '<='],
    ];

    protected array $sortable = ['id', 'created_at'];

    protected array $defaultSort = ['id' => 'desc'];

    /**
     * @param array<string, mixed> $payload
     */
    public function create(array $payload): AdminLoginLog
    {
        return AdminLoginLog::query()->create($payload);
    }

    public function paginate(AdminQuery $adminQuery): PageResult
    {
        return $this->pageQuery(
            AdminLoginLog::query(),
            $adminQuery,
            fn (AdminLoginLog $log): array => $this->toArray($log),
        );
    }

    public function toArray(AdminLoginLog $log): array
    {
        return [
            'id' => (int) $log->getAttribute('id'),
            'adminUserId' => $log->getAttribute('admin_user_id') === null ? null : (int) $log->getAttribute('admin_user_id'),
            'username' => (string) $log->getAttribute('username'),
            'ip' => (string) $log->getAttribute('ip'),
            'userAgent' => (string) $log->getAttribute('user_agent'),
            'status' => (string) $log->getAttribute('status'),
            'reason' => (string) $log->getAttribute('reason'),
            'createdAt' => (string) $log->getAttribute('created_at'),
            'updatedAt' => (string) $log->getAttribute('updated_at'),
        ];
    }
}
