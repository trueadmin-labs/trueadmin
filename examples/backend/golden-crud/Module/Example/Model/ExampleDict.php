<?php

declare(strict_types=1);

namespace App\Module\Example\Model;

use App\Foundation\Database\Model;

final class ExampleDict extends Model
{
    protected ?string $table = 'example_dicts';

    protected array $fillable = [
        'code',
        'name',
        'status',
        'sort',
        'remark',
    ];
}
