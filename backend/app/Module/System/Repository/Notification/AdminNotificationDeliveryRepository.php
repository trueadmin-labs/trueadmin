<?php

declare(strict_types=1);

namespace App\Module\System\Repository\Notification;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminNotificationBatch;
use App\Module\System\Model\AdminNotificationDelivery;
use Hyperf\Database\Model\Builder;
use Hyperf\DbConnection\Db;

final class AdminNotificationDeliveryRepository extends AbstractRepository
{
    protected ?string $modelClass = AdminNotificationDelivery::class;

    protected array $keywordFields = ['receiver_name', 'failed_reason'];

    protected array $filterable = [
        'id' => ['=', 'in'],
        'batch_id' => ['=', 'in'],
        'receiver_id' => ['=', 'in'],
        'status' => ['=', 'in'],
        'read_at' => ['between', '>=', '<='],
        'archived_at' => ['between', '>=', '<='],
        'created_at' => ['between', '>=', '<='],
    ];

    protected array $sortable = ['id', 'created_at', 'updated_at', 'read_at', 'sent_at'];

    protected array $defaultSort = ['id' => 'desc'];

    public function paginateByBatch(int $batchId, AdminQuery $adminQuery): PageResult
    {
        return $this->pageQuery(
            AdminNotificationDelivery::query()->where('batch_id', $batchId),
            $adminQuery,
            fn (AdminNotificationDelivery $delivery): array => $this->toArray($delivery),
        );
    }

    public function paginateForReceiver(int $receiverId, AdminQuery $adminQuery): PageResult
    {
        $query = AdminNotificationDelivery::query()
            ->join('admin_notification_batches', 'admin_notification_batches.id', '=', 'admin_notification_deliveries.batch_id')
            ->where('admin_notification_deliveries.receiver_id', $receiverId)
            ->where('admin_notification_deliveries.status', 'sent')
            ->where('admin_notification_batches.status', 'published')
            ->select('admin_notification_deliveries.*');

        $this->applyMessageFilters($query, $adminQuery);

        return $this->pageQuery(
            $query,
            $this->messageSearchQuery($adminQuery),
            fn (AdminNotificationDelivery $delivery): array => $this->toMessageArray($delivery),
        );
    }

    public function findById(int $id): ?AdminNotificationDelivery
    {
        /** @var null|AdminNotificationDelivery $delivery */
        $delivery = $this->findModelById($id);

        return $delivery;
    }

    public function findForReceiver(int $batchId, int $receiverId): ?AdminNotificationDelivery
    {
        return AdminNotificationDelivery::query()
            ->where('batch_id', $batchId)
            ->where('receiver_id', $receiverId)
            ->first();
    }

    public function create(array $data): AdminNotificationDelivery
    {
        /** @var AdminNotificationDelivery $delivery */
        $delivery = $this->createModel($data);

        return $delivery;
    }

    public function update(AdminNotificationDelivery $delivery, array $data): AdminNotificationDelivery
    {
        /** @var AdminNotificationDelivery $delivery */
        $delivery = $this->updateModel($delivery, $data);

        return $delivery;
    }

    public function unreadCount(int $receiverId): array
    {
        $rows = AdminNotificationDelivery::query()
            ->join('admin_notification_batches', 'admin_notification_batches.id', '=', 'admin_notification_deliveries.batch_id')
            ->where('admin_notification_deliveries.receiver_id', $receiverId)
            ->where('admin_notification_deliveries.status', 'sent')
            ->whereNull('admin_notification_deliveries.read_at')
            ->whereNull('admin_notification_deliveries.archived_at')
            ->where('admin_notification_batches.status', 'published')
            ->select('admin_notification_batches.kind', Db::raw('count(*) as total'))
            ->groupBy('admin_notification_batches.kind')
            ->get();

        $result = ['total' => 0, 'notification' => 0, 'announcement' => 0];
        foreach ($rows as $row) {
            $kind = (string) $row->kind;
            $total = (int) $row->total;
            $result['total'] += $total;
            if (array_key_exists($kind, $result)) {
                $result[$kind] = $total;
            }
        }

        return $result;
    }

