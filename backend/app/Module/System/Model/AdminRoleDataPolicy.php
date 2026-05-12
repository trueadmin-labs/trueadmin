<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use TrueAdmin\Kernel\Database\Model;

final class AdminRoleDataPolicy extends Model
{
    protected ?string $table = 'admin_role_data_policies';

    protected array $fillable = [
        'role_id',
        'resource',
        'strategy',
        'effect',
        'scope',
        'config',
        'status',
        'sort',
    ];

    protected array $casts = [
        'config' => 'array',
    ];
}
