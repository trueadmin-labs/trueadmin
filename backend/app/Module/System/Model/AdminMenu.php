<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use App\Foundation\Database\Model;

final class AdminMenu extends Model
{
    protected ?string $table = 'admin_menus';

    protected array $fillable = [
        'parent_id',
        'code',
        'type',
        'name',
        'path',
        'url',
        'open_mode',
        'show_link_header',
        'icon',
        'permission',
        'source',
        'sort',
        'status',
        'metadata_synced_at',
    ];
}
