<?php

declare(strict_types=1);

namespace App\Module\System\Repository\Notification;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminNotificationBatch;
use Hyperf\Database\Model\Builder;
use Hyperf\DbConnection\Db;

final class AdminNotificationBatchRepository extends AbstractRepository
{
    protected ?string $modelClass = AdminNotificationBatch::class;

    protected array $keywordFields = ['fallback_title', 'fallback_content', 'operator_name', 'error_message'];

    protected array $filterable = [
        'id' => ['=', 'in'],
        'level' => ['=', 'in'],
        'type' => ['=', 'in'],
        'source' => ['=', 'in'],
        'status' => ['=', 'in'],
        'created_at' => ['between', '>=', '<='],
    ];

    protected array $sortable = ['id', 'created_at', 'updated_at'];

    protected array $defaultSort = ['id' => 'desc'];

    public function paginate(AdminQuery $adminQuery): PageResult
    {
        $query = AdminNotificationBatch::query();
        $this->applyManagementDataPolicy($query);

        return $this->pageQuery(
            $query,
            $adminQuery,
            fn (AdminNotificationBatch $batch): array => $this->toArray($batch),
        );
    }

    public function findById(int $id): ?AdminNotificationBatch
    {
        /** @var null|AdminNotificationBatch $batch */
        $batch = $this->findModelById($id);

        return $batch;
    }

    public function findByIdWithDataPolicy(int $id): ?AdminNotificationBatch
    {
        $batch = $this->findById($id);
        if ($batch === null) {
            return null;
        }

        $query = AdminNotificationBatch::query()->where('id', $id);
        $this->assertManagementDataPolicy($query);

        return $batch;
    }

    public function create(array $data): AdminNotificationBatch
    {
        /** @var AdminNotificationBatch $batch */
        $batch = $this->createModel($data);

        return $batch;
    }

    public function update(AdminNotificationBatch $batch, array $data): AdminNotificationBatch
    {
        /** @var AdminNotificationBatch $batch */
        $batch = $this->updateModel($batch, $data);

        return $batch;
    }

    public function delete(AdminNotificationBatch $batch): void
    {
        Db::table('admin_notification_deliveries')->where('batch_id', (int) $batch->getAttribute('id'))->delete();
        $this->deleteModel($batch);
    }

