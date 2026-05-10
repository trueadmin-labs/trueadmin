<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use App\Foundation\Database\Model;
use Hyperf\Database\Model\Relations\HasMany;

final class AdminAnnouncement extends Model
{
    protected ?string $table = 'admin_announcements';

    protected array $fillable = [
        'title',
        'content',
        'level',
        'type',
        'source',
        'scope',
        'role_ids',
        'payload',
        'attachments',
        'target_url',
        'status',
        'pinned',
        'publish_at',
        'expire_at',
        'operator_type',
        'operator_id',
        'operator_dept_id',
        'operator_name',
    ];

    protected array $casts = [
        'role_ids' => 'array',
        'payload' => 'array',
        'attachments' => 'array',
        'pinned' => 'boolean',
    ];

    public function reads(): HasMany
    {
        return $this->hasMany(AdminAnnouncementRead::class, 'announcement_id', 'id');
    }
}
