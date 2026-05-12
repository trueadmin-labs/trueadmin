<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use TrueAdmin\Kernel\Database\Model;

final class AdminDepartment extends Model
{
    protected ?string $table = 'admin_departments';

    protected array $fillable = [
        'parent_id',
        'code',
        'name',
        'level',
        'path',
        'sort',
        'status',
    ];
}