    public function statusStats(): array
    {
        $query = AdminNotificationBatch::query();
        $this->applyManagementDataPolicy($query);

        return $query
            ->select('status', Db::raw('count(*) as total'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(static fn ($row): array => [(string) $row->status => (int) $row->total])
            ->all();
    }

    public function toArray(AdminNotificationBatch $batch): array
    {
        $batchId = (int) $batch->getAttribute('id');
        $stats = $this->deliveryStats($batchId);

        return [
            'id' => $batchId,
            'title' => (string) ($batch->getAttribute('fallback_title') ?? ''),
            'content' => $batch->getAttribute('fallback_content'),
            'kind' => 'notification',
            'level' => (string) $batch->getAttribute('level'),
            'type' => (string) $batch->getAttribute('type'),
            'source' => (string) $batch->getAttribute('source'),
            'status' => (string) $batch->getAttribute('status'),
            'targetType' => $this->targetType($batch),
            'targetSummary' => $this->targetSummary($batch),
            'targetRoleIds' => $this->targetValues($batch, 'role'),
            'targetUserIds' => $this->targetValues($batch, 'admin'),
            'targetUrl' => $batch->getAttribute('target_url'),
            'payload' => $batch->getAttribute('payload') ?? [],
            'attachments' => $batch->getAttribute('attachments') ?? [],
            'pinned' => false,
            'scheduledAt' => null,
            'publishedAt' => $this->formatDate($batch->getAttribute('created_at')),
            'expireAt' => $this->formatDate($batch->getAttribute('expires_at')),
            'offlineAt' => null,
            'deliveryTotal' => $stats['total'],
            'sentTotal' => $stats['sent'],
            'failedTotal' => $stats['failed'],
            'readTotal' => $stats['read'],
            'operatorId' => $batch->getAttribute('operator_id') === null ? null : (int) $batch->getAttribute('operator_id'),
            'operatorName' => (string) $batch->getAttribute('operator_name'),
            'createdAt' => $this->formatDate($batch->getAttribute('created_at')),
            'updatedAt' => $this->formatDate($batch->getAttribute('updated_at')),
        ];
    }

    protected function handleSearch(mixed $query, AdminQuery $adminQuery): void
    {
        $this->applyKeyword($query, $adminQuery);
        $this->applyFilters($query, $adminQuery);
        $this->applyParams($query, $adminQuery);
        $this->applySort($query, $adminQuery);
    }

    private function applyManagementDataPolicy(mixed $query): void
    {
        $this->applyDataPolicy($query, 'admin_notification_batch', [
            'deptColumn' => 'operator_dept_id',
            'createdByColumn' => 'operator_id',
        ]);
    }

    private function assertManagementDataPolicy(mixed $query): void
    {
        $this->assertDataPolicyAllows($query, 'admin_notification_batch', [
            'deptColumn' => 'operator_dept_id',
            'createdByColumn' => 'operator_id',
        ]);
    }

    private function applyParams(Builder $query, AdminQuery $adminQuery): void
    {
        foreach (['level', 'type', 'source', 'status'] as $field) {
            if ($adminQuery->hasParam($field)) {
                $query->where($field, $adminQuery->param($field));
            }
        }
        if ($adminQuery->hasParam('startAt')) {
            $query->where('created_at', '>=', $adminQuery->param('startAt'));
        }
        if ($adminQuery->hasParam('endAt')) {
            $query->where('created_at', '<=', $adminQuery->param('endAt'));
        }
    }

    private function deliveryStats(int $batchId): array
    {
        $rows = Db::table('admin_notification_deliveries')
            ->select('status', Db::raw('count(*) as total'))
            ->where('batch_id', $batchId)
            ->groupBy('status')
            ->get();

        $stats = ['total' => 0, 'sent' => 0, 'failed' => 0, 'skipped' => 0, 'read' => 0];
        foreach ($rows as $row) {
            $total = (int) $row->total;
            $status = (string) $row->status;
            $stats['total'] += $total;
            if (array_key_exists($status, $stats)) {
                $stats[$status] = $total;
            }
        }

        $stats['read'] = (int) Db::table('admin_notification_deliveries')
            ->where('batch_id', $batchId)
            ->whereNotNull('read_at')
            ->count();

        return $stats;
    }

    private function targetType(AdminNotificationBatch $batch): string
    {
        $targets = $batch->getAttribute('targets') ?? [];
        if (! is_array($targets) || $targets === []) {
            return 'user';
        }

        $types = array_values(array_unique(array_map(static fn (mixed $target): string => is_array($target) ? (string) ($target['type'] ?? '') : '', $targets)));

        return count($types) === 1 && $types[0] === 'role' ? 'role' : 'user';
    }

    private function targetValues(AdminNotificationBatch $batch, string $type): array
    {
        $targets = $batch->getAttribute('targets') ?? [];
        if (! is_array($targets)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map(static function (mixed $target) use ($type): int {
            if (! is_array($target) || (string) ($target['type'] ?? '') !== $type) {
                return 0;
            }

            return (int) ($target['value'] ?? 0);
        }, $targets), static fn (int $value): bool => $value > 0)));
    }

    private function targetSummary(AdminNotificationBatch $batch): string
    {
        $targets = $batch->getAttribute('targets') ?? [];
        if (! is_array($targets) || $targets === []) {
            return '指定用户';
        }

        $parts = [];
        $adminIds = $this->targetValues($batch, 'admin');
        $roleIds = $this->targetValues($batch, 'role');
        if ($adminIds !== []) {
            $parts[] = '管理员 ' . count($adminIds) . ' 人';
        }
        if ($roleIds !== []) {
            $parts[] = '角色 ' . count($roleIds) . ' 个';
        }

        return $parts === [] ? '指定用户' : implode('、', $parts);
    }

    private function formatDate(mixed $value): ?string
    {
        return $value === null ? null : (string) $value;
    }
}
