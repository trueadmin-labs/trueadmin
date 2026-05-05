<?php

declare(strict_types=1);

namespace App\Module\System\Model;

use App\Foundation\Database\Model;
use Hyperf\Database\Model\Relations\BelongsToMany;

final class AdminRole extends Model
{
    protected ?string $table = 'admin_roles';

    protected array $fillable = [
        'parent_id',
        'code',
        'name',
        'level',
        'path',
        'sort',
        'status',
    ];

    public function menus(): BelongsToMany
    {
        return $this->belongsToMany(AdminMenu::class, 'admin_role_menu', 'role_id', 'menu_id');
    }
}
