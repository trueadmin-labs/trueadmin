<?php

declare(strict_types=1);

namespace App\Module\System\Service\Notification;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;
use App\Foundation\Service\AbstractService;
use App\Module\System\Model\AdminNotificationBatch;
use App\Module\System\Repository\Notification\AdminNotificationBatchRepository;
use App\Module\System\Repository\Notification\AdminNotificationDeliveryRepository;
use Hyperf\DbConnection\Db;
use TrueAdmin\Kernel\Constant\ErrorCode;
use TrueAdmin\Kernel\Context\ActorContext;
use TrueAdmin\Kernel\Exception\BusinessException;

final class AdminNotificationBatchService extends AbstractService
{
    public function __construct(
        private readonly AdminNotificationBatchRepository $batches,
        private readonly AdminNotificationDeliveryRepository $deliveries,
    ) {
    }

    public function paginate(AdminQuery $query): PageResult
    {
        return $this->batches->paginate($query);
    }

    public function listMeta(): array
    {
        return ['statusStats' => $this->batches->statusStats()];
    }

    public function detail(int $id): array
    {
        return $this->batches->toArray($this->mustFind($id));
    }

    public function createAnnouncement(array $payload): array
    {
        return $this->create([...$payload, 'kind' => 'announcement']);
    }

    public function create(array $payload): array
    {
        return Db::transaction(function () use ($payload): array {
            $actor = ActorContext::operator();
            $status = $this->initialStatus($payload);
            $batch = $this->batches->create($this->data($payload, [
                'status' => $status,
                'published_at' => $status === 'published' ? date('Y-m-d H:i:s') : null,
                'operator_id' => $actor === null ? null : (int) $actor->id,
                'operator_name' => $actor?->name ?? '',
            ]));

            if ((string) $batch->getAttribute('status') === 'published') {
                $this->createDeliveries($batch);
            }

            return $this->batches->toArray($batch);
        });
    }

    public function update(int $id, array $payload): array
    {
        return Db::transaction(function () use ($id, $payload): array {
            $batch = $this->mustFind($id);
            $status = (string) $batch->getAttribute('status');
            if (! in_array($status, ['draft', 'scheduled'], true)) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'only_draft_or_scheduled_can_be_updated']);
            }

            $batch = $this->batches->update($batch, $this->data($payload, [
                'status' => empty($payload['scheduledAt']) ? 'draft' : 'scheduled',
                'published_at' => null,
                'offline_at' => null,
            ]));

