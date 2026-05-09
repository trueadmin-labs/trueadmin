<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use App\Foundation\Database\Model;
use Hyperf\Database\Model\Relations\HasMany;

final class AdminNotificationBatch extends Model
{
    protected ?string $table = 'admin_notification_batches';

    protected array $fillable = [
        'type',
        'level',
        'source',
        'targets',
        'template_key',
        'template_variables',
        'fallback_title',
        'fallback_content',
        'payload',
        'attachments',
        'target_url',
        'dedupe_key',
        'dedupe_ttl_seconds',
        'expires_at',
        'status',
        'operator_type',
        'operator_id',
        'operator_name',
        'impersonator_id',
        'error_message',
    ];

    protected array $casts = [
        'targets' => 'array',
        'template_variables' => 'array',
        'payload' => 'array',
        'attachments' => 'array',
    ];

    public function deliveries(): HasMany
    {
        return $this->hasMany(AdminNotificationDelivery::class, 'batch_id', 'id');
    }
}
