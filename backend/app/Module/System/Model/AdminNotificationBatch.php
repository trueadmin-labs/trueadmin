<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use App\Foundation\Database\Model;
use Hyperf\Database\Model\Relations\HasMany;

final class AdminNotificationBatch extends Model
{
    protected ?string $table = 'admin_notification_batches';

    protected array $fillable = [
        'kind',
        'level',
        'type',
        'source',
        'title',
        'content',
        'payload',
        'attachments',
        'target_url',
        'target_type',
        'target_role_ids',
        'target_user_ids',
        'pinned',
        'status',
        'scheduled_at',
        'published_at',
        'offline_at',
        'operator_id',
        'operator_name',
    ];

    protected array $casts = [
        'payload' => 'array',
        'attachments' => 'array',
        'target_role_ids' => 'array',
        'target_user_ids' => 'array',
        'pinned' => 'boolean',
    ];

    public function deliveries(): HasMany
    {
        return $this->hasMany(AdminNotificationDelivery::class, 'batch_id', 'id');
    }
}
