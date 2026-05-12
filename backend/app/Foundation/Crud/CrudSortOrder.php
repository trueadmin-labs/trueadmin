<?php

declare(strict_types=1);

namespace App\Foundation\Crud;

enum CrudSortOrder: string
{
    case Asc = 'asc';
    case Desc = 'desc';
}
