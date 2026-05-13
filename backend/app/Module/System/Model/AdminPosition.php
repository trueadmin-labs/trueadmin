<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace App\Module\System\Model;

use Hyperf\Database\Model\Relations\BelongsTo;
use Hyperf\Database\Model\Relations\BelongsToMany;
use TrueAdmin\Kernel\Database\Model;

final class AdminPosition extends Model
{
    protected ?string $table = 'admin_positions';

    protected array $fillable = [
        'dept_id',
        'code',
        'name',
        'type',
        'is_leadership',
        'description',
        'sort',
        'status',
        'created_by',
        'updated_by',
    ];

    protected array $casts = [
        'is_leadership' => 'bool',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(AdminDepartment::class, 'dept_id', 'id');
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(AdminRole::class, 'admin_position_roles', 'position_id', 'role_id');
    }
}
