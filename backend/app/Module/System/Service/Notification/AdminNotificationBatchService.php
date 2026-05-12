<?php

declare(strict_types=1);

namespace App\Module\System\Service\Notification;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Crud\CrudQuery;
use App\Foundation\Service\AbstractService;
use App\Module\System\Repository\Notification\AdminNotificationBatchRepository;
use App\Module\System\Repository\Notification\AdminNotificationDeliveryRepository;
use Hyperf\DbConnection\Db;

final class AdminNotificationBatchService extends AbstractService
{
    public function __construct(
        private readonly AdminNotificationBatchRepository $batches,
        private readonly AdminNotificationDeliveryRepository $deliveries,
    ) {
    }

    public function paginate(CrudQuery $query): PageResult
    {
        return $this->batches->paginate($query);
    }

    public function listMeta(): array
    {
        return ['statusStats' => $this->batches->statusStats()];
    }

    public function detail(int $id): array
    {
        $batch = $this->batches->findByIdWithDataPolicy($id);
        if ($batch === null) {
            throw $this->notFound('admin_notification_batch', $id);
        }

        return $this->batches->toArray($batch);
    }

    public function paginateDeliveries(int $id, CrudQuery $query): PageResult
    {
        $batch = $this->batches->findByIdWithDataPolicy($id);
        if ($batch === null) {
            throw $this->notFound('admin_notification_batch', $id);
        }

        return $this->deliveries->paginateByBatch($id, $query);
    }

    public function resendDelivery(int $batchId, int $deliveryId): array
    {
        return Db::transaction(function () use ($batchId, $deliveryId): array {
            $batch = $this->batches->findByIdWithDataPolicy($batchId);
            $delivery = $batch === null ? null : $this->deliveries->findById($deliveryId);
            if ($batch === null || $delivery === null || (int) $delivery->getAttribute('batch_id') !== $batchId) {
                throw $this->notFound('admin_notification_delivery', $deliveryId);
            }

            $delivery = $this->deliveries->update($delivery, [
                'status' => 'sent',
                'sent_at' => date('Y-m-d H:i:s'),
                'error_message' => null,
                'retry_count' => (int) $delivery->getAttribute('retry_count') + 1,
            ]);

            return $this->deliveries->toArray($delivery);
        });
    }

    public function resendFailedDeliveries(int $batchId): array
    {
        return Db::transaction(function () use ($batchId): array {
            $batch = $this->batches->findByIdWithDataPolicy($batchId);
            if ($batch === null) {
                throw $this->notFound('admin_notification_batch', $batchId);
            }

            $deliveries = Db::table('admin_notification_deliveries')
                ->where('batch_id', $batchId)
                ->where('status', 'failed')
                ->get();

            foreach ($deliveries as $delivery) {
                Db::table('admin_notification_deliveries')
                    ->where('id', (int) $delivery->id)
                    ->update([
                        'status' => 'sent',
                        'sent_at' => date('Y-m-d H:i:s'),
                        'error_message' => null,
                        'retry_count' => (int) $delivery->retry_count + 1,
                        'updated_at' => date('Y-m-d H:i:s'),
                    ]);
            }

            return ['resent' => $deliveries->count()];
        });
    }
}
