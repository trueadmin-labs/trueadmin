<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use TrueAdmin\Kernel\Database\Model;
use Hyperf\Database\Model\Relations\BelongsTo;

final class AdminAnnouncementRead extends Model
{
    protected ?string $table = 'admin_announcement_reads';

    protected array $fillable = [
        'announcement_id',
        'admin_id',
        'read_at',
        'archived_at',
    ];

    public function announcement(): BelongsTo
    {
        return $this->belongsTo(AdminAnnouncement::class, 'announcement_id', 'id');
    }
}
