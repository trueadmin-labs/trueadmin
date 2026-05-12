<?php

declare(strict_types=1);

namespace App\Module\System\Repository\Notification;

use TrueAdmin\Kernel\Crud\CrudQuery;
use TrueAdmin\Kernel\Crud\CrudQueryApplierOptions;
use TrueAdmin\Kernel\Pagination\PageResult;
use App\Foundation\Repository\AbstractRepository;
use App\Module\System\Model\AdminNotificationDelivery;
use Hyperf\Database\Model\Builder;
use Hyperf\DbConnection\Db;

/**
 * @extends AbstractRepository<AdminNotificationDelivery>
 */
final class AdminNotificationDeliveryRepository extends AbstractRepository
{
    private const MESSAGE_FILTERABLE = [
        'level' => ['eq', 'in'],
        'type' => ['eq', 'in'],
        'source' => ['eq', 'in'],
        'createdAt' => ['between', 'gte', 'lte'],
    ];

    private const MESSAGE_FILTER_COLUMNS = [
        'level' => 'admin_notification_batches.level',
        'type' => 'admin_notification_batches.type',
        'source' => 'admin_notification_batches.source',
        'createdAt' => 'admin_notification_deliveries.sent_at',
    ];

    protected ?string $modelClass = AdminNotificationDelivery::class;

    protected array $keywordFields = [
        'admin_notification_deliveries.receiver_name',
        'admin_notification_deliveries.title',
        'admin_notification_deliveries.content',
        'admin_notification_deliveries.error_message',
    ];

    protected array $filterable = [
        'id' => ['eq', 'in'],
        'batchId' => ['eq', 'in'],
        'receiverId' => ['eq', 'in'],
        'status' => ['eq', 'in'],
        'readAt' => ['between', 'gte', 'lte'],
        'archivedAt' => ['between', 'gte', 'lte'],
        'createdAt' => ['between', 'gte', 'lte'],
    ];

    protected array $filterColumns = [
        'id' => 'admin_notification_deliveries.id',
        'batchId' => 'admin_notification_deliveries.batch_id',
        'receiverId' => 'admin_notification_deliveries.receiver_id',
        'status' => 'admin_notification_deliveries.status',
        'readAt' => 'admin_notification_deliveries.read_at',
        'archivedAt' => 'admin_notification_deliveries.archived_at',
        'createdAt' => 'admin_notification_deliveries.created_at',
    ];

    protected array $sortable = ['id', 'createdAt', 'updatedAt', 'readAt', 'sentAt'];

    protected array $sortColumns = [
        'id' => 'admin_notification_deliveries.id',
        'createdAt' => 'admin_notification_deliveries.created_at',
        'updatedAt' => 'admin_notification_deliveries.updated_at',
        'readAt' => 'admin_notification_deliveries.read_at',
        'sentAt' => 'admin_notification_deliveries.sent_at',
    ];

    protected array $defaultSort = ['id' => 'desc'];

    public function paginateByBatch(int $batchId, CrudQuery $adminQuery): PageResult
    {
        return $this->pageQuery(
            AdminNotificationDelivery::query()->where('batch_id', $batchId),
            $adminQuery,
            fn (AdminNotificationDelivery $delivery): array => $this->toArray($delivery),
        );
    }

    public function paginateForReceiver(int $receiverId, CrudQuery $adminQuery): PageResult
    {
        $items = $this->listForReceiver($receiverId, $adminQuery);

        return new PageResult($items, count($items), $adminQuery->page, $adminQuery->pageSize);
    }

    public function listForReceiver(int $receiverId, CrudQuery $adminQuery): array
    {
        $now = date('Y-m-d H:i:s');
        $query = AdminNotificationDelivery::query()
            ->join('admin_notification_batches', 'admin_notification_batches.id', '=', 'admin_notification_deliveries.batch_id')
            ->where('admin_notification_deliveries.receiver_id', $receiverId)
            ->where('admin_notification_deliveries.status', 'sent')
            ->where(static function (Builder $query) use ($now): void {
                $query->whereNull('admin_notification_deliveries.expires_at')
                    ->orWhere('admin_notification_deliveries.expires_at', '>', $now);
            })
            ->select('admin_notification_deliveries.*');

        $this->applyMessageFilters($query, $adminQuery);

        $this->applySort($query, $this->messageSearchQuery($adminQuery));

        return $query->get()
            ->map(fn (AdminNotificationDelivery $delivery): array => $this->toMessageArray($delivery))
            ->all();
    }

