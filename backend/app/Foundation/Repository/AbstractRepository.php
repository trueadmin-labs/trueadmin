<?php

declare(strict_types=1);

namespace App\Foundation\Repository;

use App\Foundation\Pagination\PageResult;
use App\Foundation\Query\AdminQuery;

abstract class AbstractRepository
{
    /**
     * @var list<string>
     */
    protected array $keywordFields = [];

    /**
     * @var array<string, bool|list<string>>
     */
    protected array $filterable = [];

    /**
     * @var list<string>
     */
    protected array $sortable = [];

    /**
     * @var array<string, string>
     */
    protected array $defaultSort = ['id' => 'desc'];

    protected function pageQuery(mixed $query, AdminQuery $adminQuery, callable $mapper): PageResult
    {
        $this->handleSearch($query, $adminQuery);

        $total = (int) (clone $query)->count();
        $items = $query
            ->forPage($adminQuery->page, $adminQuery->pageSize)
            ->get()
            ->map($mapper)
            ->all();

        return new PageResult($items, $total, $adminQuery->page, $adminQuery->pageSize);
    }

    protected function listQuery(mixed $query, AdminQuery $adminQuery, callable $mapper): array
    {
        $this->handleSearch($query, $adminQuery);

        return $query->get()->map($mapper)->all();
    }

    protected function handleSearch(mixed $query, AdminQuery $adminQuery): void
    {
        $this->applyKeyword($query, $adminQuery);
        $this->applyFilters($query, $adminQuery);
        $this->applySort($query, $adminQuery);
    }

    protected function applyKeyword(mixed $query, AdminQuery $adminQuery): void
    {
        if ($adminQuery->keyword === '' || $this->keywordFields === []) {
            return;
        }

        $keyword = '%' . $adminQuery->keyword . '%';
        $fields = $this->keywordFields;
        $query->where(static function ($query) use ($fields, $keyword): void {
            foreach ($fields as $index => $field) {
                $method = $index === 0 ? 'where' : 'orWhere';
                $query->{$method}($field, 'like', $keyword);
            }
        });
    }

    protected function applyFilters(mixed $query, AdminQuery $adminQuery): void
    {
        foreach ($adminQuery->filters as $field => $value) {
            if (! is_string($field) || ! $this->isFilterable($field, $adminQuery->operator($field))) {
                continue;
            }

            $operator = $adminQuery->operator($field);
            if ($operator === 'like') {
                $query->where($field, 'like', '%' . (string) $value . '%');
                continue;
            }
            if ($operator === 'in') {
                $values = is_array($value) ? $value : explode(',', (string) $value);
                $values = array_values(array_filter($values, static fn (mixed $item): bool => $item !== '' && $item !== null));
                if ($values !== []) {
                    $query->whereIn($field, $values);
                }
                continue;
            }
            if ($operator === 'between') {
                $values = is_array($value) ? array_values($value) : explode(',', (string) $value, 2);
                if (count($values) >= 2 && $values[0] !== '' && $values[1] !== '') {
                    $query->whereBetween($field, [$values[0], $values[1]]);
                }
                continue;
            }

            $query->where($field, $operator, $value);
        }
    }

    protected function applySort(mixed $query, AdminQuery $adminQuery): void
    {
        if ($adminQuery->sort !== '' && in_array($adminQuery->sort, $this->sortable, true)) {
            $query->orderBy($adminQuery->sort, $adminQuery->order === 'desc' ? 'desc' : 'asc');
            return;
        }

        foreach ($this->defaultSort as $field => $direction) {
            $query->orderBy($field, strtolower($direction) === 'desc' ? 'desc' : 'asc');
        }
    }

    private function isFilterable(string $field, string $operator): bool
    {
        if (! array_key_exists($field, $this->filterable)) {
            return false;
        }

        $allowed = $this->filterable[$field];
        if ($allowed === true) {
            return true;
        }

        return in_array($operator, $allowed, true);
    }
}
