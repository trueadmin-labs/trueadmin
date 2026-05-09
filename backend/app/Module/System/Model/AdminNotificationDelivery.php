<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use App\Foundation\Database\Model;
use Hyperf\Database\Model\Relations\BelongsTo;

final class AdminNotificationDelivery extends Model
{
    protected ?string $table = 'admin_notification_deliveries';

    protected array $fillable = [
        'batch_id',
        'receiver_id',
        'receiver_name',
        'status',
        'sent_at',
        'read_at',
        'archived_at',
        'failed_reason',
        'retry_count',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(AdminNotificationBatch::class, 'batch_id', 'id');
    }
}