    public function findById(int $id): ?AdminNotificationDelivery
    {
        /** @var null|AdminNotificationDelivery $delivery */
        $delivery = $this->findModelById($id);

        return $delivery;
    }

    public function findForReceiver(int $batchId, int $receiverId): ?AdminNotificationDelivery
    {
        $delivery = AdminNotificationDelivery::query()
            ->where('batch_id', $batchId)
            ->where('receiver_id', $receiverId)
            ->first();

        return $delivery instanceof AdminNotificationDelivery ? $delivery : null;
    }

    public function findMessageForReceiver(int $deliveryId, int $receiverId): ?AdminNotificationDelivery
    {
        $delivery = AdminNotificationDelivery::query()
            ->where('id', $deliveryId)
            ->where('receiver_id', $receiverId)
            ->first();

        return $delivery instanceof AdminNotificationDelivery ? $delivery : null;
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
        $now = date('Y-m-d H:i:s');
        $total = AdminNotificationDelivery::query()
            ->where('receiver_id', $receiverId)
            ->where('status', 'sent')
            ->whereNull('read_at')
            ->whereNull('archived_at')
            ->where(static function (Builder $query) use ($now): void {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', $now);
            })
            ->count();

        return ['total' => (int) $total, 'notification' => (int) $total, 'announcement' => 0];
    }

    public function toArray(AdminNotificationDelivery $delivery): array
    {
        return [
            'id' => (int) $delivery->getAttribute('id'),
            'batchId' => (int) $delivery->getAttribute('batch_id'),
            'receiverId' => (int) $delivery->getAttribute('receiver_id'),
            'receiverName' => (string) $delivery->getAttribute('receiver_name'),
            'status' => (string) $delivery->getAttribute('status'),
            'skipReason' => $delivery->getAttribute('skip_reason'),
            'readAt' => $this->formatDate($delivery->getAttribute('read_at')),
            'archivedAt' => $this->formatDate($delivery->getAttribute('archived_at')),
            'sentAt' => $this->formatDate($delivery->getAttribute('sent_at')),
            'expiresAt' => $this->formatDate($delivery->getAttribute('expires_at')),
            'failedReason' => $delivery->getAttribute('error_message'),
            'errorMessage' => $delivery->getAttribute('error_message'),
            'retryCount' => (int) $delivery->getAttribute('retry_count'),
            'createdAt' => $this->formatDate($delivery->getAttribute('created_at')),
            'updatedAt' => $this->formatDate($delivery->getAttribute('updated_at')),
        ];
    }

    public function toMessageArray(AdminNotificationDelivery $delivery): array
    {
        return [
            'id' => (int) $delivery->getAttribute('id'),
            'deliveryId' => (int) $delivery->getAttribute('id'),
            'batchId' => (int) $delivery->getAttribute('batch_id'),
            'kind' => 'notification',
            'title' => (string) $delivery->getAttribute('title'),
            'content' => $delivery->getAttribute('content'),
            'level' => (string) ($delivery->batch?->level ?? 'info'),
            'type' => (string) ($delivery->batch?->type ?? 'system'),
            'source' => (string) ($delivery->batch?->source ?? 'system'),
            'targetUrl' => $delivery->getAttribute('target_url'),
            'payload' => $delivery->getAttribute('payload') ?? [],
            'attachments' => $delivery->getAttribute('attachments') ?? [],
            'readAt' => $this->formatDate($delivery->getAttribute('read_at')),
            'archivedAt' => $this->formatDate($delivery->getAttribute('archived_at')),
            'pinned' => false,
            'createdAt' => $this->formatDate($delivery->getAttribute('sent_at') ?? $delivery->getAttribute('created_at')),
        ];
    }

    private function messageSearchQuery(CrudQuery $adminQuery): CrudQuery
    {
        return new CrudQuery(
            page: $adminQuery->page,
            pageSize: $adminQuery->pageSize,
            keyword: '',
            filters: [],
            sorts: $adminQuery->sorts,
            params: [],
        );
    }

    private function applyMessageFilters(Builder $query, CrudQuery $adminQuery): void
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

        $this->crudQueryApplier()->applyFilters($query, $adminQuery, new CrudQueryApplierOptions(
            filterable: self::MESSAGE_FILTERABLE,
            filterColumns: self::MESSAGE_FILTER_COLUMNS,
        ));

        if ($adminQuery->keyword !== '') {
            $keyword = '%' . $adminQuery->keyword . '%';
            $query->where(static function ($query) use ($keyword): void {
                $query->where('admin_notification_deliveries.title', 'like', $keyword)
                    ->orWhere('admin_notification_deliveries.content', 'like', $keyword)
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
