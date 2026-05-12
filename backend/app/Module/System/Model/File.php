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

use TrueAdmin\Kernel\Database\Model;
use Hyperf\Database\Model\SoftDeletes;

final class File extends Model
{
    use SoftDeletes;

    protected ?string $table = 'files';

    protected array $fillable = [
        'scope',
        'owner_type',
        'owner_id',
        'owner_dept_id',
        'category',
        'disk',
        'visibility',
        'name',
        'extension',
        'mime_type',
        'size',
        'hash',
        'path',
        'url',
        'status',
        'metadata',
    ];

    protected array $casts = [
        'metadata' => 'array',
    ];
}
