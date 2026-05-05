<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use App\Foundation\Database\Model;

final class AdminOperationLog extends Model
{
    protected ?string $table = 'admin_operation_logs';

    protected array $fillable = [
        'module',
        'action',
        'remark',
        'principal_type',
        'principal_id',
        'operator_type',
        'operator_id',
        'operation_dept_id',
        'context',
    ];

    protected array $casts = [
        'context' => 'array',
    ];
}
