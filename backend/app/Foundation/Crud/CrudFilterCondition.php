<?php

declare(strict_types=1);

namespace App\Foundation\Crud;

final class CrudFilterCondition
{
    public function __construct(
        public readonly string $field,
        public readonly CrudOperator $op,
        public readonly mixed $value = null,
    ) {
    }
}
