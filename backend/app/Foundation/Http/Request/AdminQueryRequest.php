<?php

declare(strict_types=1);

namespace App\Foundation\Http\Request;

use App\Foundation\Query\AdminQuery;

class AdminQueryRequest extends FormRequest
{
    protected int $defaultPageSize = 20;

    protected int $maxPageSize = 100;

    protected int $maxFilterFields = 20;

    /**
     * Query keys used by CRUD infrastructure itself. Other scalar keys are treated as flat params.
     *
     * @var list<string>
     */
    protected array $reservedQueryKeys = ['page', 'pageSize', 'keyword', 'filter', 'op', 'sort', 'order'];

    public function rules(): array
    {
        return [
            'page' => ['sometimes', 'integer', 'min:1'],
            'pageSize' => ['sometimes', 'integer', 'min:1', 'max:' . $this->maxPageSize],
            'keyword' => ['sometimes', 'string', 'max:100'],
            'filter' => ['sometimes'],
            'op' => ['sometimes'],
            'sort' => ['sometimes', 'string', 'max:64'],
            'order' => ['sometimes', 'string', 'in:asc,desc'],
        ];
    }

    protected function normalize(array $data): array
    {
        $params = $this->flatParams($this->all());
        $filters = array_slice($this->decodeMap($data['filter'] ?? []), 0, $this->maxFilterFields, true);

        return [
            'page' => (int) ($data['page'] ?? 1),
            'pageSize' => (int) ($data['pageSize'] ?? $this->defaultPageSize),
            'keyword' => trim((string) ($data['keyword'] ?? '')),
            'filter' => $filters,
            'op' => $this->decodeOperators($data['op'] ?? [], array_keys($filters)),
            'params' => $params,
            'sort' => trim((string) ($data['sort'] ?? '')),
            'order' => strtolower((string) ($data['order'] ?? 'asc')),
        ];
    }

    public function adminQuery(): AdminQuery
    {
        $validated = $this->validated();

        return new AdminQuery(
            page: $validated['page'],
            pageSize: $validated['pageSize'],
            keyword: $validated['keyword'],
            filters: $validated['filter'],
            operators: $validated['op'],
            params: $validated['params'],
            sort: $validated['sort'],
            order: $validated['order'],
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function flatParams(array $data): array
    {
        $params = [];
        foreach ($data as $field => $value) {
            if (! is_string($field) || in_array($field, $this->reservedQueryKeys, true)) {
                continue;
            }
            if (! preg_match('/^[A-Za-z0-9_.]+$/', $field) || $value === null || $value === '' || $value === 'all') {
                continue;
            }
            if (is_scalar($value) || is_array($value)) {
                $params[$field] = $value;
            }
        }

        return $params;
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeMap(mixed $value): array
    {
        if (is_string($value) && $value !== '') {
            $decoded = json_decode($value, true);
            $value = is_array($decoded) ? $decoded : [];
        }
        if (! is_array($value)) {
            return [];
        }

        $result = [];
        foreach ($value as $field => $fieldValue) {
            if (! is_string($field) || ! preg_match('/^[A-Za-z0-9_.]+$/', $field)) {
                continue;
            }
            $result[$field] = $fieldValue;
        }

        return $result;
    }

    /**
     * @param list<string> $filterFields
     * @return array<string, string>
     */
    private function decodeOperators(mixed $value, array $filterFields): array
    {
        $operators = $this->decodeMap($value);
        $allowed = ['=', '<>', '>', '>=', '<', '<=', 'like', 'in', 'between'];
        $result = [];
        foreach ($filterFields as $field) {
            $operator = strtolower((string) ($operators[$field] ?? '='));
            $result[$field] = in_array($operator, $allowed, true) ? $operator : '=';
        }

        return $result;
    }
}
