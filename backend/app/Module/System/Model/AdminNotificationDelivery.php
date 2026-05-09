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
        'locale',
        'title',
        'content',
        'payload',
        'attachments',
        'target_url',
        'status',
        'skip_reason',
        'sent_at',
        'read_at',
        'archived_at',
        'expires_at',
        'error_message',
        'retry_count',
    ];

    protected array $casts = [
        'payload' => 'array',
        'attachments' => 'array',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(AdminNotificationBatch::class, 'batch_id', 'id');
    }
}
