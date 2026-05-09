<?php

declare(strict_types=1);

namespace App\Module\System\Repository\Notification;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminNotificationBatch;
use App\Module\System\Model\AdminUser;
use Hyperf\Database\Model\Builder;
use Hyperf\DbConnection\Db;

final class AdminNotificationBatchRepository extends AbstractRepository
{
    protected ?string $modelClass = AdminNotificationBatch::class;

    protected array $keywordFields = ['title', 'content', 'operator_name'];

    protected array $filterable = [
        'id' => ['=', 'in'],
        'kind' => ['=', 'in'],
        'level' => ['=', 'in'],
        'type' => ['=', 'in'],
        'source' => ['=', 'in'],
        'status' => ['=', 'in'],
        'target_type' => ['=', 'in'],
        'created_at' => ['between', '>=', '<='],
        'published_at' => ['between', '>=', '<='],
    ];

    protected array $sortable = ['id', 'created_at', 'updated_at', 'published_at', 'scheduled_at'];

    protected array $defaultSort = ['pinned' => 'desc', 'id' => 'desc'];

    public function paginate(AdminQuery $adminQuery): PageResult
    {
        $query = AdminNotificationBatch::query();

        $result = $this->pageQuery(
            $query,
            $adminQuery,
            fn (AdminNotificationBatch $batch): array => $this->toArray($batch),
        );

        return new PageResult(
            $result->items,
            $result->total,
            $result->page,
            $result->pageSize,
        );
    }


    /**
     * @return list<AdminNotificationBatch>
     */
    public function visibleAnnouncementsForReceiver(int $receiverId, array $roleIds, AdminQuery $adminQuery): array
    {
        $query = AdminNotificationBatch::query()
            ->where('kind', 'announcement')
            ->where('status', 'published');

        $this->applyMessageFilters($query, $adminQuery);
        $this->handleSearch($query, $this->messageSearchQuery($adminQuery));

        return $query->get()
            ->filter(fn (AdminNotificationBatch $batch): bool => $this->isVisibleToReceiver($batch, $receiverId, $roleIds))
            ->values()
            ->all();
    }

    public function findById(int $id): ?AdminNotificationBatch
    {
        /** @var null|AdminNotificationBatch $batch */
        $batch = $this->findModelById($id);

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
        $batchId = (int) $batch->getAttribute('id');
        Db::table('admin_notification_deliveries')->where('batch_id', $batchId)->delete();
        Db::table('admin_announcement_reads')->where('batch_id', $batchId)->delete();
        $this->deleteModel($batch);
    }

