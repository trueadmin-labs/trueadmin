<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use App\Foundation\Database\Model;

final class AdminLoginLog extends Model
{
    protected ?string $table = 'admin_login_logs';

    protected array $fillable = [
        'admin_user_id',
        'username',
        'ip',
        'user_agent',
        'status',
        'reason',
    ];
}
