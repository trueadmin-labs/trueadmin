<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use App\Foundation\Database\Model;

final class AdminMenu extends Model
{
    protected ?string $table = 'admin_menus';

    protected array $fillable = [
        'parent_id',
        'type',
        'name',
        'path',
        'permission',
        'sort',
        'status',
    ];
}
