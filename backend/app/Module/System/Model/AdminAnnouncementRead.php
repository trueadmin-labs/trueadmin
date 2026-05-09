<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use App\Foundation\Database\Model;
use Hyperf\Database\Model\Relations\BelongsTo;

final class AdminAnnouncementRead extends Model
{
    protected ?string $table = 'admin_announcement_reads';

    protected array $fillable = [
        'batch_id',
        'receiver_id',
        'read_at',
        'archived_at',
    ];

    public function batch(): BelongsTo
    {
        return $this->belongsTo(AdminNotificationBatch::class, 'batch_id', 'id');
    }
}