            return $this->batches->toArray($batch);
        });
    }

    public function deleteDraft(int $id): void
    {
        Db::transaction(function () use ($id): void {
            $batch = $this->mustFind($id);
            if ((string) $batch->getAttribute('status') !== 'draft') {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'only_draft_can_be_deleted']);
            }

            $this->batches->delete($batch);
        });
    }

    public function publish(int $id): array
    {
        return Db::transaction(function () use ($id): array {
            $batch = $this->mustFind($id);
            if (! in_array((string) $batch->getAttribute('status'), ['draft', 'scheduled'], true)) {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'only_draft_or_scheduled_can_be_published']);
            }

            $batch = $this->batches->update($batch, [
                'status' => 'published',
                'scheduled_at' => null,
                'published_at' => date('Y-m-d H:i:s'),
                'offline_at' => null,
            ]);
            $this->createDeliveries($batch);

            return $this->batches->toArray($batch);
        });
    }

    public function cancelScheduled(int $id): array
    {
        return Db::transaction(function () use ($id): array {
            $batch = $this->mustFind($id);
            if ((string) $batch->getAttribute('status') !== 'scheduled') {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'only_scheduled_can_be_canceled']);
            }

            $batch = $this->batches->update($batch, [
                'status' => 'draft',
                'scheduled_at' => null,
            ]);

            return $this->batches->toArray($batch);
        });
    }

    public function offline(int $id): array
    {
        return Db::transaction(function () use ($id): array {
            $batch = $this->mustFind($id);
            if ((string) $batch->getAttribute('status') !== 'published') {
                throw new BusinessException(ErrorCode::VALIDATION_FAILED, 422, ['reason' => 'only_published_can_be_offline']);
            }

            $batch = $this->batches->update($batch, [
                'status' => 'offline',
                'offline_at' => date('Y-m-d H:i:s'),
            ]);

            return $this->batches->toArray($batch);
        });
    }

    public function paginateDeliveries(int $batchId, AdminQuery $query): PageResult
    {
        $batch = $this->mustFind($batchId);
        if ((string) $batch->getAttribute('kind') === 'announcement') {
            return $this->paginateAnnouncementDeliveries($batch, $query);
        }

        return $this->deliveries->paginateByBatch($batchId, $query);
    }

    public function resendDelivery(int $batchId, int $deliveryId): array
    {
        return Db::transaction(function () use ($batchId, $deliveryId): array {
            $this->mustFind($batchId);
            $delivery = $this->deliveries->findById($deliveryId);
            if ($delivery === null || (int) $delivery->getAttribute('batch_id') !== $batchId) {
                throw $this->notFound('admin_notification_delivery', $deliveryId);
            }

            $delivery = $this->deliveries->update($delivery, [
                'status' => 'sent',
                'sent_at' => date('Y-m-d H:i:s'),
                'failed_reason' => null,
                'retry_count' => (int) $delivery->getAttribute('retry_count') + 1,
            ]);

            return $this->deliveries->toArray($delivery);
        });
    }

    private function paginateAnnouncementDeliveries(AdminNotificationBatch $batch, AdminQuery $query): PageResult
    {
        $batchId = (int) $batch->getAttribute('id');
        $status = (string) $query->param('status', '');
        $keyword = mb_strtolower($query->keyword);
        $items = [];

        foreach ($this->batches->targetReceivers($batch) as $receiver) {
            $state = $this->batches->announcementReadState($batchId, (int) $receiver['id']);
            $readAt = $state['readAt'] ?? null;
            $archivedAt = $state['archivedAt'] ?? null;
            $rowStatus = $readAt === null ? 'sent' : 'sent';
            if ($status !== '' && $status !== $rowStatus) {
                continue;
            }
            if ($keyword !== '' && ! str_contains(mb_strtolower((string) $receiver['name']), $keyword)) {
                continue;
            }
            $items[] = [
                'id' => (int) $receiver['id'],
                'batchId' => $batchId,
                'receiverId' => (int) $receiver['id'],
                'receiverName' => (string) $receiver['name'],
                'status' => 'sent',
                'readAt' => $readAt,
                'archivedAt' => $archivedAt,
                'sentAt' => $this->formatDate($batch->getAttribute('published_at')),
                'failedReason' => null,
                'retryCount' => 0,
                'createdAt' => $this->formatDate($batch->getAttribute('published_at') ?? $batch->getAttribute('created_at')),
                'updatedAt' => $this->formatDate($batch->getAttribute('updated_at')),
            ];
        }

        $offset = ($query->page - 1) * $query->pageSize;

        return new PageResult(array_slice($items, $offset, $query->pageSize), count($items), $query->page, $query->pageSize);
    }

    private function formatDate(mixed $value): ?string
    {
        return $value === null ? null : (string) $value;
    }

    private function data(array $payload, array $extra = []): array
    {
        $targetType = (string) ($payload['targetType'] ?? 'all');

        return [
            'kind' => (string) ($payload['kind'] ?? 'notification'),
            'level' => (string) ($payload['level'] ?? 'info'),
            'type' => (string) ($payload['type'] ?? 'system'),
            'source' => (string) ($payload['source'] ?? 'system'),
            'title' => (string) $payload['title'],
            'content' => $payload['content'] ?? null,
            'payload' => $payload['payload'] ?? [],
            'attachments' => $payload['attachments'] ?? [],
            'target_url' => $payload['targetUrl'] ?? null,
            'target_type' => $targetType,
            'target_role_ids' => $targetType === 'role' ? ($payload['targetRoleIds'] ?? []) : [],
            'target_user_ids' => $targetType === 'user' ? ($payload['targetUserIds'] ?? []) : [],
            'pinned' => (bool) ($payload['pinned'] ?? false),
            'scheduled_at' => $payload['scheduledAt'] ?? null,
            ...$extra,
        ];
    }

    private function initialStatus(array $payload): string
    {
        if (! empty($payload['scheduledAt'])) {
            return 'scheduled';
        }

        return ($payload['kind'] ?? '') === 'announcement' ? 'published' : 'draft';
    }

    private function createDeliveries(AdminNotificationBatch $batch): void
    {
        if ((string) $batch->getAttribute('kind') === 'announcement') {
            return;
        }

        foreach ($this->batches->targetReceivers($batch) as $receiver) {
            $exists = $this->deliveries->findForReceiver((int) $batch->getAttribute('id'), (int) $receiver['id']);
            if ($exists !== null) {
                continue;
            }
            $this->deliveries->create([
                'batch_id' => (int) $batch->getAttribute('id'),
                'receiver_id' => (int) $receiver['id'],
                'receiver_name' => (string) $receiver['name'],
                'status' => 'sent',
                'sent_at' => date('Y-m-d H:i:s'),
            ]);
        }
    }

    private function mustFind(int $id): AdminNotificationBatch
    {
        $batch = $this->batches->findById($id);
        if ($batch === null) {
            throw $this->notFound('admin_notification_batch', $id);
        }

        return $batch;
    }
}
