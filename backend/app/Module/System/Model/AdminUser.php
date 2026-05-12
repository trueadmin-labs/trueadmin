<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use TrueAdmin\Kernel\Database\Model;
use Hyperf\Database\Model\Relations\BelongsToMany;
use Hyperf\Database\Model\SoftDeletes;

final class AdminUser extends Model
{
    use SoftDeletes;

    protected ?string $table = 'admin_users';

    protected array $fillable = [
        'username',
        'password',
        'nickname',
        'avatar',
        'preferences',
        'status',
        'primary_dept_id',
        'created_by',
        'updated_by',
    ];

    protected array $hidden = [
        'password',
    ];

    protected array $casts = [
        'preferences' => 'array',
    ];

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(AdminRole::class, 'admin_role_user', 'user_id', 'role_id');
    }

    public function departments(): BelongsToMany
    {
        return $this->belongsToMany(AdminDepartment::class, 'admin_user_departments', 'user_id', 'dept_id');
    }
}