    public function statusStats(): array
    {
        return AdminNotificationBatch::query()
            ->select('status', Db::raw('count(*) as total'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(static fn ($row): array => [(string) $row->status => (int) $row->total])
            ->all();
    }


    public function toAnnouncementMessageArray(AdminNotificationBatch $batch, ?object $state = null): array
    {
        return [
            'id' => (int) $batch->getAttribute('id'),
            'kind' => (string) $batch->getAttribute('kind'),
            'title' => (string) $batch->getAttribute('title'),
            'content' => $batch->getAttribute('content'),
            'level' => (string) $batch->getAttribute('level'),
            'type' => (string) $batch->getAttribute('type'),
            'source' => (string) $batch->getAttribute('source'),
            'targetUrl' => $batch->getAttribute('target_url'),
            'payload' => $batch->getAttribute('payload') ?? [],
            'attachments' => $batch->getAttribute('attachments') ?? [],
            'readAt' => $state?->read_at === null ? null : (string) $state?->read_at,
            'archivedAt' => $state?->archived_at === null ? null : (string) $state?->archived_at,
            'pinned' => (bool) $batch->getAttribute('pinned'),
            'createdAt' => $this->formatDate($batch->getAttribute('published_at') ?? $batch->getAttribute('created_at')),
        ];
    }

    public function announcementReadState(int $batchId, int $receiverId): array
    {
        $state = Db::table('admin_announcement_reads')
            ->where('batch_id', $batchId)
            ->where('receiver_id', $receiverId)
            ->first();

        return [
            'readAt' => $state?->read_at === null ? null : (string) $state?->read_at,
            'archivedAt' => $state?->archived_at === null ? null : (string) $state?->archived_at,
        ];
    }

    public function targetReceivers(AdminNotificationBatch $batch): array
    {
        $targetType = (string) $batch->getAttribute('target_type');
        $query = AdminUser::query()->where('status', 'enabled');

        if ($targetType === 'role') {
            $roleIds = $this->intList($batch->getAttribute('target_role_ids'));
            if ($roleIds === []) {
                return [];
            }
            $query->whereHas('roles', static function ($query) use ($roleIds): void {
                $query->whereIn('admin_roles.id', $roleIds);
            });
        } elseif ($targetType === 'user') {
            $userIds = $this->intList($batch->getAttribute('target_user_ids'));
            if ($userIds === []) {
                return [];
            }
            $query->whereIn('id', $userIds);
        }

        return $query->get()->map(static fn (AdminUser $user): array => [
            'id' => (int) $user->getAttribute('id'),
            'name' => (string) ($user->getAttribute('nickname') ?: $user->getAttribute('username')),
        ])->all();
    }

    public function toArray(AdminNotificationBatch $batch): array
    {
        $batchId = (int) $batch->getAttribute('id');
        $stats = $this->deliveryStats($batchId);

        return [
            'id' => $batchId,
            'title' => (string) $batch->getAttribute('title'),
            'content' => $batch->getAttribute('content'),
            'kind' => (string) $batch->getAttribute('kind'),
            'level' => (string) $batch->getAttribute('level'),
            'type' => (string) $batch->getAttribute('type'),
            'source' => (string) $batch->getAttribute('source'),
            'status' => (string) $batch->getAttribute('status'),
            'targetType' => (string) $batch->getAttribute('target_type'),
            'targetSummary' => $this->targetSummary($batch),
            'targetRoleIds' => $this->intList($batch->getAttribute('target_role_ids')),
            'targetUserIds' => $this->intList($batch->getAttribute('target_user_ids')),
            'targetUrl' => $batch->getAttribute('target_url'),
            'payload' => $batch->getAttribute('payload') ?? [],
            'attachments' => $batch->getAttribute('attachments') ?? [],
            'pinned' => (bool) $batch->getAttribute('pinned'),
            'scheduledAt' => $this->formatDate($batch->getAttribute('scheduled_at')),
            'publishedAt' => $this->formatDate($batch->getAttribute('published_at')),
            'offlineAt' => $this->formatDate($batch->getAttribute('offline_at')),
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
        $this->applyBatchParams($query, $adminQuery);
        $this->applySort($query, $adminQuery);
    }

    private function applyBatchParams(Builder $query, AdminQuery $adminQuery): void
    {
        foreach (['kind', 'level', 'type', 'source', 'status'] as $field) {
            if ($adminQuery->hasParam($field)) {
                $query->where($field, $adminQuery->param($field));
            }
        }
        if ($adminQuery->hasParam('targetType')) {
            $query->where('target_type', $adminQuery->param('targetType'));
        }
        if ($adminQuery->hasParam('createdAt')) {
            $this->applyDateParam($query, 'created_at', $adminQuery->param('createdAt'));
        }
        if ($adminQuery->hasParam('publishedAt')) {
            $this->applyDateParam($query, 'published_at', $adminQuery->param('publishedAt'));
        }
    }

    private function applyDateParam(Builder $query, string $field, mixed $value): void
    {
        $values = is_array($value) ? array_values($value) : explode(',', (string) $value, 2);
        if (count($values) >= 2 && $values[0] !== '' && $values[1] !== '') {
            $query->whereBetween($field, [$values[0], $values[1]]);
        }
    }

    private function isVisibleToReceiver(AdminNotificationBatch $batch, int $receiverId, array $roleIds): bool
    {
        $targetType = (string) $batch->getAttribute('target_type');
        if ($targetType === 'all') {
            return true;
        }
        if ($targetType === 'role') {
            return array_intersect($this->intList($batch->getAttribute('target_role_ids')), $roleIds) !== [];
        }
        if ($targetType === 'user') {
            return in_array($receiverId, $this->intList($batch->getAttribute('target_user_ids')), true);
        }

        return false;
    }

    private function messageSearchQuery(AdminQuery $adminQuery): AdminQuery
    {
        return new AdminQuery(
            page: $adminQuery->page,
            pageSize: $adminQuery->pageSize,
            keyword: $adminQuery->keyword,
            filters: [],
            operators: [],
            params: [],
            sort: $adminQuery->sort,
            order: $adminQuery->order,
        );
    }

    private function applyMessageFilters(Builder $query, AdminQuery $adminQuery): void
    {
        foreach (['kind', 'level', 'type', 'source'] as $field) {
            if ($adminQuery->hasParam($field)) {
                $query->where($field, $adminQuery->param($field));
            }
        }
        if ($adminQuery->hasParam('startAt')) {
            $query->where('published_at', '>=', $adminQuery->param('startAt'));
        }
        if ($adminQuery->hasParam('endAt')) {
            $query->where('published_at', '<=', $adminQuery->param('endAt'));
        }
    }

    private function deliveryStats(int $batchId): array
    {
        $rows = Db::table('admin_notification_deliveries')
            ->select('status', Db::raw('count(*) as total'))
            ->where('batch_id', $batchId)
            ->groupBy('status')
            ->get();

        $stats = ['total' => 0, 'sent' => 0, 'failed' => 0, 'read' => 0];
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

    private function targetSummary(AdminNotificationBatch $batch): string
    {
        $targetType = (string) $batch->getAttribute('target_type');
        if ($targetType === 'role') {
            $values = $this->roleNames($this->intList($batch->getAttribute('target_role_ids')));
            return $values === [] ? '指定角色' : implode('、', $values);
        }
        if ($targetType === 'user') {
            $values = $this->intList($batch->getAttribute('target_user_ids'));
            return $values === [] ? '指定用户' : implode('、', array_map('strval', $values));
        }

        return '全员';
    }

    private function roleNames(array $roleIds): array
    {
        if ($roleIds === []) {
            return [];
        }

        return Db::table('admin_roles')
            ->whereIn('id', $roleIds)
            ->orderBy('level')
            ->orderBy('sort')
            ->orderBy('id')
            ->pluck('name')
            ->map(static fn (mixed $name): string => (string) $name)
            ->values()
            ->all();
    }

    private function formatDate(mixed $value): ?string
    {
        return $value === null ? null : (string) $value;
    }

    private function intList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map('intval', $value), static fn (int $id): bool => $id > 0)));
    }

    private function stringList(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map('strval', $value), static fn (string $item): bool => $item !== '')));
    }
}