    public function toArray(AdminNotificationDelivery $delivery): array
    {
        return [
            'id' => (int) $delivery->getAttribute('id'),
            'batchId' => (int) $delivery->getAttribute('batch_id'),
            'receiverId' => (int) $delivery->getAttribute('receiver_id'),
            'receiverName' => (string) $delivery->getAttribute('receiver_name'),
            'status' => (string) $delivery->getAttribute('status'),
            'readAt' => $this->formatDate($delivery->getAttribute('read_at')),
            'archivedAt' => $this->formatDate($delivery->getAttribute('archived_at')),
            'sentAt' => $this->formatDate($delivery->getAttribute('sent_at')),
            'failedReason' => $delivery->getAttribute('failed_reason'),
            'retryCount' => (int) $delivery->getAttribute('retry_count'),
            'createdAt' => $this->formatDate($delivery->getAttribute('created_at')),
            'updatedAt' => $this->formatDate($delivery->getAttribute('updated_at')),
        ];
    }

    public function toMessageArray(AdminNotificationDelivery $delivery): array
    {
        /** @var AdminNotificationBatch|null $batch */
        $batch = $delivery->batch()->first();
        if ($batch === null) {
            return [];
        }

        return [
            'id' => (int) $batch->getAttribute('id'),
            'deliveryId' => (int) $delivery->getAttribute('id'),
            'kind' => (string) $batch->getAttribute('kind'),
            'title' => (string) $batch->getAttribute('title'),
            'content' => $batch->getAttribute('content'),
            'level' => (string) $batch->getAttribute('level'),
            'type' => (string) $batch->getAttribute('type'),
            'source' => (string) $batch->getAttribute('source'),
            'targetUrl' => $batch->getAttribute('target_url'),
            'payload' => $batch->getAttribute('payload') ?? [],
            'attachments' => $batch->getAttribute('attachments') ?? [],
            'readAt' => $this->formatDate($delivery->getAttribute('read_at')),
            'archivedAt' => $this->formatDate($delivery->getAttribute('archived_at')),
            'pinned' => (bool) $batch->getAttribute('pinned'),
            'createdAt' => $this->formatDate($batch->getAttribute('published_at') ?? $batch->getAttribute('created_at')),
        ];
    }

    private function messageSearchQuery(AdminQuery $adminQuery): AdminQuery
    {
        return new AdminQuery(
            page: $adminQuery->page,
            pageSize: $adminQuery->pageSize,
            keyword: '',
            filters: [],
            operators: [],
            params: [],
            sort: $adminQuery->sort,
            order: $adminQuery->order,
        );
    }

    private function applyMessageFilters(Builder $query, AdminQuery $adminQuery): void
    {
        $status = (string) $adminQuery->param('status', 'all');
        if ($status === 'unread') {
            $query->whereNull('admin_notification_deliveries.read_at')->whereNull('admin_notification_deliveries.archived_at');
        } elseif ($status === 'read') {
            $query->whereNotNull('admin_notification_deliveries.read_at')->whereNull('admin_notification_deliveries.archived_at');
        } elseif ($status === 'archived') {
            $query->whereNotNull('admin_notification_deliveries.archived_at');
        } else {
            $query->whereNull('admin_notification_deliveries.archived_at');
        }

        foreach (['kind', 'level', 'type', 'source'] as $field) {
            if ($adminQuery->hasParam($field)) {
                $query->where('admin_notification_batches.' . $field, $adminQuery->param($field));
            }
        }

        if ($adminQuery->hasParam('startAt')) {
            $query->where('admin_notification_batches.published_at', '>=', $adminQuery->param('startAt'));
        }
        if ($adminQuery->hasParam('endAt')) {
            $query->where('admin_notification_batches.published_at', '<=', $adminQuery->param('endAt'));
        }
        if ($adminQuery->keyword !== '') {
            $keyword = '%' . $adminQuery->keyword . '%';
            $query->where(static function ($query) use ($keyword): void {
                $query->where('admin_notification_batches.title', 'like', $keyword)
                    ->orWhere('admin_notification_batches.content', 'like', $keyword)
                    ->orWhere('admin_notification_batches.source', 'like', $keyword)
                    ->orWhere('admin_notification_batches.type', 'like', $keyword)
                    ->orWhere('admin_notification_deliveries.receiver_name', 'like', $keyword);
            });
        }
    }

    private function formatDate(mixed $value): ?string
    {
        return $value === null ? null : (string) $value;
    }
}
