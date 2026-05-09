<?php

declare(strict_types=1);

namespace App\Foundation\Query;

final class AdminQuery
{
    /**
     * @param array<string, mixed> $filters
     * @param array<string, string> $operators
     * @param array<string, mixed> $params
     */
    public function __construct(
        public readonly int $page = 1,
        public readonly int $pageSize = 20,
        public readonly string $keyword = '',
        public readonly array $filters = [],
        public readonly array $operators = [],
        public readonly array $params = [],
        public readonly string $sort = '',
        public readonly string $order = 'asc',
    ) {
    }

    public function hasParam(string $field): bool
    {
        return array_key_exists($field, $this->params);
    }

    public function param(string $field, mixed $default = null): mixed
    {
        return $this->params[$field] ?? $default;
    }

    public function hasFilter(string $field): bool
    {
        return array_key_exists($field, $this->filters);
    }

    public function filter(string $field, mixed $default = null): mixed
    {
        return $this->filters[$field] ?? $default;
    }

    public function operator(string $field, string $default = '='): string
    {
        return $this->operators[$field] ?? $default;
    }
}
