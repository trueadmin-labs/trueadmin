<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use App\Foundation\Database\Model;

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
