<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use TrueAdmin\Kernel\Database\Model;
use Hyperf\Database\Model\SoftDeletes;

final class ClientUser extends Model
{
    use SoftDeletes;

    protected ?string $table = 'client_users';

    protected array $fillable = [
        'username',
        'phone',
        'email',
        'password',
        'nickname',
        'avatar',
        'status',
        'register_channel',
        'last_login_at',
        'created_by',
        'updated_by',
    ];

    protected array $hidden = [
        'password',
    ];
}
